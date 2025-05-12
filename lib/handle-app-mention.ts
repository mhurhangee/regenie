import type { AppMentionEvent, FileShareMessageEvent } from '@slack/web-api'
import { DEFAULT_AI_SETTINGS } from './constants'
import { generateResponse } from './generate-response'
import { getThread, postMessageWithContext, updateMessageAsStatusUtil } from './slack-utils'
import { getRandomSubList } from './utils'

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
  const updateMessage = await updateMessageAsStatusUtil(randomThinkingMessage, event)

  // Handle the message based on whether it's in a thread or not
  if (thread_ts) {
    const messages = await getThread(channel, thread_ts, botUserId)
    // Pass channel ID for channel-specific prompts and use simple schema for app mentions
    const result = await generateResponse(messages, updateMessage, channel, 'simple')

    // Update the message with a space character to avoid the no_text error
    // This message will be immediately replaced by the postMessageWithContext call
    await updateMessage(' ')

    // Then post a new message with personality context
    // For app mentions in threads, we show personality context only for the first response
    const isFirstResponse = messages.length <= 2 // Only user message and possibly the bot thinking message
    await postMessageWithContext(channel, thread_ts, result.response, true, isFirstResponse)
  } else {
    // For new messages not in a thread, create a simple message
    // If it's a file_share message, it will be handled by getThread
    const result = await generateResponse(
      [{ role: 'user', content: event.text || '' }],
      updateMessage,
      channel,
      'simple'
    )

    // Update the message with a space character to avoid the no_text error
    // This message will be immediately replaced by the postMessageWithContext call
    await updateMessage(' ')

    // Then post a new message with personality context
    // This is the first message in a new thread, so we always show personality context
    await postMessageWithContext(channel, thread_ts, result.response, true, true)
  }
}
