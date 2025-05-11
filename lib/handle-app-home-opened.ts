import type { AppHomeOpenedEvent } from '@slack/web-api'
import { Blocks, Elements, HomeTab } from 'slack-block-builder'
import { logger } from './logger'
import { client } from './slack-utils'

export const handleAppHomeOpened = async (event: AppHomeOpenedEvent) => {
  try {
    const userId = event.user

    // Build the home tab view using slack-block-builder
    const homeView = HomeTab()
      .blocks(
        Blocks.Header({ text: 'Welcome to Regenie! 🚀' }),

        Blocks.Divider(),

        Blocks.Section({ text: '*How to use this app:*' }),

        Blocks.Section({
          text: '• Send a direct message to start a conversation\n• Mention the app in a channel with `@Regenie`\n• Use the app to get AI-powered assistance',
        }),

        Blocks.Divider(),

        Blocks.Section({ text: '*Recent Updates*' }),

        Blocks.Section({
          text: '• Added App Home interface\n• Improved response time\n• Enhanced conversation capabilities',
        }),

        Blocks.Divider(),

        Blocks.Actions().elements(
          Elements.Button({ text: 'Start a Conversation', value: 'start_conversation' }).primary(),
          Elements.Button({ text: 'View Documentation', value: 'view_docs' })
        )
      )
      .buildToObject()

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
