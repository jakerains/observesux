import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, formatCount } from './utils'

interface NewsItem {
  id: string
  title: string
  source?: string
  pubDate?: string
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

export function NewsCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<NewsItem[]> | NewsItem[]>(output)
  const articles = ((data as ApiResponse<NewsItem[]>)?.data ?? data ?? []) as NewsItem[]

  if (error) {
    return <ToolCardBase title="News" icon="newspaper.fill" status="alert" error={error} />
  }

  if (!articles || articles.length === 0) {
    return (
      <ToolCardBase title="News" icon="newspaper.fill" status="attention" error="No local headlines found." />
    )
  }

  return (
    <ToolCardBase title="News" icon="newspaper.fill" status="normal">
      <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        {formatCount(articles.length, 'headline')} available
      </Text>
      <View style={{ gap: 6, marginTop: 6 }}>
        {articles.slice(0, 3).map((article) => (
          <View key={article.id} style={{ gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              {article.title}
            </Text>
            {article.source ? (
              <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
                {article.source}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ToolCardBase>
  )
}
