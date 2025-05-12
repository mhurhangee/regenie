# Regenie

## Channel-Specific Personalities

Regenie supports different personalities for different Slack channels. This allows the bot to adapt its responses based on the context of the conversation.

### How to Add a New Channel Personality

1. **Define the System Prompt**: Add a new system prompt constant in `lib/prompts.ts` that defines the personality's expertise and behavior.

   ```typescript
   export const NEW_PERSONALITY_SYSTEM_PROMPT = `You are Regenie, a helpful and enthusiastic Slack bot assistant specialized in [specific domain].  
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
`
   ```

2. **Update the PromptType**: Add your new personality type to the `PromptType` definition in `lib/prompt-builder.ts`.

   ```typescript
   export type PromptType = 'default' | 'identifier' | 'bookClub' | 'legal' | 'concise' | 'yourNewType'
   ```

3. **Map Channel to Personality**: Add the channel ID and corresponding personality type to the `CHANNEL_PROMPT_MAP` in `lib/prompts.ts`.

   ```typescript
   export const CHANNEL_PROMPT_MAP = {
     C08S7A2G97T: 'identifier', // #regenie-id channel
     C08RU5HMD37: 'bookClub',  // #book-club channel
     YOUR_CHANNEL_ID: 'yourNewType', // Your new channel
   }
   ```

4. **Map Personality to System Prompt**: Add the personality type and corresponding system prompt to the `PROMPT_TYPE_MAP` in `lib/prompts.ts`.

   ```typescript
   export const PROMPT_TYPE_MAP = {
     default: DEFAULT_SYSTEM_PROMPT,
     identifier: IDENTIFIER_SYSTEM_PROMPT,
     bookClub: BOOK_CLUB_SYSTEM_PROMPT,
     yourNewType: NEW_PERSONALITY_SYSTEM_PROMPT,
   }
   ```

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
- ⬜ Fun facts/news
- ⬜ Include context element in each message with the personality of Regenie
- ⬜ Consider whether to trim first two messages (in assistant threads) as they are always the same
- ⬜ Make structured data optional (i.e. allow for just text responses for app mentions etc)
- ⬜ Add persona switching
- ⬜ Better error handling for generateResponse
- ⬜ Include a backup for structured data
- ⬜ News specific tool (Tavily?)
- ⬜ YouTube search tool (YouTube Data API?)
- ⬜ Add token limits under the guise of staying green
- ⬜ Voice support