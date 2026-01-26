import { Globe, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import type { ToolCardProps } from './types'

interface PerplexitySearchResult {
  title: string
  url: string
  snippet: string
  date?: string
  last_updated?: string
}

interface PerplexitySearchResponse {
  results: PerplexitySearchResult[]
  id: string
}

type PerplexitySearchOutput = PerplexitySearchResponse | { error: string }

interface SearchResultRowProps {
  result: PerplexitySearchResult
}

function SearchResultRow({ result }: SearchResultRowProps) {
  // Extract domain from URL for display
  let domain = ''
  try {
    domain = new URL(result.url).hostname.replace('www.', '')
  } catch {
    domain = result.url
  }

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-2 rounded-lg hover:bg-muted/70 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {result.title}
          </h4>
          {result.snippet && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {result.snippet}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {domain}
            </Badge>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>
    </a>
  )
}

export function PerplexitySearchCard({ data, error, state }: ToolCardProps<PerplexitySearchOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string' && !('results' in data)) {
    return (
      <ToolCardWrapper
        title="Web Search"
        icon={<Globe className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const searchData = data as PerplexitySearchResponse
  const results = searchData?.results || []

  if (results.length === 0) {
    return (
      <ToolCardWrapper
        title="Web Search"
        icon={<Globe className="h-3.5 w-3.5" />}
        error="No results found"
      />
    )
  }

  return (
    <ToolCardWrapper
      title="Web Search"
      icon={<Globe className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Result count */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed">
        <div className="text-sm font-medium">Search Results</div>
        <Badge variant="secondary" className="text-xs">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Results list */}
      <div className="space-y-1 -mx-1">
        {results.slice(0, 5).map((result, index) => (
          <SearchResultRow key={result.url || index} result={result} />
        ))}
      </div>

      {results.length > 5 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          +{results.length - 5} more result{results.length - 5 !== 1 ? 's' : ''}
        </div>
      )}
    </ToolCardWrapper>
  )
}
