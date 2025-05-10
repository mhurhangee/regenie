import crypto from 'node:crypto'
import { WebClient } from '@slack/web-api'
import type { CoreMessage } from 'ai'

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
  const timestamp = request.headers.get('X-Slack-Request-Timestamp')
  const slackSignature = request.headers.get('X-Slack-Signature')

  if (!timestamp || !slackSignature) {
    return false
  }

  // Prevent replay attacks on the order of 5 minutes
  if (Math.abs(Date.now() / 1000 - Number.parseInt(timestamp)) > 60 * 5) {
    return false
  }

  const base = `v0:${timestamp}:${rawBody}`
  const hmac = crypto.createHmac('sha256', signingSecret).update(base).digest('hex')
  const computedSignature = `v0=${hmac}`

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
  const validRequest = await isValidSlackRequest({ request, rawBody })
  if (!validRequest || requestType !== 'event_callback') {
    return new Response('Invalid request', { status: 400 })
  }
}

export const updateStatusUtil = (channel: string, thread_ts: string) => {
  return async (status: string) => {
    await client.assistant.threads.setStatus({
      channel_id: channel,
      thread_ts: thread_ts,
      status: status,
    })
  }
}

export const updateTitleUtil = (channel: string, thread_ts: string) => {
  return async (title: string) => {
    await client.assistant.threads.setTitle({
      channel_id: channel,
      thread_ts: thread_ts,
      title: title,
    })
  }
}

export const setSuggestedPromptsUtil = (channel: string, thread_ts: string) => {
  return async (promptTexts: string[], title = 'Follow ups') => {
    if (promptTexts.length === 0) {
      return
    }

    // Create prompts array with the required format
    const prompts = promptTexts.map((text) => ({
      title: text,
      message: text,
    }))

    // Ensure we have at least one prompt (required by Slack API)
    await client.assistant.threads.setSuggestedPrompts({
      channel_id: channel,
      thread_ts: thread_ts,
      title,
      prompts: [prompts[0], ...prompts.slice(1)], // This ensures the type is correct
    })
  }
}

export async function getThread(
  channel_id: string,
  thread_ts: string,
  botUserId: string
): Promise<CoreMessage[]> {
  const { messages } = await client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50,
  })

  if (!messages) {
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

  return result
}

export const getBotId = async () => {
  const { user_id: botUserId } = await client.auth.test()

  if (!botUserId) {
    throw new Error('botUserId is undefined')
  }

  return botUserId
}
