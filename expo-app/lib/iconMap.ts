type IconFamily = 'MaterialCommunityIcons' | 'Ionicons';

interface IconMapping {
  family: IconFamily;
  name: string;
}

export const iconMap: Record<string, IconMapping> = {
  // Navigation / arrows
  'arrow.clockwise': { family: 'Ionicons', name: 'refresh' },
  'arrow.counterclockwise': { family: 'Ionicons', name: 'refresh' },
  'arrow.right': { family: 'Ionicons', name: 'arrow-forward' },
  'arrow.up': { family: 'Ionicons', name: 'arrow-up' },
  'arrow.up.left.and.arrow.down.right': { family: 'Ionicons', name: 'expand' },
  'arrow.up.right': { family: 'Ionicons', name: 'open-outline' },

  // Notifications
  'bell': { family: 'Ionicons', name: 'notifications-outline' },
  'bell.badge': { family: 'Ionicons', name: 'notifications-outline' },
  'bell.badge.fill': { family: 'Ionicons', name: 'notifications' },
  'bell.slash.fill': { family: 'Ionicons', name: 'notifications-off' },

  // Buildings / places
  'building.columns': { family: 'MaterialCommunityIcons', name: 'bank' },
  'building.columns.fill': { family: 'MaterialCommunityIcons', name: 'bank' },

  // Transit
  'bus': { family: 'Ionicons', name: 'bus-outline' },
  'bus.fill': { family: 'Ionicons', name: 'bus' },

  // Calendar / time
  'calendar': { family: 'Ionicons', name: 'calendar-outline' },
  'clock': { family: 'Ionicons', name: 'time-outline' },
  'timer': { family: 'Ionicons', name: 'timer-outline' },

  // Actions
  'checkmark': { family: 'Ionicons', name: 'checkmark' },
  'square.and.arrow.up': { family: 'Ionicons', name: 'share-outline' },

  // Chevrons
  'chevron.down': { family: 'Ionicons', name: 'chevron-down' },
  'chevron.right': { family: 'Ionicons', name: 'chevron-forward' },
  'chevron.up': { family: 'Ionicons', name: 'chevron-up' },

  // Weather
  'cloud.sun': { family: 'MaterialCommunityIcons', name: 'weather-partly-cloudy' },
  'cloud.sun.fill': { family: 'MaterialCommunityIcons', name: 'weather-partly-cloudy' },
  'sun.max.fill': { family: 'Ionicons', name: 'sunny' },
  'sunrise.fill': { family: 'MaterialCommunityIcons', name: 'weather-sunset-up' },
  'sunset.fill': { family: 'MaterialCommunityIcons', name: 'weather-sunset-down' },
  'thermometer': { family: 'Ionicons', name: 'thermometer-outline' },
  'thermometer.medium': { family: 'Ionicons', name: 'thermometer-outline' },
  'wind': { family: 'MaterialCommunityIcons', name: 'weather-windy' },
  'humidity.fill': { family: 'MaterialCommunityIcons', name: 'water-percent' },
  'drop.fill': { family: 'Ionicons', name: 'water' },
  'moon': { family: 'Ionicons', name: 'moon-outline' },
  'moon.fill': { family: 'Ionicons', name: 'moon' },
  'moon.stars.fill': { family: 'Ionicons', name: 'moon' },

  // Documents
  'doc.text': { family: 'Ionicons', name: 'document-text-outline' },
  'newspaper': { family: 'Ionicons', name: 'newspaper-outline' },
  'newspaper.fill': { family: 'Ionicons', name: 'newspaper' },

  // Menu / more
  'ellipsis.circle': { family: 'Ionicons', name: 'ellipsis-horizontal-circle-outline' },
  'ellipsis.circle.fill': { family: 'Ionicons', name: 'ellipsis-horizontal-circle' },

  // Communication
  'envelope.fill': { family: 'Ionicons', name: 'mail' },

  // Alerts / warnings
  'exclamationmark.circle': { family: 'Ionicons', name: 'alert-circle-outline' },
  'exclamationmark.triangle.fill': { family: 'Ionicons', name: 'warning' },

  // Food / fuel
  'fork.knife': { family: 'MaterialCommunityIcons', name: 'silverware-fork-knife' },
  'fuelpump': { family: 'MaterialCommunityIcons', name: 'gas-station-outline' },
  'fuelpump.fill': { family: 'MaterialCommunityIcons', name: 'gas-station' },

  // Home
  'house': { family: 'Ionicons', name: 'home-outline' },
  'house.fill': { family: 'Ionicons', name: 'home' },

  // Nature
  'leaf.fill': { family: 'Ionicons', name: 'leaf' },

  // Location
  'location': { family: 'Ionicons', name: 'location-outline' },
  'location.fill': { family: 'Ionicons', name: 'location' },

  // Security
  'lock.fill': { family: 'Ionicons', name: 'lock-closed' },
  'shield.checkered': { family: 'Ionicons', name: 'shield-checkmark-outline' },

  // Map
  'map': { family: 'Ionicons', name: 'map-outline' },
  'map.fill': { family: 'Ionicons', name: 'map' },

  // People
  'person.badge.plus': { family: 'Ionicons', name: 'person-add' },
  'person.fill': { family: 'Ionicons', name: 'person' },

  // Media
  'photo': { family: 'Ionicons', name: 'image-outline' },
  'play.rectangle.fill': { family: 'Ionicons', name: 'play-circle' },
  'video': { family: 'Ionicons', name: 'videocam-outline' },
  'video.fill': { family: 'Ionicons', name: 'videocam' },
  'video.slash': { family: 'Ionicons', name: 'videocam-off-outline' },

  // Gauges
  'gauge.with.dots.needle.67percent': { family: 'MaterialCommunityIcons', name: 'gauge' },

  // Search
  'magnifyingglass': { family: 'Ionicons', name: 'search' },

  // Devices / system
  'apps.iphone': { family: 'Ionicons', name: 'phone-portrait-outline' },
  'info.circle': { family: 'Ionicons', name: 'information-circle-outline' },
  'globe': { family: 'Ionicons', name: 'globe-outline' },
  'chevron.left.forwardslash.chevron.right': { family: 'Ionicons', name: 'code-slash-outline' },

  // Misc
  'sparkles': { family: 'Ionicons', name: 'sparkles' },
  'star': { family: 'Ionicons', name: 'star-outline' },
  'star.fill': { family: 'Ionicons', name: 'star' },
  'star.leadinghalf.filled': { family: 'Ionicons', name: 'star-half' },
};
