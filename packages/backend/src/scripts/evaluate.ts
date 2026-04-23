import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import fs from 'fs';
import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import { ExampleCreate } from 'langsmith/schemas';
import path from 'path';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { QueueModule } from 'src/database/queue.module';
import { AgentModule } from 'src/modules/agent/agent.module';
import { AgentService } from 'src/modules/agent/agent.service';

@Module({
  imports: [ConfigModule, DatabaseModule, AgentModule, QueueModule],
})
class AppModule {}

async function runEvaluation(service: AgentService) {
  const datasetName = 'Unity Docs Test Dataset';
  const client = new Client();
  if (!(await client.hasDataset({ datasetName }))) {
    const dataset = await client.createDataset(datasetName);

    const testCases = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../common/unity_dataset.json'),
        'utf-8',
      ),
    ) as Array<{
      inputs: { question: string };
      outputs: { expected: string };
    }>;

    for (const testCase of testCases) {
      const example: ExampleCreate = {
        inputs: testCase.inputs,
        outputs: testCase.outputs,
        dataset_id: dataset.id,
      };
      await client.createExample(example);
    }
  }

  const exactMatchEvaluator = ({
    run,
    example,
  }: {
    run: { outputs?: Record<string, unknown> };
    example: { outputs?: Record<string, unknown> };
  }) => {
    const safeToLower = (value: unknown) => {
      if (typeof value === 'string') return value.toLowerCase();
      if (value === null || value === undefined) return '';
      if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString().toLowerCase();
      }
      if (typeof value === 'bigint') return value.toString().toLowerCase();
      if (typeof value === 'symbol') {
        return (value.description ?? value.toString()).toLowerCase();
      }
      if (typeof value === 'function') return (value.name ?? '').toLowerCase();
      return JSON.stringify(value).toLowerCase();
    };

    const generatedAnswer = safeToLower(
      run.outputs?.output ?? run.outputs?.text ?? '',
    );
    const expectedAnswer = safeToLower(example.outputs?.expected ?? '');

    const isMatch =
      expectedAnswer.length > 0 && generatedAnswer.includes(expectedAnswer);

    return {
      key: 'correctness',
      score: isMatch ? 1 : 0,
    };
  };

  await evaluate(
    async (input: { question: string }) => service.evaluateChat(input.question),
    {
      data: datasetName,
      evaluators: [exactMatchEvaluator],
      experimentPrefix: 'unity-rag-agent-eval',
    },
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AgentService);
  await runEvaluation(service);
  await app.close();
}
void bootstrap();
