import type { AppMentionEvent, FileShareMessageEvent } from '@slack/web-api'
import { DEFAULT_AI_SETTINGS, ERRORS } from './constants'
import { generateResponse } from './generate-response'
import { client, getThread } from './slack-utils'
import { getRandomSubList } from './utils'

const updateStatusUtil = async (
  initialStatus: string,
  event: AppMentionEvent | FileShareMessageEvent
) => {
  const initialMessage = await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: initialStatus,
  })

  if (!initialMessage || !initialMessage.ts) {
    throw new Error(ERRORS.initialMessage)
  }

  const updateMessage = async (status: string) => {
    await client.chat.update({
      channel: event.channel,
      ts: initialMessage.ts as string,
      text: status,
    })
  }

  return updateMessage
}

export async function handleNewAppMention(
  event: AppMentionEvent | FileShareMessageEvent,
  botUserId: string
) {
  // Type-safe check for bot messages
  const isFromBot =
    ('bot_id' in event && event.bot_id) ||
    ('bot_id' in event && event.bot_id === botUserId) ||
    'bot_profile' in event

  if (isFromBot) {
    return
  }

  // Extract common properties using type-safe access
  const thread_ts = event.thread_ts || event.ts
  const channel = event.channel

  const randomThinkingMessage = getRandomSubList(DEFAULT_AI_SETTINGS.thinkingMessage, 1)[0]
  const updateMessage = await updateStatusUtil(randomThinkingMessage, event)

  // Handle the message based on whether it's in a thread or not
  if (thread_ts) {
    const messages = await getThread(channel, thread_ts, botUserId)
    const result = await generateResponse(messages, updateMessage)
    await updateMessage(result.response)
  } else {
    // For new messages not in a thread, create a simple message
    // If it's a file_share message, it will be handled by getThread
    const result = await generateResponse(
      [{ role: 'user', content: event.text || '' }],
      updateMessage
    )
    await updateMessage(result.response)
  }
}
