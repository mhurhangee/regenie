import crypto from 'node:crypto'
import { WebClient } from '@slack/web-api'
import type { CoreMessage } from 'ai'
import { logger } from './logger'

const signingSecret = process.env.SLACK_SIGNING_SECRET || ''

export const client = new WebClient(process.env.SLACK_BOT_TOKEN)

// See https://api.slack.com/authentication/verifying-requests-from-slack
export async function isValidSlackRequest({
  request,
  rawBody,
}: {
  request: Request
  rawBody: string
}) {
  logger.debug('isValidSlackRequest: Validating Slack request')
  const timestamp = request.headers.get('X-Slack-Request-Timestamp')
  const slackSignature = request.headers.get('X-Slack-Signature')

  if (!timestamp || !slackSignature) {
    logger.debug('isValidSlackRequest: Missing timestamp or signature')
    return false
  }

  logger.debug('isValidSlackRequest: Timestamp', timestamp)
  logger.debug('isValidSlackRequest: Signature', slackSignature)

  // Prevent replay attacks on the order of 5 minutes
  if (Math.abs(Date.now() / 1000 - Number.parseInt(timestamp)) > 60 * 5) {
    logger.debug('isValidSlackRequest: Timestamp out of range')
    return false
  }

  const base = `v0:${timestamp}:${rawBody}`
  const hmac = crypto.createHmac('sha256', signingSecret).update(base).digest('hex')
  const computedSignature = `v0=${hmac}`
  logger.debug('isValidSlackRequest: Signature computed [REDACTED]')

  // Prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(slackSignature))
}

export const verifyRequest = async ({
  requestType,
  request,
  rawBody,
}: {
  requestType: string
  request: Request
  rawBody: string
}) => {
  logger.debug('verifyRequest: Verifying request')
  const validRequest = await isValidSlackRequest({ request, rawBody })
  if (!validRequest || requestType !== 'event_callback') {
    logger.debug('verifyRequest: Invalid request')
    return new Response('Invalid request', { status: 400 })
  }

  logger.debug('verifyRequest: Request verified')
}

export const updateStatusUtil = (channel: string, thread_ts: string) => {
  return async (status: string) => {
    logger.debug('updateStatusUtil: Updating status')
    await client.assistant.threads.setStatus({
      channel_id: channel,
      thread_ts: thread_ts,
      status: status,
    })
  }
}

export async function getThread(
  channel_id: string,
  thread_ts: string,
  botUserId: string
): Promise<CoreMessage[]> {
  logger.debug('getThread: Getting thread')
  const { messages } = await client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50,
  })
  logger.debug('getThread: Messages', messages)

  if (!messages) {
    logger.error('getThread: No messages found in thread')
    throw new Error('No messages found in thread')
  }

  const result = messages
    .map((message) => {
      const isBot = !!message.bot_id
      if (!message.text) return null

      // For app mentions, remove the mention prefix
      // For IM messages, keep the full text
      let content = message.text
      if (!isBot && content.includes(`<@${botUserId}>`)) {
        content = content.replace(`<@${botUserId}> `, '')
      }

      return {
        role: isBot ? 'assistant' : 'user',
        content: content,
      } as CoreMessage
    })
    .filter((msg): msg is CoreMessage => msg !== null)

  logger.debug('getThread: Result', result)

  return result
}

export const getBotId = async () => {
  logger.debug('getBotId: Getting bot ID')
  const { user_id: botUserId } = await client.auth.test()

  if (!botUserId) {
    logger.error('getBotId: Bot user ID is undefined')
    throw new Error('botUserId is undefined')
  }

  logger.debug('getBotId: Bot user ID', botUserId)
  return botUserId
}
