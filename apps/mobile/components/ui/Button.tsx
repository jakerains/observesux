import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; pressed: string }> = {
  default: {
    bg: 'bg-primary',
    text: 'text-white',
    pressed: 'bg-primary-600',
  },
  secondary: {
    bg: 'bg-muted',
    text: 'text-foreground',
    pressed: 'bg-muted/80',
  },
  destructive: {
    bg: 'bg-destructive',
    text: 'text-white',
    pressed: 'bg-destructive/80',
  },
  outline: {
    bg: 'bg-transparent border border-border',
    text: 'text-foreground',
    pressed: 'bg-muted',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-foreground',
    pressed: 'bg-muted/50',
  },
};

const sizeStyles: Record<ButtonSize, { padding: string; text: string; height: string }> = {
  sm: { padding: 'px-3 py-1.5', text: 'text-sm', height: 'h-8' },
  md: { padding: 'px-4 py-2', text: 'text-base', height: 'h-10' },
  lg: { padding: 'px-6 py-3', text: 'text-lg', height: 'h-12' },
};

export function Button({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  icon,
  disabled,
  onPress,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`
        ${variantStyle.bg}
        ${sizeStyle.padding}
        ${sizeStyle.height}
        rounded-lg
        flex-row
        items-center
        justify-center
        gap-2
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? '#fff' : '#0ea5e9'}
        />
      ) : (
        <>
          {icon}
          <Text className={`${variantStyle.text} ${sizeStyle.text} font-medium`}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// Icon-only button
interface IconButtonProps extends PressableProps {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  onPress,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const variantStyle = variantStyles[variant];
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  const handlePress = (e: any) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`
        ${variantStyle.bg}
        ${iconSize}
        rounded-full
        items-center
        justify-center
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
      {...props}
    >
      {icon}
    </Pressable>
  );
}
