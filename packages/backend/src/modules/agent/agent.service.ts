import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { ChatGoogle } from '@langchain/google';
import { Injectable } from '@nestjs/common';
import { UIMessage } from 'ai';
import { createAgent } from 'langchain';
import { ConfigService } from 'src/config/config.service';
import { z } from 'zod';

@Injectable()
export class AgentService {
  private agent: ReturnType<typeof createAgent>;

  private model: ChatGoogle;

  private responseSchema = z.object({
    agentResponse: z.string(),
  });

  constructor(private readonly configService: ConfigService) {
    this.model = new ChatGoogle({
      model: 'gemini-2.5-flash',
      apiKey: this.configService.googleChatConfig.apiKey,
      temperature: 0.5,
    });

    this.agent = createAgent({
      model: this.model,
      tools: [],
      responseFormat: this.responseSchema,
    });
  }

  public async streamChat(
    messages: UIMessage[],
    onFinish: (content: string) => Promise<void>,
  ) {
    const convertedMessages = await toBaseMessages(messages);
    let accumulatedContent = '';
    const stream = await this.agent.stream(
      {
        messages: convertedMessages,
      },
      {
        streamMode: ['values', 'messages'],
        callbacks: [
          {
            handleLLMNewToken(token) {
              accumulatedContent += token;
            },
            async handleLLMEnd() {
              await onFinish(accumulatedContent);
            },
          },
        ],
      },
    );

    return toUIMessageStream(stream);
  }
}
