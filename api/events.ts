import type { SlackEvent } from '@slack/web-api'
import { waitUntil } from '@vercel/functions'
import { handleAppHomeOpened } from '../lib/handle-app-home-opened'
import { handleNewAppMention } from '../lib/handle-app-mention'
import { assistantThreadMessage, handleNewAssistantMessage } from '../lib/handle-messages'
import { logger } from '../lib/logger'
import { getBotId, verifyRequest } from '../lib/slack-utils'

logger.setLogLevel('debug')

export async function POST(request: Request) {
  const rawBody = await request.text()

  const payload = JSON.parse(rawBody)

  const requestType = payload.type as 'url_verification' | 'event_callback'

  // See https://api.slack.com/events/url_verification
  if (requestType === 'url_verification') {
    return new Response(payload.challenge, { status: 200 })
  }

  await verifyRequest({ requestType, request, rawBody })

  try {
    const botUserId = await getBotId()

    const event = payload.event as SlackEvent

    // Handle app mentions, including those with file attachments
    if (
      event.type === 'app_mention' ||
      (event.type === 'message' &&
        event.subtype === 'file_share' &&
        'text' in event &&
        event.text &&
        event.text.includes(`<@${botUserId}>`))
    ) {
      waitUntil(handleNewAppMention(event, botUserId))
    }

    if (event.type === 'app_home_opened') {
      waitUntil(handleAppHomeOpened(event))
    }

    if (event.type === 'assistant_thread_started') {
      waitUntil(assistantThreadMessage(event))
    }

    // Handle all message events in IM channels
    if (event.type === 'message' && 'channel_type' in event && event.channel_type === 'im') {
      // Check if it's not from a bot
      const isFromBot =
        ('bot_id' in event && event.bot_id) ||
        'bot_profile' in event ||
        ('bot_id' in event && event.bot_id === botUserId)

      // Process if it's not from a bot and has a thread_ts (or is starting a thread)
      if (!isFromBot && 'thread_ts' in event) {
        // Handle both regular messages and file_share messages
        if (!event.subtype || event.subtype === 'file_share') {
          waitUntil(handleNewAssistantMessage(event, botUserId))
        }
      }
    }

    return new Response('Success!', { status: 200 })
  } catch (error) {
    return new Response('Error generating response', { status: 500 })
  }
}
