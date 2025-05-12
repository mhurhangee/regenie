import { openai } from '@ai-sdk/openai'
import { Output, generateText } from 'ai'
import slackifyMarkdown from 'slackify-markdown'
import type { z } from 'zod'
import { DEFAULT_AI_SETTINGS } from './constants'
import { type SchemaType, buildPromptConfig } from './prompt-builder'
import {
  FULL_RESPONSE_SCHEMA,
  type FullResponseSchema,
  SIMPLE_RESPONSE_SCHEMA,
  type SimpleResponseSchema,
} from './prompts'
import { getWeather, openaiWebSearchTool, searchUrl } from './tools'
import type { Message } from './types'

/**
 * Generates a response using AI SDK with error handling and retry mechanism
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
  try {
    // Get the appropriate prompt configuration based on channel and schema type
    const promptConfig = buildPromptConfig(channelId, schemaType)

    updateStatus?.(
      DEFAULT_AI_SETTINGS.thinkingMessage[
        Math.floor(Math.random() * DEFAULT_AI_SETTINGS.thinkingMessage.length)
      ]
    )

    // Call AI SDK generateText with tools
    const result = await generateText({
      model: openai(DEFAULT_AI_SETTINGS.model),
      system: `${promptConfig.systemPrompt}\n\n${promptConfig.structuredAdditionPrompt}`,
      maxTokens: DEFAULT_AI_SETTINGS.maxTokens,
      temperature: DEFAULT_AI_SETTINGS.temperature,
      messages,
      // Define the output schema for AI SDK
      experimental_output:
        schemaType === 'simple'
          ? Output.object({ schema: SIMPLE_RESPONSE_SCHEMA })
          : Output.object({ schema: FULL_RESPONSE_SCHEMA }),
      tools: {
        getWeather: getWeather(updateStatus),
        searchUrl: searchUrl(updateStatus),
        openaiWebSearchTool,
      },
      maxRetries: 3,
      maxSteps: 10,
    })

    // Extract the experimental output from the result
    const experimental_output = result.experimental_output as
      | z.infer<typeof SIMPLE_RESPONSE_SCHEMA>
      | z.infer<typeof FULL_RESPONSE_SCHEMA>

    // Convert markdown to Slack mrkdwn format
    const mrkdwnText = slackifyMarkdown(experimental_output.response)

    // Return appropriate response format based on schema type
    if (schemaType === 'simple') {
      return {
        response: mrkdwnText,
        // Include empty values for backward compatibility
        threadTitle: '',
        followUps: [],
      }
    }

    // For full schema, cast to the full response type
    const fullOutput = experimental_output as z.infer<typeof FULL_RESPONSE_SCHEMA>

    return {
      threadTitle: fullOutput.threadTitle || '',
      response: mrkdwnText,
      followUps: fullOutput.followUps || [],
    }
  } catch (error) {
    console.error('Failed to generate response:', error)

    return {
      threadTitle: '',
      response:
        'Failed to generate response. Please refresh the thread and try again. Or contact the admin.',
      followUps: [],
    }
  }
}
