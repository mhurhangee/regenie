import { openai } from '@ai-sdk/openai'
import { Output } from 'ai'
import { z } from 'zod'

export const DEFAULT_AI_SETTINGS = {
  welcomeMessage: [
    'Hello, I’m Regenie! 🌿 Your eco-focused assistant, here to help with all things green and sustainable 🌍',
    "Hi there! I'm Regenie 🌱 — passionate about the planet and ready to chat about climate, rewilding, renewables and more!",
    'Hey! Regenie here 🌾 Let’s explore how we can make the world greener, together 💚',
    "Welcome! I'm Regenie 🌍 Your guide to sustainability, regenerative living, and environmental science 🌿",
    'Hello! Regenie reporting for green duty 🌱 Ask me anything about nature, renewables, or sustainable choices!',
    "Hi! I'm Regenie 🌾 Here to help you take small (or big!) steps toward a healthier planet 💡",
    "Hey there! Regenie here 🌿 Whether it's composting tips or carbon footprints, I'm your eco pal!",
    'Hi, I’m Regenie 🌱 Need help with climate action, clean energy, or rewilding? Let’s get into it!',
    'Greetings from Regenie! 🌍 Here to share climate knowledge and inspire positive change 🌿',
    'Hey! Regenie in the chat 💬 Ready to talk green energy, ecology, and sustainable solutions 🌞',
  ],
  initialFollowups: [
    '🌾 Can you explain regenerative agriculture in simple terms?',
    '⚡ What are the latest breakthroughs in renewable energy?',
    '🦋 How does climate change affect UK biodiversity?',
    '📦 What sustainable packaging alternatives exist for small businesses?',
    '♻️ What’s a good way to start composting at home?',
    '🚗 Are electric vehicles truly better for the environment?',
    '🇬🇧 Can you recommend UK-based environmental charities or projects to support?',
    '🏙️ How can urban areas support biodiversity?',
    '🔄 What is circular economy and why is it important?',
    '🌞 How do wind and solar power compare in efficiency?',
    '🌼 What are some eco-friendly gardening tips?',
    '🏡 How can I make my home more energy-efficient?',
    '🌍 What is carbon offsetting and does it really work?',
    '👗 How does fast fashion harm the environment?',
    '🌿 What are green roofs and how do they help cities?',
    '🥦 Is plant-based eating better for the planet?',
    '🌳 How can communities get involved in rewilding projects?',
  ],
  initialFollowupsTitle: [
    '🌿 Try asking me this!',
    '💡 Need ideas? Start here!',
    '🌍 Curious? Try one of these!',
    '✨ Ask away — or pick a prompt!',
    '📚 Learn something new today!',
    '🧠 Here’s some inspo to get going!',
    '🌱 Explore a green idea!',
    '👋 Not sure what to ask? Try this!',
    '🗣️ Start the convo with these!',
    '🤔 Try one of these to begin!',
  ],
  followUpTitle: [
    '🔎 Want to dig deeper?',
    '💬 Let’s keep the convo going!',
    "🌿 Here's what else we could explore...",
    '🤓 Follow-up ideas for you!',
    '✨ More you might find interesting!',
    '📌 Want to go further?',
    '🌱 Here’s another angle!',
    '🧭 Explore this next?',
    '📖 Keep learning with these!',
    '🔁 Curious about more?',
  ],
  thinkingMessage: [
    '🌱 Regrowing some thoughts...',
    '🧠 Composting ideas into answers...',
    '🌍 Gathering eco-friendly insights...',
    '🔋 Charging up a green response...',
    '🍃 Let me photosynthesise that...',
    '🐝 Pollinating some ideas...',
    '🧑‍🔬 Brewing up a sustainable solution...',
    '📚 Reading the leaves on this one...',
    '💭 Thinking green thoughts...',
    '🌾 Cultivating an answer just for you...',
    '💨 Blowing in the right facts...',
    '☀️ Soaking up some solar-powered insights...',
    '🌳 Rooting around for the best info...',
  ],
  model: openai.responses('gpt-4.1-mini'),
  maxSteps: 10,
  maxTokens: 5000,
  temperature: 0.7,
  systemPrompt: `You are Regenie, a helpful and enthusiastic Slack bot assistant.  
    - You are an expert in environmental science, ecology, renewable energy, rewilding, sustainability, and regenerative agriculture.  
    - You're deeply passionate about protecting the environment and love engaging with others about green practices.  
    - You are based in the UK and reflect British spelling and context.  
    - Keep responses concise, informative, and friendly.  
    - Never tag users in your replies.  
    - Use markdown formatting and emojis to make replies visually engaging.  
    - Always include sources if using web search — cite them inline where relevant.  
    - The current date is: ${new Date().toISOString().split('T')[0]}  
    `,
  structuredAdditionPrompt: `
    - Your response should be formated as a valid JSON object and not surrounded by backticks.
    - The JSON object should have the following structure:
    {
      "threadTitle": "A short title for the entire thread include emojis.",
      "response": "Your response to the user's message. This is the most important part of the response. Format the response with markdown and emojis.",
      "followUps": "Optional array of follow up prompts from the user's perspective to continue the conversation"
    }
    `,
  output: Output.object({
    schema: z.object({
      threadTitle: z.string().describe('A short title for the entire thread include emojis.'),
      response: z
        .string()
        .describe(
          "Your response to the user's message. This is the most important part of the response. Format the response with markdown and emojis."
        ),
      followUps: z
        .array(
          z
            .string()
            .describe(
              "A follow up prompt from the user's perspective to continue the conversation. Include a relevant emoji at the start of the prompt."
            )
        )
        .describe(
          "Optional list of follow up prompts from the user's perspective to continue the conversation"
        ),
    }),
  }),
}

export const ERRORS = {
  initialMessage: 'Failed to post initial message',
}
