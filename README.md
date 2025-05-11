# Regenie

## Roadmap
- ✅ CI/CD with Vercel
- ✅ AI responses (using AI SDK and OpenAI responses)
- ✅ Logging (basic console logging)
- ✅ Formatting and linting (Biome)
- ✅ Markdown to Slack mrkdwn conversion (Slackify-Markdown)
- ✅ Weather tool (OpenMeteo)
- ✅ Web search tool (Exa)
- ✅ Precommit hooks (Husky)
- ✅ AI suggested prompts
- ✅ AI suggested title
- ✅ Remove extreme logging to clean up code
- ✅ Add a constants file and move all constants there
- ✅ Randomise initial followups, welcome messages, followup titles, and thinking message
- ✅ Improve prompt for follow ups and gen structured data
- ✅ Home page
- ✅ Test mentions (add channel history scope)
- ✅ Migrate to openai package directly
- ✅ PDF and image upload support
- ⬜ Consider whether to trim first two messages (in assistant threads) as they are always the same
- ⬜ Make structured data optional (i.e. allow for just text responses for app mentions etc)
- ⬜ Add persona switching
- ⬜ Better error handling for generateResponse
- ⬜ Include a backup for structured data
- ⬜ Investigate whether direct use of OpenAI API is possible and better for structured data
- ⬜ News specific tool (Tavily?)
- ⬜ YouTube search tool (YouTube Data API?)
- ⬜ Consider token limits
- ⬜ Improve home page
- ⬜ Voice support

## PDF and Image Support

Regenie now supports processing PDF documents and images shared in Slack conversations. This feature allows users to share visual content and documents that Regenie can analyze and respond to.

### Features

- **Image Analysis**: Regenie can analyze images shared in Slack threads and provide insights about their content.
- **PDF Document Processing**: Users can share PDF documents, and Regenie will extract and analyze the information they contain.

### Required Permissions

To enable this feature, the Slack app needs additional permissions. Add these scopes to your Slack app in the OAuth & Permissions section:

- `files:read` - View files shared in channels and conversations that Regenie has been added to
- `files:write` - Upload, edit, and delete files as Regenie

After adding these scopes, you'll need to reinstall the app to your workspace to apply the new permissions.

See `slack-app-manifest-update.md` for detailed instructions on updating your Slack app permissions.
