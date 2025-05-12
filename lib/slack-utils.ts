import crypto from 'node:crypto'
import { WebClient } from '@slack/web-api'
import type { AppMentionEvent, FileShareMessageEvent } from '@slack/web-api'
import { DEFAULT_AI_SETTINGS } from './constants'
import { ERRORS } from './constants'
import { CHANNEL_PROMPT_MAP, PERSONALITIES } from './prompts'
import type { Message } from './types'

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

export const updateMessageAsStatusUtil = async (
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
  return async (promptTexts: string[], title: string = DEFAULT_AI_SETTINGS.followUpTitle[0]) => {
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
): Promise<Message[]> {
  const { messages } = await client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50,
  })

  if (!messages) {
    throw new Error('No messages found in thread')
  }

  const result = await Promise.all(
    messages.map(async (message) => {
      const isBot = !!message.bot_id
      if (!message.text && !message.files) return null

      // For app mentions, remove the mention prefix
      // For IM messages, keep the full text
      let text = message.text || ''
      if (!isBot && text.includes(`<@${botUserId}>`)) {
        text = text.replace(`<@${botUserId}> `, '')
      }

      // If there are no files, return a simple text message
      if (!message.files || message.files.length === 0) {
        return {
          role: isBot ? 'assistant' : 'user',
          content: text,
        } as Message
      }

      // If there are files, process them and create a content array
      const contentItems = []

      // Add text if it exists
      if (text) {
        contentItems.push({
          type: 'text',
          text: text,
        })
      }

      // Process each file
      for (const file of message.files) {
        try {
          // Skip files without an ID
          if (!file.id) {
            console.warn('File without ID encountered, skipping')
            continue
          }

          // Get the file content
          const fileData = await getFileContent(file.id)

          if (file.mimetype?.startsWith('image/')) {
            // Handle image files for AISDK
            contentItems.push({
              type: 'image',
              image: `data:${file.mimetype};base64,${fileData.toString('base64')}`,
            })
          } else if (file.mimetype === 'application/pdf') {
            // Handle PDF files for AISDK
            contentItems.push({
              type: 'file',
              mimeType: 'application/pdf',
              data: fileData,
              filename: file.name || 'file.pdf',
            })
          }
          // Ignore other file types for now
        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error)
          // Continue with other files if one fails
        }
      }

      // If we have content items, return a message with content array
      if (contentItems.length > 0) {
        return {
          role: isBot ? 'assistant' : 'user',
          content: contentItems,
        } as Message
      }

      return null
    })
  )

  return result.filter((msg): msg is Message => msg !== null)
}

/**
 * Downloads file content from Slack
 * @param fileId The ID of the file to download
 * @returns Buffer containing the file data
 */
export async function getFileContent(fileId: string): Promise<Buffer> {
  try {
    // Get file info to get the URL
    const fileInfo = await client.files.info({ file: fileId })

    if (!fileInfo.file?.url_private) {
      throw new Error(`No URL found for file ${fileId}`)
    }

    // Download the file using fetch with the Slack token for authentication
    const response = await fetch(fileInfo.file.url_private, {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    // Convert the response to an ArrayBuffer and then to a Buffer
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error)
    throw error
  }
}

export const getBotId = async () => {
  const { user_id: botUserId } = await client.auth.test()

  if (!botUserId) {
    throw new Error('botUserId is undefined')
  }

  return botUserId
}

/**
 * Utility function for posting messages with personality context
 * @param channel The channel to post to
 * @param thread_ts The thread timestamp to reply to
 * @param text The text of the message
 * @param showPersonality Whether to show the personality context (defaults to true)
 * @param isFirstInThread Whether this is the first message in the thread (defaults to false)
 * @returns The result of the chat.postMessage call
 */
export const postMessageWithContext = async (
  channel: string,
  thread_ts: string,
  text: string,
  showPersonality = true,
  isFirstInThread = false
) => {
  // Only show personality context if requested and it's the first message in a thread
  // or if it's a direct message (which always uses the full schema)
  if (!showPersonality || (!isFirstInThread && !channel.startsWith('D'))) {
    return client.chat.postMessage({
      channel,
      thread_ts,
      text,
      unfurl_links: false,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text,
          },
        },
      ],
    })
  }

  // Determine which personality is being used based on the channel
  const promptType = CHANNEL_PROMPT_MAP[channel as keyof typeof CHANNEL_PROMPT_MAP] || 'default'
  const personalityInfo = PERSONALITIES[promptType] || PERSONALITIES.default

  return client.chat.postMessage({
    channel,
    thread_ts,
    text,
    unfurl_links: false,
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${personalityInfo.emoji} *${personalityInfo.name}*: ${personalityInfo.description}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
    ],
  })
}
