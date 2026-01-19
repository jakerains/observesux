import { RagAdmin } from '@/components/rag/RagAdmin'

export const metadata = {
  title: 'Knowledge Base Admin | Siouxland.online',
  description: 'Manage RAG knowledge base entries for the chat assistant',
}

export default function RagPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <RagAdmin />
      </div>
    </main>
  )
}
