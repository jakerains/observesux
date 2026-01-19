import { embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// Use OpenAI directly for embeddings (to avoid AI Gateway rate limits)
// Chat still uses AI Gateway - this is just for embedding generation
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Max characters to send for embedding (~4 chars per token, 8192 token limit)
// Using 6000 tokens worth to be safe with some buffer
const MAX_CHARS_FOR_EMBEDDING = 24000

/**
 * Split text into chunks that fit within the embedding model's token limit.
 * Tries to split on paragraph boundaries for better semantic coherence.
 */
function chunkText(text: string, maxChars: number = MAX_CHARS_FOR_EMBEDDING): string[] {
  if (text.length <= maxChars) {
    return [text]
  }

  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    // If a single paragraph is too long, split it by sentences
    if (paragraph.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      // Split long paragraph by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/)
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChars) {
          if (currentChunk) {
            chunks.push(currentChunk.trim())
          }
          // If single sentence is still too long, just truncate
          currentChunk = sentence.length > maxChars
            ? sentence.slice(0, maxChars)
            : sentence
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence
        }
      }
    } else if ((currentChunk + '\n\n' + paragraph).length > maxChars) {
      // Current chunk + paragraph would exceed limit
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = paragraph
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(c => c.length > 0)
}

/**
 * Generate an embedding vector for the given text using OpenAI's text-embedding-3-small
 * directly via OpenAI API (not through AI Gateway to avoid rate limits).
 *
 * @param text - The text to generate an embedding for
 * @returns A 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Truncate if too long (simple case - for single embedding requests)
  const truncatedText = text.length > MAX_CHARS_FOR_EMBEDDING
    ? text.slice(0, MAX_CHARS_FOR_EMBEDDING)
    : text

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: truncatedText,
  })
  return embedding
}

/**
 * Generate embeddings for text, automatically chunking if too long.
 * Returns an array of {text, embedding} pairs for each chunk.
 *
 * @param text - The text to generate embeddings for
 * @returns Array of chunks with their embeddings
 */
export async function generateChunkedEmbeddings(text: string): Promise<Array<{ text: string; embedding: number[] }>> {
  const chunks = chunkText(text)
  const results: Array<{ text: string; embedding: number[] }> = []

  for (const chunk of chunks) {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: chunk,
    })
    results.push({ text: chunk, embedding })
  }

  return results
}

/**
 * Generate embeddings for multiple texts in a single batch.
 *
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of 1536-dimensional embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map(text => generateEmbedding(text))
  )
  return results
}
