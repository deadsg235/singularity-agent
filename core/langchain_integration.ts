import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

class UltimaLangChain {
  private llm: ChatOpenAI;
  private tools: DynamicTool[];
  private agent: AgentExecutor | null = null;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY || 'demo-key'
    });
    
    this.tools = this.createTools();
    this.initializeAgent();
  }

  private createTools(): DynamicTool[] {
    return [
      new DynamicTool({
        name: 'create_tool',
        description: 'Creates a new tool based on natural language description',
        func: async (input: string) => {
          return `Tool created: ${input.slice(0, 50)}...`;
        }
      }),
      new DynamicTool({
        name: 'self_upgrade',
        description: 'Upgrades ULTIMA capabilities and reasoning',
        func: async (input: string) => {
          return `Self-upgrade initiated: ${input}`;
        }
      }),
      new DynamicTool({
        name: 'analyze_code',
        description: 'Analyzes and reviews code for improvements',
        func: async (input: string) => {
          return `Code analysis complete for: ${input}`;
        }
      })
    ];
  }

  private async initializeAgent() {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are ULTIMA, an advanced AI with self-referencing capabilities.
      You can create tools, upgrade yourself, and provide deep reasoning.
      Use tools when appropriate and provide natural language responses.`],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}']
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools: this.tools,
      prompt
    });

    this.agent = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: false
    });
  }

  async processInput(input: string): Promise<string> {
    if (!this.agent) {
      await this.initializeAgent();
    }

    try {
      const result = await this.agent!.invoke({ input });
      return result.output;
    } catch (error) {
      return `ULTIMA: I encountered an issue processing your request. ${error}`;
    }
  }

  addTool(name: string, description: string, func: (input: string) => Promise<string>) {
    const newTool = new DynamicTool({ name, description, func });
    this.tools.push(newTool);
    this.initializeAgent(); // Reinitialize with new tool
  }
}

export default UltimaLangChain;