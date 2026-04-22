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

    const testCases: {
      inputs: { question: string };
      outputs: { expected: string };
    }[] = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../common/unity_dataset.json'),
        'utf-8',
      ),
    );

    for (const testCase of testCases) {
      const example: ExampleCreate = {
        inputs: testCase.inputs,
        outputs: testCase.outputs,
        dataset_id: dataset.id,
      };
      await client.createExample(example);
    }
  }

  const exactMatchEvaluator = async ({ run, example }: any) => {
    const generatedAnswer = run.outputs?.output || run.outputs?.text;
    const expectedAnswer = example.outputs?.expected;

    const isMatch = generatedAnswer
      .toLowerCase()
      .includes(expectedAnswer.toLowerCase());

    return {
      key: 'correctness',
      score: isMatch ? 1 : 0,
    };
  };

  await evaluate(
    async (input) => {
      return await service.evaluateChat(input.question);
    },
    {
      data: datasetName,
      evaluators: [exactMatchEvaluator],
      experimentPrefix: 'unity-rag-agent-eval',
    },
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = await app.get(AgentService);
  await runEvaluation(service);
  await app.close();
}
bootstrap();
