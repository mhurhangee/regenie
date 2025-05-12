import { openai } from '@ai-sdk/openai'
import { tool } from 'ai'
import { ApifyClient } from 'apify-client'
import { z } from 'zod'
import { exa, tavilyClient } from './utils'

// Initialize the Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

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
      try {
        updateStatus?.(`is retrieving the contents of ${url}...`)

        // Use Tavily to extract content from the URL
        // The extract method requires URLs array and options object
        const extractionResult = await tavilyClient.extract([url], {})

        // Check if extraction was successful
        if (
          !extractionResult ||
          !Array.isArray(extractionResult) ||
          extractionResult.length === 0
        ) {
          return {
            error: 'Failed to extract content from the URL',
            results: [],
          }
        }

        // Tavily extract returns an array of extraction results
        const result = extractionResult[0]

        return {
          results: [
            {
              title: result.title || 'Unknown Title',
              url: url,
              snippet: result.text || '',
              author: result.metadata?.author || 'Unknown Author',
              published_date: result.metadata?.published_date || '',
              source: result.source || '',
            },
          ],
        }
      } catch (error) {
        console.error('Error extracting URL content:', error)
        return {
          error: 'Failed to extract content from the URL. Please check if the URL is valid.',
          results: [],
        }
      }
    },
  })
}

export function getYouTubeTranscript(updateStatus?: (status: string) => void) {
  return tool({
    description: 'Use this to retrieve the transcript of a YouTube video',
    parameters: z.object({
      url: z.string().url().describe('The YouTube video URL to get the transcript for'),
    }),
    execute: async ({ url }) => {
      try {
        // Extract video ID from the URL if needed
        const videoId = extractYouTubeVideoId(url)
        const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url

        updateStatus?.(`is retrieving the transcript for ${videoUrl}...`)

        // Prepare the input for the Apify Actor
        const input = {
          includeTimestamps: 'No',
          language: 'English',
          startUrls: [videoUrl],
        }

        // Run the Apify Actor and wait for it to finish
        const run = await apifyClient
          .actor('topaz_sharingan/Youtube-Transcript-Scraper-1')
          .call(input)

        // Fetch the results from the dataset
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems()

        if (items.length === 0) {
          return { error: 'No transcript found for this video' }
        }

        const result = items[0]

        return {
          videoTitle: result.videoTitle || 'Unknown Title',
          channelName: result.channelName || 'Unknown Channel',
          views: result.views || 'Unknown Views',
          transcript: result.transcript || 'No transcript available',
          url: videoUrl,
        }
      } catch (error) {
        console.error('Error fetching YouTube transcript:', error)
        return {
          error:
            'Failed to retrieve the transcript. Please try again or check if the video has captions available.',
        }
      }
    },
  })
}

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
