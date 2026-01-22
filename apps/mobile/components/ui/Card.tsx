import { View, Text, useColorScheme, type ViewProps } from 'react-native';
import { StatusIndicator, type StatusType } from './StatusIndicator';
import { formatDistanceToNow } from 'date-fns';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          padding: 16,
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  icon?: React.ReactNode;
  status?: StatusType;
  lastUpdated?: Date;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  icon,
  status,
  lastUpdated,
  action,
}: CardHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && <View>{icon}</View>}
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{title}</Text>
        {status && <StatusIndicator status={status} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {lastUpdated && (
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
          </Text>
        )}
        {action}
      </View>
    </View>
  );
}

interface DashboardCardProps extends ViewProps {
  title: string;
  icon?: React.ReactNode;
  status?: StatusType;
  lastUpdated?: Date;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  icon,
  status,
  lastUpdated,
  action,
  children,
  style,
  ...props
}: DashboardCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          padding: 16,
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
      {...props}
    >
      <CardHeader
        title={title}
        icon={icon}
        status={status}
        lastUpdated={lastUpdated}
        action={action}
      />
      {children}
    </Animated.View>
  );
}
