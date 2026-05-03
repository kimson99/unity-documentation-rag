import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

RESULTS_DIR = Path(__file__).parent / "results"
CHARTS_DIR = Path(__file__).parent / "charts"
METRICS = ["faithfulness", "answer_relevancy", "context_precision"]
METRIC_LABELS = ["Faithfulness", "Answer Relevancy", "Context Precision"]
METRIC_LABEL_MAP = dict(zip(METRICS, METRIC_LABELS))

EXPERIMENT_ORDER = ["baseline", "chunk-500", "chunk-1000", "topk-3", "topk-10", "mmr", "hybrid"]


def load_results() -> pd.DataFrame:
    csvs = list(RESULTS_DIR.glob("*.csv"))
    if not csvs:
        print(f"No CSVs found in {RESULTS_DIR}")
        sys.exit(1)
    df = pd.concat([pd.read_csv(f) for f in csvs], ignore_index=True)
    present = [e for e in EXPERIMENT_ORDER if e in df["experiment"].unique()]
    df["experiment"] = pd.Categorical(df["experiment"], categories=present, ordered=True)
    print(f"Loaded {len(df)} rows from {len(csvs)} experiment(s): {present}")
    return df


def experiment_dir(experiment: str) -> Path:
    d = CHARTS_DIR / experiment
    d.mkdir(parents=True, exist_ok=True)
    return d


# --- Per-experiment charts ---

def plot_distribution(df: pd.DataFrame, experiment: str):
    data = df[df["experiment"] == experiment]
    fig, axes = plt.subplots(1, len(METRICS), figsize=(13, 4))

    for ax, metric, label in zip(axes, METRICS, METRIC_LABELS):
        vals = data[metric].dropna()
        ax.hist(vals, bins=10, range=(0, 1), color="steelblue", edgecolor="white")
        ax.axvline(vals.mean(), color="red", linestyle="--", linewidth=1.2, label=f"mean={vals.mean():.2f}")
        ax.set_title(label)
        ax.set_xlim(0, 1)
        ax.set_xlabel("Score")
        ax.legend(fontsize=8)

    plt.suptitle(f"Score Distribution — {experiment}", fontsize=13)
    plt.tight_layout()
    out = experiment_dir(experiment) / "distribution.png"
    plt.savefig(out, dpi=150)
    print(f"  Saved → {out}")
    plt.close()


def plot_topic_breakdown(df: pd.DataFrame, experiment: str):
    if "topic" not in df.columns:
        return
    data = df[df["experiment"] == experiment]
    topic_means = data.groupby("topic")[METRICS].mean()

    fig, ax = plt.subplots(figsize=(10, max(4, len(topic_means) * 0.5)))
    sns.heatmap(
        topic_means,
        annot=True, fmt=".2f", vmin=0, vmax=1,
        cmap="RdYlGn", linewidths=0.5, ax=ax,
        xticklabels=METRIC_LABELS,
    )
    ax.set_title(f"Scores by Topic — {experiment}")
    ax.set_xlabel("")
    ax.set_ylabel("")
    plt.tight_layout()
    out = experiment_dir(experiment) / "topic_breakdown.png"
    plt.savefig(out, dpi=150)
    print(f"  Saved → {out}")
    plt.close()


# --- Comparative charts ---

def plot_mean_scores(df: pd.DataFrame):
    means = df.groupby("experiment", observed=True)[METRICS].mean().reset_index()
    melted = means.melt(id_vars="experiment", var_name="metric", value_name="score")
    melted["metric"] = melted["metric"].map(METRIC_LABEL_MAP)

    fig, ax = plt.subplots(figsize=(11, 6))
    sns.barplot(data=melted, x="metric", y="score", hue="experiment", ax=ax)
    ax.set_ylim(0, 1)
    ax.set_title("Mean RAGAS Scores by Experiment")
    ax.set_xlabel("")
    ax.set_ylabel("Score")
    ax.legend(title="Experiment", bbox_to_anchor=(1.05, 1), loc="upper left")
    plt.tight_layout()
    out = CHARTS_DIR / "mean_scores.png"
    plt.savefig(out, dpi=150)
    print(f"  Saved → {out}")
    plt.close()


def plot_heatmap(df: pd.DataFrame):
    means = df.groupby("experiment", observed=True)[METRICS].mean()
    means.columns = METRIC_LABELS

    fig, ax = plt.subplots(figsize=(7, max(3, len(means) * 0.6)))
    sns.heatmap(
        means, annot=True, fmt=".3f", vmin=0, vmax=1,
        cmap="RdYlGn", linewidths=0.5, ax=ax,
    )
    ax.set_title("Mean Scores — All Experiments")
    ax.set_xlabel("")
    ax.set_ylabel("")
    plt.tight_layout()
    out = CHARTS_DIR / "heatmap.png"
    plt.savefig(out, dpi=150)
    print(f"  Saved → {out}")
    plt.close()


def plot_latency(df: pd.DataFrame):
    if "latency_ms" not in df.columns:
        return
    means = df.groupby("experiment", observed=True)["latency_ms"].mean().reset_index()

    fig, ax = plt.subplots(figsize=(9, 5))
    sns.barplot(data=means, x="experiment", y="latency_ms", ax=ax, color="steelblue")
    ax.set_title("Mean Latency by Experiment")
    ax.set_xlabel("")
    ax.set_ylabel("Latency (ms)")
    ax.tick_params(axis="x", rotation=20)
    plt.tight_layout()
    out = CHARTS_DIR / "latency.png"
    plt.savefig(out, dpi=150)
    print(f"  Saved → {out}")
    plt.close()


def print_summary(df: pd.DataFrame):
    print("\nMean scores per experiment:")
    print(df.groupby("experiment", observed=True)[METRICS].mean().round(3).to_string())


if __name__ == "__main__":
    CHARTS_DIR.mkdir(exist_ok=True)
    df = load_results()
    print_summary(df)

    print("\nComparative charts:")
    plot_mean_scores(df)
    plot_heatmap(df)
    plot_latency(df)

    print("\nPer-experiment charts:")
    for exp in df["experiment"].cat.categories:
        print(f"  {exp}/")
        plot_distribution(df, exp)
        plot_topic_breakdown(df, exp)
