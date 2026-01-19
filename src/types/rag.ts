// RAG (Retrieval Augmented Generation) Types

export interface RagEntry {
  id: string
  title: string
  content: string
  category?: string
  tags?: string[]
  source?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RagEntryWithSimilarity extends RagEntry {
  similarity: number
}

export interface CreateRagEntryInput {
  title: string
  content: string
  embedding: number[]
  category?: string
  tags?: string[]
  source?: string
}

export interface RagSearchResult {
  results: RagEntryWithSimilarity[]
}

export interface RagListResponse {
  entries: RagEntry[]
}
