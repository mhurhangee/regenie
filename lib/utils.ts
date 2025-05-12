import { tavily } from '@tavily/core'
import Exa from 'exa-js'

export const exa = new Exa(process.env.EXA_API_KEY)

// Initialize Tavily client
export const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

export function getRandomSubList(listStrings: string[], count = 3): string[] {
  const shuffled = [...listStrings].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
