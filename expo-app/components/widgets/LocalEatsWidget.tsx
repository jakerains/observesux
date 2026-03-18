/**
 * Local Eats Widget - Top Sioux City restaurants from Yelp
 */

import { useState, useMemo } from 'react';
import { View, Pressable, Text, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { useLocalEats, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';
import type { LocalEatsRestaurant } from '@/lib/types';

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(
        <AppIcon key={i} name="star.fill" size={12} color="#f59e0b" />
      );
    } else if (rating >= i - 0.5) {
      stars.push(
        <AppIcon key={i} name="star.leadinghalf.filled" size={12} color="#f59e0b" />
      );
    } else {
      stars.push(
        <AppIcon key={i} name="star" size={12} color={platformColor('tertiaryLabel')} />
      );
    }
  }
  return <View style={{ flexDirection: 'row', gap: 1 }}>{stars}</View>;
}

function RestaurantRow({ restaurant }: { restaurant: LocalEatsRestaurant }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(restaurant.yelpUrl);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: platformColor('separator'),
        gap: 10,
      }}
    >
      {restaurant.imageUrl ? (
        <Image
          source={{ uri: restaurant.imageUrl }}
          style={{ width: 48, height: 48, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontWeight: '600', color: platformColor('label') }}>
          {restaurant.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <StarRating rating={restaurant.rating} />
          <Text style={{ fontSize: 11, color: platformColor('secondaryLabel') }}>
            {restaurant.reviewCount}
          </Text>
          {restaurant.price && (
            <Text style={{ fontSize: 11, color: platformColor('secondaryLabel') }}>
              · {restaurant.price}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
          {restaurant.categories.slice(0, 2).map((cat) => (
            <View
              key={cat.alias}
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: platformColor('tertiarySystemFill'),
              }}
            >
              <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>
                {cat.title}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export function LocalEatsWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useLocalEats();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const eatsData = data?.data;

  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.localEats, isLoading, isError);

  // Extract top categories
  const restaurants = eatsData?.restaurants;

  const topCategories = useMemo(() => {
    if (!restaurants) return [];
    const counts = new Map<string, { alias: string; title: string; count: number }>();
    for (const r of restaurants) {
      for (const cat of r.categories) {
        const existing = counts.get(cat.alias);
        if (existing) {
          existing.count++;
        } else {
          counts.set(cat.alias, { alias: cat.alias, title: cat.title, count: 1 });
        }
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [restaurants]);

  // Filter client-side
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    if (!selectedCategory) return restaurants;
    return restaurants.filter((r) =>
      r.categories.some((c) => c.alias === selectedCategory)
    );
  }, [restaurants, selectedCategory]);

  if (isLoading) {
    return (
      <DashboardCard title="Local Eats" sfSymbol="fork.knife" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="Local Eats"
        sfSymbol="fork.knife"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: platformColor('secondaryLabel') }}>
          Unable to load restaurant data
        </Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Local Eats"
      sfSymbol="fork.knife"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Category Filter Chips */}
      {topCategories.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(null);
            }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 16,
              backgroundColor: selectedCategory === null
                ? '#f97316'
                : platformColor('tertiarySystemFill'),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedCategory === null ? '600' : '400',
                color: selectedCategory === null ? '#fff' : platformColor('label'),
              }}
            >
              All
            </Text>
          </Pressable>
          {topCategories.map((cat) => (
            <Pressable
              key={cat.alias}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(selectedCategory === cat.alias ? null : cat.alias);
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: selectedCategory === cat.alias
                  ? '#f97316'
                  : platformColor('tertiarySystemFill'),
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: selectedCategory === cat.alias ? '600' : '400',
                  color: selectedCategory === cat.alias ? '#fff' : platformColor('label'),
                }}
              >
                {cat.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <AppIcon name="fork.knife" size={32} color={platformColor('tertiaryLabel')} />
          <Text style={{ marginTop: 8, color: platformColor('secondaryLabel') }}>
            No restaurants found
          </Text>
        </View>
      ) : (
        <View>
          {filteredRestaurants.slice(0, 8).map((restaurant) => (
            <RestaurantRow key={restaurant.id} restaurant={restaurant} />
          ))}
        </View>
      )}

      {/* Yelp Attribution */}
      <Pressable
        onPress={() => Linking.openURL('https://www.yelp.com/search?find_desc=restaurants&find_loc=Sioux+City%2C+IA')}
        style={{ marginTop: 12, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 11, color: platformColor('tertiaryLabel') }}>
          Powered by Yelp
        </Text>
      </Pressable>
    </DashboardCard>
  );
}
