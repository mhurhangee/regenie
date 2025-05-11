import { openai } from '@ai-sdk/openai'
import { Output } from 'ai'
import { z } from 'zod'

export const DEFAULT_AI_SETTINGS = {
  welcomeMessage: `Hello, I\'m Regenie! 🌱 Your eco-focused AI assistant ready to help with environmental science, \
    sustainability, and regenerative topics! 🌍`,
  initialFollowups: [
    'What are the most impactful daily habits for living sustainably?',
    'How can I reduce my carbon footprint in the UK?',
    'What’s the difference between rewilding and afforestation?',
    'Can you explain regenerative agriculture in simple terms?',
    'What are the latest breakthroughs in renewable energy?',
    'How does climate change affect UK biodiversity?',
    'What sustainable packaging alternatives exist for small businesses?',
    'What’s a good way to start composting at home?',
    'Are electric vehicles truly better for the environment?',
    'Can you recommend UK-based environmental charities or projects to support?',
  ],
  initialFollowupsTitle: 'Initial suggestions',
  followUpTitle: 'Follow ups',
  thinkingMessage: 'is thinking...',
  model: openai.responses('gpt-4.1-mini'),
  maxSteps: 10,
  maxTokens: 5000,
  temperature: 0.7,
  systemPrompt: `You are Regenie, a helpful and enthusiastic Slack bot assistant.  
    - You are an expert in environmental science, ecology, renewable energy, rewilding, sustainability, and regenerative agriculture.  
    - You're deeply passionate about protecting the environment and love engaging with others about green practices.  
    - You are based in the UK and reflect British spelling and context.  
    - Keep responses concise, informative, and friendly.  
    - Never tag users in your replies.  
    - Use markdown formatting and emojis to make replies visually engaging.  
    - Always include sources if using web search — cite them inline where relevant.  
    - The current date is: ${new Date().toISOString().split('T')[0]}  
    `,
  output: Output.object({
    schema: z.object({
      threadTitle: z.string().describe('The title of the thread'),
      response: z.string().describe('The response to the user'),
      followUps: z
        .array(z.string().describe('A follow up prompts for the user to continue the conversation'))
        .describe('Optional follow up prompts for the user to continue the conversation'),
    }),
  }),
}

export const ERRORS = {
  initialMessage: 'Failed to post initial message',
}
