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

export async function assistantThreadMessage(event: AssistantThreadStartedEvent) {
  const { channel_id, thread_ts } = event.assistant_thread

  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: DEFAULT_AI_SETTINGS.welcomeMessage,
  })

  const setSuggestedPrompts = setSuggestedPromptsUtil(channel_id, thread_ts)
  await setSuggestedPrompts(
    DEFAULT_AI_SETTINGS.initialFollowups,
    DEFAULT_AI_SETTINGS.initialFollowupsTitle
  )
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

  const setSuggestedPrompts = setSuggestedPromptsUtil(channel, thread_ts)
  await setSuggestedPrompts(result.followUps || [])

  await updateStatus('')
}
