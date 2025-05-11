import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import slackifyMarkdown from 'slackify-markdown'
import { DEFAULT_AI_SETTINGS } from './constants'

// Define the type for messages to match the CoreMessage structure
export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generates a response using OpenAI API with error handling and retry mechanism
 * @param messages Array of messages in the conversation
 * @param updateStatus Optional callback to update status during processing
 * @returns The generated response with threadTitle, response text, and followUps
 */
export const generateResponse = async (
  messages: Message[],
  updateStatus?: (status: string) => void
) => {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second delay between retries

  // Prepare system message
  const systemMessage = {
    role: 'system' as const,
    content: `${DEFAULT_AI_SETTINGS.systemPrompt}\n\n${DEFAULT_AI_SETTINGS.structuredAdditionPrompt}`,
  }

  // Prepare the input messages with system message first
  const inputMessages = [systemMessage, ...messages]

  let lastError: Error | null = null

  // Implement retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      updateStatus?.(
        DEFAULT_AI_SETTINGS.thinkingMessage[
          Math.floor(Math.random() * DEFAULT_AI_SETTINGS.thinkingMessage.length)
        ]
      )

      // Call OpenAI API
      const response = await openai.responses.parse({
        model: DEFAULT_AI_SETTINGS.model,
        input: inputMessages,
        temperature: DEFAULT_AI_SETTINGS.temperature,
        max_output_tokens: DEFAULT_AI_SETTINGS.maxTokens,
        text: {
          format: zodTextFormat(DEFAULT_AI_SETTINGS.responseSchema, 'response'),
        },
      })

      // Extract the parsed output
      const output = response.output_parsed

      if (!output) {
        throw new Error('Failed to parse response output')
      }

      // Convert markdown to Slack mrkdwn format
      const mrkdwnText = slackifyMarkdown(output.response)

      return {
        threadTitle: output.threadTitle || '',
        response: mrkdwnText,
        followUps: output.followUps || [],
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error)
      updateStatus?.(`Hmm, that didn't work. Retrying... (${attempt}/${MAX_RETRIES})`)

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt)) // Exponential backoff
      }
    }
  }

  console.error('Failed to generate response after multiple attempts:', lastError)

  return {
    threadTitle: '',
    response:
      'Failed to generate response after multiple attempts. Please refresh the thread and try again. Or contact the admin.',
    followUps: [],
  }
}
