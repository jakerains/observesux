/**
 * Alert Subscriptions Hook
 *
 * Manages user's alert subscription preferences for different alert types
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher, apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { useAuthStore } from '@/lib/auth';

export type AlertType = 'weather' | 'river' | 'air_quality' | 'traffic';

export interface AlertSubscription {
  id: string;
  userId: string;
  alertType: AlertType;
  enabled: boolean;
  config: AlertConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AlertConfig {
  // Weather-specific
  severityThreshold?: 'minor' | 'moderate' | 'severe' | 'extreme';
  includeWatches?: boolean;
  includeWarnings?: boolean;
  includeAdvisories?: boolean;

  // River-specific
  floodStageThreshold?: 'action' | 'minor' | 'moderate' | 'major';

  // Air quality-specific
  aqiThreshold?: number;

  // Traffic-specific
  includeRoadClosures?: boolean;
  includeAccidents?: boolean;
  includeConstruction?: boolean;
}

interface AlertSubscriptionsResponse {
  subscriptions: Record<AlertType, AlertSubscription>;
  availableTypes: AlertType[];
}

interface UpsertAlertInput {
  alertType: AlertType;
  enabled?: boolean;
  config: AlertConfig;
}

interface ToggleAlertInput {
  alertType: AlertType;
  enabled: boolean;
}

/**
 * Hook to fetch and manage alert subscriptions
 */
export function useAlertSubscriptions() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch current subscriptions
  const query = useQuery<AlertSubscriptionsResponse>({
    queryKey: ['alertSubscriptions'],
    queryFn: () => fetcher<AlertSubscriptionsResponse>(API_ENDPOINTS.alertSubscriptions),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create or update subscription
  const upsertMutation = useMutation({
    mutationFn: async (input: UpsertAlertInput) => {
      const response = await apiClient.post<{ success: boolean; subscription: AlertSubscription }>(
        API_ENDPOINTS.alertSubscriptions,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
    },
  });

  // Toggle subscription enabled status
  const toggleMutation = useMutation({
    mutationFn: async (input: ToggleAlertInput) => {
      const response = await apiClient.patch<{ success: boolean }>(
        API_ENDPOINTS.alertSubscriptions,
        input
      );
      return response.data;
    },
    onMutate: async (input) => {
      // Optimistically update the cache
      await queryClient.cancelQueries({ queryKey: ['alertSubscriptions'] });

      const previousData = queryClient.getQueryData<AlertSubscriptionsResponse>(['alertSubscriptions']);

      if (previousData?.subscriptions?.[input.alertType]) {
        queryClient.setQueryData<AlertSubscriptionsResponse>(['alertSubscriptions'], {
          ...previousData,
          subscriptions: {
            ...previousData.subscriptions,
            [input.alertType]: {
              ...previousData.subscriptions[input.alertType],
              enabled: input.enabled,
            },
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['alertSubscriptions'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
    },
  });

  // Delete subscription
  const deleteMutation = useMutation({
    mutationFn: async (alertType: AlertType) => {
      const response = await apiClient.delete<{ success: boolean }>(
        API_ENDPOINTS.alertSubscriptions,
        { data: { alertType } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSubscriptions'] });
    },
  });

  // Helper to check if a specific alert type is enabled
  const isAlertEnabled = (alertType: AlertType): boolean => {
    return query.data?.subscriptions?.[alertType]?.enabled ?? false;
  };

  // Helper to get subscription for a specific type
  const getSubscription = (alertType: AlertType): AlertSubscription | undefined => {
    return query.data?.subscriptions?.[alertType];
  };

  // Helper to toggle an alert type
  const toggleAlert = async (alertType: AlertType) => {
    const currentEnabled = isAlertEnabled(alertType);
    const hasSubscription = !!getSubscription(alertType);

    if (!hasSubscription) {
      // Create new subscription with default config
      await upsertMutation.mutateAsync({
        alertType,
        enabled: true,
        config: getDefaultConfig(alertType),
      });
    } else {
      await toggleMutation.mutateAsync({
        alertType,
        enabled: !currentEnabled,
      });
    }
  };

  return {
    subscriptions: query.data?.subscriptions ?? {},
    availableTypes: query.data?.availableTypes ?? ['weather', 'river', 'air_quality', 'traffic'],
    isLoading: query.isLoading,
    error: query.error,
    isAlertEnabled,
    getSubscription,
    toggleAlert,
    upsertAlert: upsertMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    isUpdating: upsertMutation.isPending || toggleMutation.isPending || deleteMutation.isPending,
  };
}

/**
 * Get default configuration for an alert type
 */
function getDefaultConfig(alertType: AlertType): AlertConfig {
  switch (alertType) {
    case 'weather':
      return {
        severityThreshold: 'moderate',
        includeWatches: true,
        includeWarnings: true,
        includeAdvisories: false,
      };
    case 'river':
      return {
        floodStageThreshold: 'minor',
      };
    case 'air_quality':
      return {
        aqiThreshold: 101, // Unhealthy for sensitive groups
      };
    case 'traffic':
      return {
        includeRoadClosures: true,
        includeAccidents: true,
        includeConstruction: false,
      };
    default:
      return {};
  }
}
