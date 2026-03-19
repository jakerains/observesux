import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { AppIcon } from '@/components/AppIcon'
import { Brand } from '@/constants/BrandColors'

interface HeaderActionButtonProps {
  icon: string
  label: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

export function HeaderActionButton({
  icon,
  label,
  onPress,
  style,
}: HeaderActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          borderCurve: 'continuous',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 2,
          backgroundColor: pressed ? 'rgba(230, 156, 58, 0.18)' : 'rgba(255,255,255,0.06)',
          borderWidth: 0.5,
          borderColor: pressed ? 'rgba(230, 156, 58, 0.4)' : 'rgba(255,255,255,0.08)',
          shadowColor: '#000',
          shadowOpacity: pressed ? 0.18 : 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      <AppIcon name={icon} size={18} color={Brand.amber} />
    </Pressable>
  )
}
