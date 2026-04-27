import * as fs from 'fs';
import { ChatGoogle } from '@langchain/google';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import path from 'path';
import { extractHtmlToMarkdown } from 'src/common/html-extractor';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from 'src/config/config.service';

const TOPICS: Record<string, string[]> = {
  navmesh: ['navmesh', 'nav-mesh'],
  physics: ['physics', 'rigidbody', 'collider', 'collision', 'raycast'],
  animation: ['animation', 'animator', 'blend-tree'],
  lighting: [
    'lighting',
    'light-',
    'shadows',
    'lightmap',
    'global-illumination',
  ],
  audio: ['audio'],
  ui: ['ui-', 'canvas', 'ugui', 'uielements'],
  camera: ['camera'],
  scripting: ['scripting', 'monobehaviour', 'coroutine', 'execution-order'],
  shader: ['shader', 'shaderlab'],
  rendering: ['render-pipeline', 'urp-', 'hdrp-'],
  '2d': ['2d-physics', '2d-sprite', '2d-tilemap', '2d-light'],
  prefabs: ['prefab'],
  input: ['input-system', 'input-'],
  particles: ['particle', 'vfx'],
};

interface QAPair {
  inputs: { question: string };
  outputs: { expected: string };
  topic: string;
  source: string;
}

@Injectable()
class GenerateEvalDatasetService {
  constructor(private readonly configService: ConfigService) {}

  private sampleFiles(
    docsDir: string,
    filesPerTopic: number,
  ): Array<{ file: string; topic: string }> {
    const allFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith('.html'));
    const manualFiles = allFiles.filter(
      (f) => (f.match(/\./g) ?? []).length === 1,
    );

    const selected: Array<{ file: string; topic: string }> = [];
    const used = new Set<string>();

    for (const [topic, keywords] of Object.entries(TOPICS)) {
      const matches = manualFiles.filter((f) =>
        keywords.some((kw) => f.toLowerCase().includes(kw.toLowerCase())),
      );
      const pool = matches.filter(
        (f) => !f.includes('landing') && !f.includes('-index'),
      );
      const source = pool.length >= filesPerTopic ? pool : matches;

      let count = 0;
      for (const f of source) {
        if (count >= filesPerTopic) break;
        if (used.has(f)) continue;
        selected.push({ file: f, topic });
        used.add(f);
        count++;
      }

      console.log(`  ${topic}: ${count} files`);
    }

    return selected;
  }

  private async generateQA(
    text: string,
    filename: string,
    topic: string,
    qaPerFile: number,
  ): Promise<Array<{ question: string; answer: string }>> {
    const { apiKey, useVertex } = this.configService.googleChatConfig;
    const model = new ChatGoogle({
      model: 'gemini-2.5-flash',
      apiKey,
      ...(useVertex ? { platformType: 'gcp' } : {}),
    });

    const prompt = `You are building an evaluation dataset for a Unity documentation RAG system.

Given the following Unity documentation, generate exactly ${qaPerFile} factual question-answer pairs.

Rules:
- Questions must be answerable ONLY using the provided text
- Answers should be concise (1-3 sentences)
- Avoid trivial yes/no questions
- Focus on concepts, how-to, and definitions
- Do NOT reference "this document" or "the text" in questions

Return a JSON array only, no markdown, no explanation:
[{ "question": "...", "answer": "..." }]

Documentation (topic: ${topic}, file: ${filename}):
${text.substring(0, 6000)}`;

    const result = await model.invoke(prompt);
    const raw = (result.content as string)
      .trim()
      .replace(/^```json?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return JSON.parse(raw) as Array<{ question: string; answer: string }>;
  }

  async run(
    docsDir: string,
    outputFile: string,
    filesPerTopic: number,
    qaPerFile: number,
  ) {
    console.log(`Scanning ${docsDir}...`);
    const selected = this.sampleFiles(docsDir, filesPerTopic);
    console.log(`\nTotal: ${selected.length} files\n`);

    const dataset: QAPair[] = [];
    let failed = 0;

    for (let i = 0; i < selected.length; i++) {
      const { file, topic } = selected[i];
      process.stdout.write(`[${i + 1}/${selected.length}] ${file} ... `);

      try {
        const html = fs.readFileSync(path.join(docsDir, file), 'utf-8');
        const text = extractHtmlToMarkdown(html);

        if (text.length < 300) {
          console.log('skipped (too short)');
          continue;
        }

        const pairs = await this.generateQA(text, file, topic, qaPerFile);

        for (const pair of pairs) {
          dataset.push({
            inputs: { question: pair.question },
            outputs: { expected: pair.answer },
            topic,
            source: file,
          });
        }

        console.log(`✓ ${pairs.length} pairs`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`✗ ${(err as Error).message}`);
        failed++;
      }
    }

    const usedFiles = [
      ...new Set(dataset.map((d) => path.join(docsDir, d.source))),
    ];
    const filesListPath = outputFile.replace(/\.json$/, '-files.json');

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2));
    fs.writeFileSync(filesListPath, JSON.stringify(usedFiles, null, 2));

    console.log(`\nDone: ${dataset.length} QA pairs, ${failed} failed`);
    console.log(`Dataset  → ${outputFile}`);
    console.log(`Files    → ${filesListPath}`);
  }
}

@Module({
  imports: [ConfigModule],
  providers: [GenerateEvalDatasetService],
})
class AppModule {}

async function bootstrap() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const docsDir = get('--dir');
  if (!docsDir) {
    console.error(
      'Usage: pnpm ts src/scripts/generate-eval-dataset.ts --dir <path> [--output <file>] [--files-per-topic <n>] [--qa-per-file <n>]',
    );
    process.exit(1);
  }

  const outputFile =
    get('--output') ?? path.resolve(__dirname, '../common/unity_dataset.json');
  const filesPerTopic = get('--files-per-topic')
    ? parseInt(get('--files-per-topic')!)
    : 10;
  const qaPerFile = get('--qa-per-file') ? parseInt(get('--qa-per-file')!) : 3;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = app.get(GenerateEvalDatasetService);
    await service.run(
      path.resolve(docsDir),
      outputFile,
      filesPerTopic,
      qaPerFile,
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
