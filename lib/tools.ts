import { tool } from 'ai'
import { z } from 'zod'
import { exa } from './utils'

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

export function searchWeb(updateStatus?: (status: string) => void) {
  return tool({
    description: 'Use this to search the web for information',
    parameters: z.object({
      query: z.string(),
      specificDomain: z
        .string()
        .nullable()
        .describe(
          'a domain to search if the user specifies e.g. bbc.com. Should be only the domain name without the protocol'
        ),
    }),
    execute: async ({ query, specificDomain }) => {
      updateStatus?.(`is searching the web for ${query}...`)
      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 3,
        includeDomains: specificDomain ? [specificDomain] : undefined,
      })

      return {
        results: results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.text.slice(0, 1000),
        })),
      }
    },
  })
}
