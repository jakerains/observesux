import { tool } from 'ai'
import { z } from 'zod'
import { chatTools } from './tools'

export const CONTENT_TYPES = [
  'social-post',
  'press-release',
  'newsletter-blurb',
  'event-announcement',
  'council-summary',
  'free-form',
] as const

export type ContentType = typeof CONTENT_TYPES[number]

export const adminChatTools = {
  ...chatTools,

  writeToCanvas: tool({
    description:
      'Send drafted content to the admin\'s editing canvas. Call this whenever the admin asks you to write, draft, create, or revise content. Always include the full formatted content in markdown. When refining existing canvas content, send the complete updated version (not just the diff).',
    inputSchema: z.object({
      contentType: z
        .enum(CONTENT_TYPES)
        .describe('The type of content being created'),
      title: z.string().describe('A title or headline for the content'),
      body: z.string().describe('The full content body in markdown format'),
    }),
    execute: async ({ contentType, title, body }) => {
      return { contentType, title, body, sentToCanvas: true }
    },
  }),
}
