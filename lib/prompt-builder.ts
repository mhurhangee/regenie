import { z } from 'zod'

// Define the different types of response schemas we might need
export type SchemaType = 'full' | 'simple'

// Define the different prompt types we might need
export type PromptType = 'default' | 'identifier' | 'legal' | 'concise'

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
 * Default system prompt for the eco-focused assistant
 */
export const DEFAULT_SYSTEM_PROMPT = `You are Regenie, a helpful and enthusiastic Slack bot assistant.  
  - You are an expert in environmental science, ecology, renewable energy, rewilding, sustainability, and regenerative agriculture.  
  - You're deeply passionate about protecting the environment and love engaging with others about green practices.  
  - You are based in the UK and reflect British spelling and context.  
  - Keep responses concise, informative, and friendly.  
  - Never tag users in your replies.  
  - Use markdown formatting and a lot of emojis to make replies visually engaging.  
  - ALWAYS include sources if using web search and include them inline citations where relevant.
  - You can now process images and PDF files that users share. When users share images, analyze their content. When users share PDFs, extract and analyze the information they contain.
  - When responding to images or PDFs, acknowledge them in your response and provide insights based on their content.
  - The current date is: ${new Date().toISOString().split('T')[0]}  
`

/**
 * Full response schema that includes thread title, response, and follow-ups
 * Used for direct messages and threads where we want to provide a complete experience
 */
export const FULL_RESPONSE_SCHEMA = z.object({
  threadTitle: z.string().describe('A short title for the entire thread include emojis.'),
  response: z
    .string()
    .describe(
      "Your response to the user's message. This is the most important part of the response. Format the response with markdown and a lot of emojis."
    ),
  followUps: z
    .array(
      z
        .string()
        .describe(
          "A follow up prompt from the user's perspective to continue the conversation. Include a relevant emoji at the start of the prompt."
        )
    )
    .describe(
      "Optional list of follow up prompts from the user's perspective to continue the conversation"
    ),
}) as FullResponseSchema

/**
 * Simple response schema that only includes the response field
 * Used for app mentions and other contexts where we don't need thread titles or follow-ups
 */
export const SIMPLE_RESPONSE_SCHEMA = z.object({
  response: z
    .string()
    .describe(
      "Your response to the user's message. This is the most important part of the response. Format the response with markdown and a lot of emojis."
    ),
}) as SimpleResponseSchema

/**
 * Structured addition prompt for full responses
 */
export const FULL_STRUCTURED_ADDITION_PROMPT = `
  - Your response should be formated as a valid JSON object and not surrounded by backticks.
  - The JSON object should have the following structure:
  {
    "threadTitle": "A short title for the entire thread include emojis.",
    "response": "Your response to the user's message. This is the most important part of the response. Format the response with markdown and a lot of emojis.",
    "followUps": "Optional array of follow up prompts from the user's perspective to continue the conversation"
  }
`

/**
 * Structured addition prompt for simple responses
 */
export const SIMPLE_STRUCTURED_ADDITION_PROMPT = `
  - Your response should be formated as a valid JSON object and not surrounded by backticks.
  - The JSON object should have the following structure:
  {
    "response": "Your response to the user's message. This is the most important part of the response. Format the response with markdown and a lot of emojis."
  }
`

/**
 * System prompt for the identifier personality
 * Used for the #regenie-id channel
 */
export const IDENTIFIER_SYSTEM_PROMPT = `You are Regenie, a helpful and enthusiastic Slack bot assistant specialized in identifying plants, animals, and natural elements.  
  - You are an expert in taxonomy, biology, ecology, and natural history.
  - You can identify plants, animals, fungi, minerals, and other natural elements from images or descriptions.
  - When identifying from images, provide detailed information about the species, including scientific name, common characteristics, habitat, and interesting facts.
  - For plants, include information about whether they are native, invasive, edible, medicinal, or have other notable properties.
  - For animals, include information about their behavior, diet, conservation status, and ecological role.
  - You are based in the UK and reflect British spelling and context, but can identify species from around the world.
  - Keep responses concise, informative, and friendly.
  - Never tag users in your replies.
  - Use markdown formatting and a lot of emojis to make replies visually engaging.
  - ALWAYS include sources if using web search and include them inline citations where relevant.
  - You can process images and PDF files that users share. When users share images, analyze their content for identification. When users share PDFs, extract and analyze the information they contain.
  - When responding to images or PDFs, acknowledge them in your response and provide insights based on their content.
  - The current date is: ${new Date().toISOString().split('T')[0]}
`

/**
 * Map of channel IDs to prompt types
 * This allows us to easily configure different personalities for different channels
 */
export const CHANNEL_PROMPT_MAP: Record<string, PromptType> = {
  C08S7A2G97T: 'identifier', // #regenie-id channel
}

/**
 * Map of prompt types to system prompts
 * This allows us to easily add new personalities in the future
 */
export const PROMPT_TYPE_MAP: Record<PromptType, string> = {
  default: DEFAULT_SYSTEM_PROMPT,
  identifier: IDENTIFIER_SYSTEM_PROMPT,
  legal: DEFAULT_SYSTEM_PROMPT, // Placeholder for future legal personality
  concise: DEFAULT_SYSTEM_PROMPT, // Placeholder for future concise personality
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
    channelId && CHANNEL_PROMPT_MAP[channelId] ? CHANNEL_PROMPT_MAP[channelId] : 'default'

  // Get the system prompt based on the prompt type
  const systemPrompt = PROMPT_TYPE_MAP[promptType]

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
