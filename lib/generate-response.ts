import { openai } from '@ai-sdk/openai'
import { type CoreMessage, Output, generateText, tool } from 'ai'
import slackifyMarkdown from 'slackify-markdown'
import { z } from 'zod'
import { logger } from './logger'
import { exa } from './utils'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
) => {
  logger.debug('generateResponse: Generating response', messages)
  const { experimental_output } = await generateText({
    model: openai.responses('gpt-4o-mini'),
    system: `- You are a helpful Slack bot assistant called Regenie.
    - You have expert knowledge about environmental science, ecology, renewable energy, rewilding, sustainability and regenerative agriculture.
    - You are extremely passionate about the environment and engaging with others about your expertise.
    - You are from the UK. 
    - Keep your responses concise and to the point.
    - Do not tag users.
    - Use markdown and emojis to make your responses more engaging.
    - Current date is: ${new Date().toISOString().split('T')[0]}
    - Make sure to ALWAYS include sources in your final response if you use web search. Put sources inline if possible.`,
    messages,
    experimental_output: Output.object({
      schema: z.object({
        threadTitle: z.string().describe('The title of the thread'),
        response: z.string().describe('The response to the user'),
        followUps: z
          .array(
            z.string().describe('A follow up prompts for the user to continue the conversation')
          )
          .describe('Optional follow up prompts for the user to continue the conversation'),
      }),
    }),
    maxSteps: 10,
    tools: {
      getWeather: tool({
        description: 'Get the current weather at a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
          city: z.string(),
        }),
        execute: async ({ latitude, longitude, city }) => {
          logger.debug('generateResponse: Getting weather', { latitude, longitude, city })
          updateStatus?.(`is getting weather for ${city}...`)

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`
          )

          const weatherData = await response.json()
          return {
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weathercode,
            humidity: weatherData.current.relativehumidity_2m,
            city,
          }
        },
      }),
      searchWeb: tool({
        description: 'Use this to search the web for information',
        parameters: z.object({
          query: z.string(),
          specificDomain: z
            .string()
            .nullable()
            .describe(
              'a domain to search if the user specifies e.g. bbc.com. Should be only the domain name without the protocol'
            ),
        }),
        execute: async ({ query, specificDomain }) => {
          logger.debug('generateResponse: Searching the web', { query, specificDomain })
          updateStatus?.(`is searching the web for ${query}...`)
          const { results } = await exa.searchAndContents(query, {
            livecrawl: 'always',
            numResults: 3,
            includeDomains: specificDomain ? [specificDomain] : undefined,
          })

          return {
            results: results.map((result) => ({
              title: result.title,
              url: result.url,
              snippet: result.text.slice(0, 1000),
            })),
          }
        },
      }),
    },
  })

  logger.debug('generateResponse: Generated response object', experimental_output)
  // Convert markdown to Slack mrkdwn format
  const mrkdwnText = slackifyMarkdown(experimental_output.response)
  logger.debug('generateResponse: MRKDWN Text', mrkdwnText)

  return {
    threadTitle: experimental_output.threadTitle || '',
    response: mrkdwnText,
    followUps: experimental_output.followUps || [],
  }
}
