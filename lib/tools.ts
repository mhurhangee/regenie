import { openai } from '@ai-sdk/openai'
import { tool } from 'ai'
import { z } from 'zod'
import { exa } from './utils'

export const openaiWebSearchTool = openai.tools.webSearchPreview({
  searchContextSize: 'medium',
  userLocation: {
    type: 'approximate',
    country: 'GB',
    region: 'Hampshire',
  },
})

export function getWeather(updateStatus?: (status: string) => void) {
  return tool({
    description: 'Get the current weather at a location',
    parameters: z.object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string(),
    }),
    execute: async ({ latitude, longitude, city }) => {
      updateStatus?.(`is getting weather for ${city}...`)

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`
      )

      const weatherData = await response.json()
      return {
        temperature: weatherData.current.temperature_2m,
        weatherCode: weatherData.current.weathercode,
        humidity: weatherData.current.relativehumidity_2m,
        city,
      }
    },
  })
}

export function searchUrl(updateStatus?: (status: string) => void) {
  return tool({
    description: 'Use this to retrieve the contents of a user-provided URL',
    parameters: z.object({
      url: z.string(),
    }),
    execute: async ({ url }) => {
      updateStatus?.(`is retrieving the contents of ${url}...`)
      const { results } = await exa.getContents(url, {
        text: {
          maxCharacters: 10000,
        },
        livecrawl: 'always',
      })

      return {
        results: results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.text,
        })),
      }
    },
  })
}
