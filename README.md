# Regenie

## Channel-Specific Personalities

Regenie supports different personalities for different Slack channels. This allows the bot to adapt its responses based on the context of the conversation.

### How to Add a New Channel Personality

1. **Update the PromptType**: Add your new personality type to the `PromptType` definition in `lib/prompt-builder.ts`.

   ```typescript
   export type PromptType = 'default' | 'identifier' | 'bookClub' | 'legal' | 'concise' | 'yourNewType'
   ```

2. **Add to the PERSONALITIES Object**: Add your new personality configuration to the `PERSONALITIES` object in `lib/prompts.ts`.

   ```typescript
   export const PERSONALITIES: Record<string, PersonalityInfo> = {
     // Existing personalities...
     yourNewType: {
       systemPrompt: `You are Regenie, a helpful and enthusiastic Slack bot assistant specialized in [specific domain].  
         - You are an expert in [list relevant expertise areas].
         - [Add more personality traits and capabilities].
         - [Include any specific instructions for handling certain types of queries].
         - You are based in the UK and reflect British spelling and context.
         - Keep responses concise, informative, and friendly.
         - Never tag users in your replies.
         - Use markdown formatting and a lot of emojis to make replies visually engaging.
         - ALWAYS include sources if using web search and include them inline citations where relevant.
         - [Add any other specific instructions].
         - The current date is: ${new Date().toISOString().split('T')[0]}
       `,
       emoji: '🔧', // Choose an appropriate emoji
       name: 'Your Personality Name',
       description: 'Brief description of this personality\'s expertise',
       channels: ['YOUR_CHANNEL_ID'], // Add channel IDs where this personality should be used
     },
   }
   ```

   That's it! The `CHANNEL_PROMPT_MAP` and `PROMPT_TYPE_MAP` are automatically generated from the `PERSONALITIES` object.

### Currently Available Personalities

- **Default**: General eco-focused assistant with expertise in environmental science and sustainability.
- **Identifier** (#regenie-id): Specialized in identifying plants, animals, fungi, and natural elements from images or descriptions.
- **Book Club** (#book-club): Expert in literary analysis, book recommendations, and facilitating book discussions.

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
- ✅ PDF and image upload support for assistant messages and threads.
- ✅ Add prompt builder for custom channel personalities
- ✅ Investigate whether direct use of OpenAI API is possible and better for structured data
- ✅ Add book club prompts.
- ✅ Make adding channel specific personalities mapping easier and more logical
- ✅ Include a backup for structured data (three attempts)
- ⬜ Regenie to add .md (or .txt) files to threads with info it extracts?  Might be handy for tool results etc, because otherwise context of the URL may be lost as only the final messages are provided to the assistant.
- ⬜ Add context to context element in each message with the personality of Regenie
- ⬜ Fun facts scheduled
- ⬜ Fun facts random
- ⬜ News scheduled
- ⬜ News random
- ⬜ Consider whether to trim first two messages (in assistant threads) as they are always the same
- ⬜ Make structured data optional (i.e. allow for just text responses for app mentions etc)
- ⬜ Add persona switching
- ⬜ Better error handling for generateResponse
- ⬜ News specific tool (Tavily?)
- ⬜ YouTube search tool (YouTube Data API?)
- ⬜ Add token limits under the guise of staying green
- ⬜ Voice support