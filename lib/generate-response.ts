import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import slackifyMarkdown from 'slackify-markdown'
import { DEFAULT_AI_SETTINGS } from './constants'
import { type SchemaType, buildPromptConfig } from './prompt-builder'
import { openaiWebSearchTool } from './tools'
import type { Message } from './types'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generates a response using OpenAI API with error handling and retry mechanism
 * @param messages Array of messages in the conversation
 * @param updateStatus Optional callback to update status during processing
 * @param channelId Optional channel ID to customize the system prompt
 * @param schemaType Type of response schema to use (full or simple)
 * @returns The generated response with threadTitle, response text, and followUps (if using full schema)
 */
export const generateResponse = async (
  messages: Message[],
  updateStatus?: (status: string) => void,
  channelId?: string,
  schemaType: SchemaType = 'full'
) => {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second delay between retries

  // Get the appropriate prompt configuration based on channel and schema type
  const promptConfig = buildPromptConfig(channelId, schemaType)

  // Prepare system message
  const systemMessage = {
    role: 'system' as const,
    content: `${promptConfig.systemPrompt}\n\n${promptConfig.structuredAdditionPrompt}`,
  } as Message

  // Prepare the input messages with system message first
  const inputMessages = [systemMessage, ...messages] as Message[]

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
        tools: [{ type: 'web_search_preview' }],
        text: {
          format: zodTextFormat(promptConfig.responseSchema, 'response'),
        },
      })

      // Extract the parsed output
      const output = response.output_parsed

      if (!output) {
        throw new Error('Failed to parse response output')
      }

      // Convert markdown to Slack mrkdwn format
      const mrkdwnText = slackifyMarkdown(output.response)

      // Return appropriate response format based on schema type
      if (schemaType === 'simple') {
        return {
          response: mrkdwnText,
          // Include empty values for backward compatibility
          threadTitle: '',
          followUps: [],
        }
      }

      // For full schema, we know the output has threadTitle and followUps properties
      // Type assertion to help TypeScript understand the structure
      const fullOutput = output as { threadTitle: string; response: string; followUps: string[] }

      return {
        threadTitle: fullOutput.threadTitle || '',
        response: mrkdwnText,
        followUps: fullOutput.followUps || [],
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
