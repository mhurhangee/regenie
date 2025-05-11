import { type CoreMessage, generateText } from 'ai'
import slackifyMarkdown from 'slackify-markdown'
import { DEFAULT_AI_SETTINGS } from './constants'
import { getWeather, searchWeb } from './tools'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
) => {
  const { experimental_output } = await generateText({
    model: DEFAULT_AI_SETTINGS.model,
    system: `${DEFAULT_AI_SETTINGS.systemPrompt}\n\n${DEFAULT_AI_SETTINGS.structuredAdditionPrompt}`,
    maxSteps: DEFAULT_AI_SETTINGS.maxSteps,
    maxTokens: DEFAULT_AI_SETTINGS.maxTokens,
    temperature: DEFAULT_AI_SETTINGS.temperature,
    messages,
    experimental_output: DEFAULT_AI_SETTINGS.output,
    tools: {
      getWeather: getWeather(updateStatus),
      searchWeb: searchWeb(updateStatus),
    },
  })

  // Convert markdown to Slack mrkdwn format
  const mrkdwnText = slackifyMarkdown(experimental_output.response)

  return {
    threadTitle: experimental_output.threadTitle || '',
    response: mrkdwnText,
    followUps: experimental_output.followUps || [],
  }
}
