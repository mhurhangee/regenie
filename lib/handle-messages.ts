import type { AssistantThreadStartedEvent, GenericMessageEvent } from '@slack/web-api'
import { DEFAULT_AI_SETTINGS } from './constants'
import { generateResponse } from './generate-response'
import {
  client,
  getThread,
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

export async function handleNewAssistantMessage(event: GenericMessageEvent, botUserId: string) {
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile || !event.thread_ts) {
    return
  }

  const { thread_ts, channel } = event

  const updateStatus = updateStatusUtil(channel, thread_ts)
  await updateStatus(DEFAULT_AI_SETTINGS.thinkingMessage)

  const messages = await getThread(channel, thread_ts, botUserId)

  const result = await generateResponse(messages, updateStatus)

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

  const updateTitle = updateTitleUtil(channel, thread_ts)
  await updateTitle(result.threadTitle)

  const randomFollowUpTitle = getRandomSubList(DEFAULT_AI_SETTINGS.followUpTitle, 1)[0]

  const setSuggestedPrompts = setSuggestedPromptsUtil(channel, thread_ts)
  await setSuggestedPrompts(result.followUps || [], randomFollowUpTitle)

  await updateStatus('')
}
