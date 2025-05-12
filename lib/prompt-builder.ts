import type { z } from 'zod'
import {
  CHANNEL_PROMPT_MAP,
  FULL_RESPONSE_SCHEMA,
  FULL_STRUCTURED_ADDITION_PROMPT,
  PROMPT_TYPE_MAP,
  SIMPLE_RESPONSE_SCHEMA,
  SIMPLE_STRUCTURED_ADDITION_PROMPT,
} from './prompts'

// Define the different types of response schemas we might need
export type SchemaType = 'full' | 'simple'

// Define the different prompt types we might need
export type PromptType = 'default' | 'identifier' | 'legal' | 'concise' | 'bookClub'

// Define the response schema types for proper typing
export type FullResponseSchema = z.ZodObject<{
  threadTitle: z.ZodString
  response: z.ZodString
  followUps: z.ZodArray<z.ZodString>
}>

export type SimpleResponseSchema = z.ZodObject<{
  response: z.ZodString
}>

// Interface for the prompt and schema configuration
export interface PromptConfig {
  systemPrompt: string
  responseSchema: FullResponseSchema | SimpleResponseSchema
  structuredAdditionPrompt: string
}

/**
 * Builds the appropriate prompt configuration based on the channel and schema type
 * @param channelId The ID of the channel where the message was sent
 * @param schemaType The type of schema to use (full or simple)
 * @returns The prompt configuration with system prompt, response schema, and structured addition prompt
 */
export function buildPromptConfig(
  channelId?: string,
  schemaType: SchemaType = 'full'
): PromptConfig {
  // Determine the prompt type based on the channel
  const promptType: PromptType =
    channelId && CHANNEL_PROMPT_MAP[channelId as keyof typeof CHANNEL_PROMPT_MAP]
      ? (CHANNEL_PROMPT_MAP[channelId as keyof typeof CHANNEL_PROMPT_MAP] as PromptType)
      : 'default'

  // Get the system prompt based on the prompt type
  const systemPrompt = PROMPT_TYPE_MAP[promptType as keyof typeof PROMPT_TYPE_MAP]

  // Determine the schema and structured addition prompt based on the schema type
  const responseSchema = schemaType === 'simple' ? SIMPLE_RESPONSE_SCHEMA : FULL_RESPONSE_SCHEMA

  const structuredAdditionPrompt =
    schemaType === 'simple' ? SIMPLE_STRUCTURED_ADDITION_PROMPT : FULL_STRUCTURED_ADDITION_PROMPT

  return {
    systemPrompt,
    responseSchema,
    structuredAdditionPrompt,
  }
}
