import { View, Text, type ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-primary', text: 'text-white' },
  secondary: { bg: 'bg-muted', text: 'text-muted-foreground' },
  destructive: { bg: 'bg-destructive', text: 'text-white' },
  success: { bg: 'bg-success', text: 'text-white' },
  warning: { bg: 'bg-warning', text: 'text-black' },
  outline: { bg: 'bg-transparent border border-border', text: 'text-foreground' },
};

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={`px-2 py-0.5 rounded-full ${styles.bg} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${styles.text}`}>
        {children}
      </Text>
    </View>
  );
}

// Severity badge for alerts
interface SeverityBadgeProps {
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const severityVariants: Record<string, BadgeVariant> = {
    Minor: 'secondary',
    Moderate: 'warning',
    Severe: 'destructive',
    Extreme: 'destructive',
  };

  return <Badge variant={severityVariants[severity]}>{severity}</Badge>;
}
