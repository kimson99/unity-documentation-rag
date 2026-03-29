import { ChatGoogle } from '@langchain/google';
import { Injectable } from '@nestjs/common';
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

  public async streamChat(message: string): Promise<void> {
    const aiMsg = (await this.agent.invoke({
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      config: {
        configurable: { thread_id: 1 },
        context: { user_id: 1 },
      },
    })) as z.infer<typeof this.responseSchema>;
    console.log(aiMsg);
  }
}
