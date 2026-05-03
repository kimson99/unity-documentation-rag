import argparse
import csv
import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

USE_VERTEX = os.getenv("USE_VERTEX", "false").lower() == "true"
from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.metrics import AnswerRelevancy, ContextPrecision, Faithfulness
from ragas.run_config import RunConfig

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5500")
DATASET_PATH = Path(__file__).parent.parent / "backend/src/common/unity_dataset.json"
RESULTS_DIR = Path(__file__).parent / "results"
METRIC_COLS = ["faithfulness", "answer_relevancy", "context_precision"]
CSV_FIELDNAMES = ["user_input", "retrieved_contexts", "response", "reference"] + METRIC_COLS + ["experiment"]


def load_dataset() -> list:
    with open(DATASET_PATH) as f:
        return json.load(f)


def sample_dataset(dataset: list, per_topic: int | None, limit: int | None) -> list:
    if per_topic is not None:
        by_topic: dict[str, list] = {}
        for item in dataset:
            topic = item.get("topic", "unknown")
            by_topic.setdefault(topic, []).append(item)
        return [item for items in by_topic.values() for item in items[:per_topic]]
    if limit is not None:
        return dataset[:limit]
    return dataset


def query_backend(question: str) -> dict:
    for attempt in range(5):
        try:
            resp = requests.post(
                f"{BACKEND_URL}/api/chat/evaluate",
                json={"question": question},
                timeout=300,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.Timeout:
            if attempt < 4:
                delay = 2 ** attempt
                print(f"\n  Timeout, retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429 and attempt < 4:
                delay = (2 ** attempt) * 10
                print(f"\n  Rate limited (429), retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise


def make_llm_and_embeddings():
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

    if USE_VERTEX:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            vertexai=True,
            response_mime_type="application/json",
        )
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", vertexai=True)
    else:
        api_key = os.environ["GOOGLE_API_KEY"]
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            response_mime_type="application/json",
        )
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)

    return llm, embeddings


def load_completed(out_path: Path) -> set[str]:
    if not out_path.exists():
        return set()
    with open(out_path, newline="") as f:
        return {row["user_input"] for row in csv.DictReader(f)}


def run(experiment: str, per_topic: int | None = None, limit: int | None = None):
    llm, embeddings = make_llm_and_embeddings()
    metrics = [
        Faithfulness(llm=llm),
        AnswerRelevancy(llm=llm, embeddings=embeddings),
        ContextPrecision(llm=llm),
    ]
    run_config = RunConfig(timeout=180, max_retries=3, max_wait=60)

    print(f"Loading dataset from {DATASET_PATH}...")
    dataset = load_dataset()
    items = sample_dataset(dataset, per_topic, limit)
    sampling = f"per_topic={per_topic}" if per_topic else f"limit={limit}" if limit else "all"
    print(f"  {len(dataset)} total samples, using {len(items)} ({sampling})")

    RESULTS_DIR.mkdir(exist_ok=True)
    out_path = RESULTS_DIR / f"{experiment}.csv"

    completed = load_completed(out_path)
    if completed:
        print(f"  Resuming: {len(completed)} already done, skipping")

    pending = [item for item in items if item["inputs"]["question"] not in completed]
    print(f"  {len(pending)} questions to process\n")

    if not pending:
        print("Nothing to do.")
        return

    failed = 0
    write_header = not out_path.exists()

    with open(out_path, "a", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_FIELDNAMES)
        if write_header:
            writer.writeheader()

        for i, item in enumerate(pending):
            question = item["inputs"]["question"]
            reference = item["outputs"]["expected"]
            print(f"  [{i + 1}/{len(pending)}] {question[:70]}")

            try:
                result = query_backend(question)
                sample = SingleTurnSample(
                    user_input=question,
                    response=result["answer"],
                    retrieved_contexts=result["contexts"],
                    reference=reference,
                )
                scores = evaluate(
                    dataset=EvaluationDataset(samples=[sample]),
                    metrics=metrics,
                    run_config=run_config,
                )
                row = scores.to_pandas().iloc[0]
                writer.writerow({
                    "user_input": question,
                    "retrieved_contexts": str(result["contexts"]),
                    "response": result["answer"],
                    "reference": reference,
                    **{col: row.get(col, "") for col in METRIC_COLS},
                    "experiment": experiment,
                })
                csvfile.flush()
                scores_str = "  ".join(
                    f"{col}={row.get(col):.3f}" for col in METRIC_COLS if row.get(col) is not None
                )
                print(f"    -> {scores_str}")
            except Exception as e:
                failed += 1
                print(f"    FAILED: {e}")

            time.sleep(2)

    with open(out_path, newline="") as f:
        all_rows = list(csv.DictReader(f))

    succeeded = len(pending) - failed
    print(f"\n{'=' * 40}")
    print(f"  Results saved -> {out_path}")
    print(f"  This run:  {len(pending)} processed  |  {succeeded} succeeded  |  {failed} failed")
    if completed:
        print(f"  Skipped (already done): {len(completed)}")
    if failed:
        print(f"  Re-run the same command to retry the {failed} failed question(s).")
    print(f"\n  Mean scores across all {len(all_rows)} completed so far:")
    for col in METRIC_COLS:
        vals = [float(r[col]) for r in all_rows if r.get(col) and r[col] not in ("", "nan")]
        if vals:
            print(f"    {col}: {sum(vals) / len(vals):.3f}  (n={len(vals)})")
    print("=" * 40)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run RAGAS evaluation against the Unity RAG backend")
    parser.add_argument("--experiment", required=True, help="Experiment name, e.g. baseline, chunk-500")
    parser.add_argument("--per-topic", type=int, default=None, help="Questions per topic (stratified, deterministic). Use for real runs, e.g. --per-topic 5")
    parser.add_argument("--limit", type=int, default=None, help="Take first N questions regardless of topic. Use for quick smoke tests only.")
    args = parser.parse_args()

    run(args.experiment, args.per_topic, args.limit)
