import type {
  AssistantThreadStartedEvent,
  FileShareMessageEvent,
  GenericMessageEvent,
} from '@slack/web-api'
import { DEFAULT_AI_SETTINGS } from './constants'
import { generateResponse } from './generate-response'
import {
  client,
  getThread,
  postMessageWithContext,
  setSuggestedPromptsUtil,
  updateStatusUtil,
  updateTitleUtil,
} from './slack-utils'
import { getRandomSubList } from './utils'

export async function assistantThreadMessage(event: AssistantThreadStartedEvent) {
  const { channel_id, thread_ts } = event.assistant_thread

  const randomWelcomeMessage = getRandomSubList(DEFAULT_AI_SETTINGS.welcomeMessage, 1)[0]

  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: randomWelcomeMessage,
  })

  const randomInitialFollowUps = getRandomSubList(DEFAULT_AI_SETTINGS.initialFollowups, 3)
  const randomInitialFollowUpsTitle = getRandomSubList(
    DEFAULT_AI_SETTINGS.initialFollowupsTitle,
    1
  )[0]

  const setSuggestedPrompts = setSuggestedPromptsUtil(channel_id, thread_ts)
  await setSuggestedPrompts(randomInitialFollowUps, randomInitialFollowUpsTitle)
}

export async function handleNewAssistantMessage(
  event: GenericMessageEvent | FileShareMessageEvent,
  botUserId: string
) {
  // Type-safe check for bot messages
  const isFromBot =
    ('bot_id' in event && event.bot_id) ||
    ('bot_id' in event && event.bot_id === botUserId) ||
    'bot_profile' in event

  // Ensure we have a thread_ts
  if (isFromBot || !event.thread_ts) {
    return
  }

  const { thread_ts, channel } = event

  const updateStatus = updateStatusUtil(channel, thread_ts)

  const randomThinkingMessage = getRandomSubList(DEFAULT_AI_SETTINGS.thinkingMessage, 1)[0]

  await updateStatus(randomThinkingMessage)

  const messages = await getThread(channel, thread_ts, botUserId)

  // Pass channel ID for channel-specific prompts while keeping the full schema for direct messages
  const result = await generateResponse(messages, updateStatus, channel, 'full')

  // Use the new utility function to post the message with personality context
  // This is the first real response in the thread, so we set isFirstInThread to true
  await postMessageWithContext(channel, thread_ts, result.response, true, true)

  const updateTitle = updateTitleUtil(channel, thread_ts)
  await updateTitle(result.threadTitle)

  const randomFollowUpTitle = getRandomSubList(DEFAULT_AI_SETTINGS.followUpTitle, 1)[0]

  const setSuggestedPrompts = setSuggestedPromptsUtil(channel, thread_ts)
  await setSuggestedPrompts(result.followUps || [], randomFollowUpTitle)

  await updateStatus('')
}
