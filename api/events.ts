import type { SlackEvent } from '@slack/web-api'
import { waitUntil } from '@vercel/functions'
import { handleNewAppMention } from '../lib/handle-app-mention'
import { assistantThreadMessage, handleNewAssistantMessage } from '../lib/handle-messages'
import { logger } from '../lib/logger'
import { getBotId, verifyRequest } from '../lib/slack-utils'

logger.setLogLevel('debug')

export async function POST(request: Request) {
  const rawBody = await request.text()
  logger.debug('api/events.ts: Raw body', rawBody)

  const payload = JSON.parse(rawBody)
  logger.debug('api/events.ts: Payload', payload)

  const requestType = payload.type as 'url_verification' | 'event_callback'
  logger.debug('api/events.ts: Request type', requestType)

  // See https://api.slack.com/events/url_verification
  if (requestType === 'url_verification') {
    logger.debug('api/events.ts: URL verification')
    return new Response(payload.challenge, { status: 200 })
  }

  logger.debug('api/events.ts: Verifying request')
  await verifyRequest({ requestType, request, rawBody })

  try {
    const botUserId = await getBotId()
    logger.debug('api/events.ts: Bot user ID', botUserId)

    const event = payload.event as SlackEvent
    logger.debug('api/events.ts: Event', event)

    if (event.type === 'app_mention') {
      logger.debug('api/events.ts: App mention')
      waitUntil(handleNewAppMention(event, botUserId))
    }

    if (event.type === 'assistant_thread_started') {
      logger.debug('api/events.ts: Assistant thread started')
      waitUntil(assistantThreadMessage(event))
    }

    if (
      event.type === 'message' &&
      !event.subtype &&
      event.channel_type === 'im' &&
      !event.bot_id &&
      !event.bot_profile &&
      event.bot_id !== botUserId
    ) {
      logger.debug('api/events.ts: New assistant message')
      waitUntil(handleNewAssistantMessage(event, botUserId))
    }

    return new Response('Success!', { status: 200 })
  } catch (error) {
    logger.error('api/events.ts: Error generating response', error)
    return new Response('Error generating response', { status: 500 })
  }
}
