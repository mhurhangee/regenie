import type { AssistantThreadStartedEvent, GenericMessageEvent } from '@slack/web-api'
import { generateResponse } from './generate-response'
import { logger } from './logger'
import {
  client,
  getThread,
  setSuggestedPromptsUtil,
  updateStatusUtil,
  updateTitleUtil,
} from './slack-utils'

export async function assistantThreadMessage(event: AssistantThreadStartedEvent) {
  const { channel_id, thread_ts } = event.assistant_thread
  logger.debug(
    `assistantThreadMessage: Thread started with channel ${channel_id} and thread ${thread_ts}`
  )
  logger.debug('assistantThreadMessage: Event', JSON.stringify(event))

  logger.debug('assistantThreadMessage: Posting initial message')
  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: "Hello, I'm Regenie! 🌱 Your eco-focused AI assistant ready to help with environmental science, sustainability, and regenerative topics! 🌍",
  })

  logger.debug('assistantThreadMessage: Setting suggested prompts')
  const setSuggestedPrompts = setSuggestedPromptsUtil(channel_id, thread_ts)
  await setSuggestedPrompts(
    [
      'What is the current weather in London?',
      'What is the latest Premier League news from the BBC?',
    ],
    'Initial suggestions'
  )
  logger.debug('assistantThreadMessage: Done')
}

export async function handleNewAssistantMessage(event: GenericMessageEvent, botUserId: string) {
  logger.debug('handleNewAssistantMessage: Event', JSON.stringify(event))

  if (event.bot_id || event.bot_id === botUserId || event.bot_profile || !event.thread_ts) {
    logger.debug('handleNewAssistantMessage: Skipping bot message')
    return
  }

  const { thread_ts, channel } = event
  logger.debug(`handleNewAssistantMessage: Thread ${thread_ts} in channel ${channel}`)

  logger.debug('handleNewAssistantMessage: Updating status')
  const updateStatus = updateStatusUtil(channel, thread_ts)
  await updateStatus('is thinking...')

  logger.debug('handleNewAssistantMessage: Getting thread')
  const messages = await getThread(channel, thread_ts, botUserId)
  logger.debug(`handleNewAssistantMessage: Thread ${thread_ts} has ${messages.length} messages`)

  logger.debug('handleNewAssistantMessage: Generating response')
  const result = await generateResponse(messages, updateStatus)
  logger.debug('handleNewAssistantMessage: Generated response', result)

  logger.debug('handleNewAssistantMessage: Posting response')
  await client.chat.postMessage({
    channel: channel,
    thread_ts: thread_ts,
    text: result.response,
    unfurl_links: false,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: result.response,
        },
      },
    ],
  })

  logger.debug('handleNewAssistantMessage: Updating title')
  const updateTitle = updateTitleUtil(channel, thread_ts)
  await updateTitle(result.threadTitle)

  logger.debug('handleNewAssistantMessage: Setting suggested prompts')
  const setSuggestedPrompts = setSuggestedPromptsUtil(channel, thread_ts)
  await setSuggestedPrompts(result.followUps || [])

  logger.debug('handleNewAssistantMessage: Updating status')
  await updateStatus('')

  logger.debug('handleNewAssistantMessage: Done')
}
