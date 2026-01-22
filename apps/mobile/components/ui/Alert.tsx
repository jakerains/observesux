import { View, Text, Pressable, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

interface AlertProps extends ViewProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  icon?: React.ReactNode;
  onPress?: () => void;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string }> = {
  default: {
    bg: 'bg-muted/50',
    border: 'border-border',
    icon: '#a3a3a3',
  },
  destructive: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: '#ef4444',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: '#f59e0b',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    icon: '#22c55e',
  },
};

export function Alert({
  children,
  variant = 'default',
  icon,
  onPress,
  className = '',
  ...props
}: AlertProps) {
  const styles = variantStyles[variant];

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const content = (
    <View className="flex-row items-start gap-3">
      {icon && (
        <View className="mt-0.5">{icon}</View>
      )}
      <View className="flex-1">{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        className={`${styles.bg} border ${styles.border} rounded-lg p-3 ${className}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        {...props}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`${styles.bg} border ${styles.border} rounded-lg p-3 ${className}`}
      {...props}
    >
      {content}
    </View>
  );
}

interface AlertTitleProps {
  children: React.ReactNode;
}

export function AlertTitle({ children }: AlertTitleProps) {
  return (
    <Text className="text-sm font-semibold text-foreground">{children}</Text>
  );
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  numberOfLines?: number;
}

export function AlertDescription({ children, numberOfLines }: AlertDescriptionProps) {
  return (
    <Text
      className="text-xs text-muted-foreground mt-0.5"
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

// Pre-built weather alert component
interface WeatherAlertItemProps {
  event: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  headline: string;
  onPress?: () => void;
}

export function WeatherAlertItem({
  event,
  severity,
  headline,
  onPress,
}: WeatherAlertItemProps) {
  const variant = severity === 'Extreme' || severity === 'Severe' ? 'destructive' : 'warning';

  return (
    <Alert variant={variant} onPress={onPress}>
      <View className="flex-row items-center gap-2 mb-1">
        <Ionicons name="warning" size={16} color={variantStyles[variant].icon} />
        <AlertTitle>{event}</AlertTitle>
        <View
          className={`px-1.5 py-0.5 rounded ${
            severity === 'Extreme' ? 'bg-red-600' :
            severity === 'Severe' ? 'bg-orange-500' :
            severity === 'Moderate' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
        >
          <Text className={`text-xs font-medium ${severity === 'Moderate' ? 'text-black' : 'text-white'}`}>
            {severity}
          </Text>
        </View>
      </View>
      <AlertDescription numberOfLines={2}>{headline}</AlertDescription>
    </Alert>
  );
}
