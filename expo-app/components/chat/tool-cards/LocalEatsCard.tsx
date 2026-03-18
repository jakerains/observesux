import { Text, View, Linking, Pressable } from 'react-native'
import { platformColor } from '@/lib/platformColors'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData } from './utils'

interface RestaurantResult {
  name: string
  rating: number
  reviewCount: number
  price: string
  categories: string
  phone: string
  address: string
  yelpUrl: string
  id: string
}

interface LocalEatsData {
  restaurants: RestaurantResult[]
  total: number
  source: string
}

function RestaurantRow({ r }: { r: RestaurantResult }) {
  return (
    <View
      style={{
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(230, 156, 58, 0.08)',
        borderWidth: 0.5,
        borderColor: platformColor('separator'),
        gap: 3,
      }}
    >
      <Pressable onPress={() => r.yelpUrl && Linking.openURL(r.yelpUrl)}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 13, fontWeight: '600', color: '#e69c3a' }}
        >
          {r.name}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#f59e0b' }}>
          {r.rating.toFixed(1)}★
        </Text>
        <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>
          ({r.reviewCount})
        </Text>
        {r.price !== 'N/A' && (
          <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>
            · {r.price}
          </Text>
        )}
        {r.categories ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, color: platformColor('tertiaryLabel'), flex: 1 }}
          >
            · {r.categories}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {r.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${r.phone}`)}>
            <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>
              {r.phone}
            </Text>
          </Pressable>
        ) : null}
        {r.address ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, color: platformColor('tertiaryLabel'), flex: 1 }}
          >
            {r.address}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export function LocalEatsCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<LocalEatsData>(output)

  if (error) {
    return <ToolCardBase title="Local Eats" icon="fork.knife" status="alert" error={error} />
  }

  if (!data || !data.restaurants) {
    return (
      <ToolCardBase
        title="Local Eats"
        icon="fork.knife"
        status="attention"
        error="No restaurant data available."
      />
    )
  }

  const { restaurants, total } = data
  const displayed = restaurants.slice(0, 5)
  const remaining = restaurants.length - 5

  return (
    <ToolCardBase title="Local Eats" icon="fork.knife" status="normal">
      <View style={{ gap: 6 }}>
        {displayed.map((r) => (
          <RestaurantRow key={r.id} r={r} />
        ))}
      </View>

      {remaining > 0 && (
        <Text
          style={{
            fontSize: 11,
            color: platformColor('secondaryLabel'),
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          +{remaining} more of {total} total
        </Text>
      )}

      <Text
        style={{
          fontSize: 10,
          color: platformColor('tertiaryLabel'),
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        Powered by Yelp
      </Text>
    </ToolCardBase>
  )
}
