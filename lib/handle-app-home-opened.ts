import type { AppHomeOpenedEvent, HomeView, KnownBlock } from '@slack/web-api'
import { logger } from './logger'
import { client } from './slack-utils'

export const handleAppHomeOpened = async (event: AppHomeOpenedEvent) => {
  try {
    const userId = event.user

    // Using native Slack Block Kit format
    const homeView: HomeView = {
      type: 'home',
      blocks: [
        // Header
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Welcome to Regenie! 🚀',
            emoji: true,
          },
        },

        // 1. Intro paragraph
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Regenie is your eco-focused AI-powered assistant for Slack. Get instant help, generate content, answer questions, and boost your productivity without leaving your workspace.',
          },
        },

        {
          type: 'divider',
        },

        // 2. Quick Start section
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Quick Start*',
          },
        },

        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💬 *Direct Message:* Start a private conversation with Regenie',
            },
            {
              type: 'mrkdwn',
              text: '\n🔄 *Channel Mention:* Use `@Regenie` in any channel to get help',
            },
            {
              type: 'mrkdwn',
              text: '\n↗️ *Side Panel:* Add to the top bar for easy access, click the ⫶ and add to top bar ',
            },
          ],
        },

        {
          type: 'divider',
        },

        // 3. Features section
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Features*',
          },
        },

        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🧠 *AI-Powered Assistance:* Get intelligent responses to your questions',
            },
            {
              type: 'mrkdwn',
              text: '\n🌐 *Powerful Web Search:* For up to date sources',
            },
            {
              type: 'mrkdwn',
              text: '\n⚡ *Fast Responses:* Optimized for quick, helpful answers',
            },
            {
              type: 'mrkdwn',
              text: '🔍 *Context Awareness:* Remembers conversation history',
            },
            {
              type: 'mrkdwn',
              text: '✍️ *Content Generation:* Draft messages, summaries, and more',
            },
          ],
        },

        {
          type: 'divider',
        },

        // 4. Tips and Tricks section
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Tips & Tricks*',
          },
        },

        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 *Be Specific:* The more details you provide, the better the response',
            },
            {
              type: 'mrkdwn',
              text: '🔄 *Follow-ups:* Ask follow-up questions to refine responses',
            },
            {
              type: 'mrkdwn',
              text: '📋 *Lists:* Ask for information in list format for better readability',
            },
          ],
        },
      ],
    }

    // Call views.publish with the built-in client
    await client.views.publish({
      user_id: userId,
      view: homeView,
    })

    logger.debug('App home published successfully')
  } catch (error) {
    logger.error(`Error publishing app home: ${error}`)
  }
}
