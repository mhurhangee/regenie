import type { AppMentionEvent } from '@slack/web-api'
import { DEFAULT_AI_SETTINGS, ERRORS } from './constants'
import { generateResponse } from './generate-response'
import { client, getThread } from './slack-utils'

const updateStatusUtil = async (initialStatus: string, event: AppMentionEvent) => {
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

export async function handleNewAppMention(event: AppMentionEvent, botUserId: string) {
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    return
  }

  const { thread_ts, channel } = event

  const updateMessage = await updateStatusUtil(DEFAULT_AI_SETTINGS.thinkingMessage, event)

  if (thread_ts) {
    const messages = await getThread(channel, thread_ts, botUserId)
    const result = await generateResponse(messages, updateMessage)
    await updateMessage(result.response)
  } else {
    const result = await generateResponse([{ role: 'user', content: event.text }], updateMessage)
    await updateMessage(result.response)
  }
}
