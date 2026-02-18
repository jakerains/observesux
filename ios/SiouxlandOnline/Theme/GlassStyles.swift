import SwiftUI

// MARK: - Legacy Glass Config (used by map overlay chrome)

enum GlassConfig {
    static let cardCornerRadius: CGFloat = 16
    static let badgeCornerRadius: CGFloat = 8
    static let pillCornerRadius: CGFloat = 20
    static let buttonCornerRadius: CGFloat = 12
    static let containerSpacing: CGFloat = 12
}

// MARK: - Card Tier System (matches web app's card hierarchy)

enum CardTier {
    case hero
    case primary
    case secondary
    case compact
}

// MARK: - Warm Card Configuration

enum WarmCardConfig {
    static func cornerRadius(for tier: CardTier) -> CGFloat {
        switch tier {
        case .hero: 24
        case .primary: 20
        case .secondary: 16
        case .compact: 8
        }
    }

    static func padding(for tier: CardTier) -> EdgeInsets {
        switch tier {
        case .hero: EdgeInsets(top: 24, leading: 24, bottom: 24, trailing: 24)
        case .primary: EdgeInsets(top: 20, leading: 20, bottom: 20, trailing: 20)
        case .secondary: EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16)
        case .compact: EdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
        }
    }
}

// MARK: - Warm Card Modifier

struct WarmCardModifier: ViewModifier {
    let tier: CardTier

    func body(content: Content) -> some View {
        let radius = WarmCardConfig.cornerRadius(for: tier)

        content
            .background(Color("SlCardBackground"), in: RoundedRectangle(cornerRadius: radius))
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(Color("SlBorder"), lineWidth: 1)
            )
            .shadow(color: .black.opacity(shadowOpacity(layer: 0)), radius: shadowRadius(layer: 0), y: shadowY(layer: 0))
            .shadow(color: .black.opacity(shadowOpacity(layer: 1)), radius: shadowRadius(layer: 1), y: shadowY(layer: 1))
            .shadow(color: .black.opacity(shadowOpacity(layer: 2)), radius: shadowRadius(layer: 2), y: shadowY(layer: 2))
    }

    // 3-layer shadow system for depth
    private func shadowOpacity(layer: Int) -> Double {
        switch (tier, layer) {
        case (.hero, 0): 0.08
        case (.hero, 1): 0.06
        case (.hero, 2): 0.04
        case (.primary, 0): 0.06
        case (.primary, 1): 0.04
        case (.primary, 2): 0.02
        case (.secondary, 0): 0.04
        case (.secondary, 1): 0.03
        case (.secondary, 2): 0.01
        case (.compact, 0): 0.03
        case (.compact, 1): 0.02
        default: 0
        }
    }

    private func shadowRadius(layer: Int) -> CGFloat {
        switch (tier, layer) {
        case (.hero, 0): 16
        case (.hero, 1): 8
        case (.hero, 2): 4
        case (.primary, 0): 12
        case (.primary, 1): 6
        case (.primary, 2): 3
        case (.secondary, 0): 8
        case (.secondary, 1): 4
        case (.secondary, 2): 2
        case (.compact, 0): 4
        case (.compact, 1): 2
        default: 0
        }
    }

    private func shadowY(layer: Int) -> CGFloat {
        switch (tier, layer) {
        case (.hero, 0): 8
        case (.hero, 1): 4
        case (.hero, 2): 2
        case (.primary, 0): 6
        case (.primary, 1): 3
        case (.primary, 2): 1
        case (.secondary, 0): 4
        case (.secondary, 1): 2
        case (.secondary, 2): 1
        case (.compact, 0): 2
        case (.compact, 1): 1
        default: 0
        }
    }
}

// MARK: - Tinted Badge Modifier

struct TintedBadgeModifier: ViewModifier {
    let color: Color

    func body(content: Content) -> some View {
        content
            .background(color.opacity(0.15), in: Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(color.opacity(0.30), lineWidth: 0.5)
            )
    }
}

// MARK: - Glass Card (preserved for tab bar / nav chrome)

struct GlassCardModifier: ViewModifier {
    let isInteractive: Bool

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            if isInteractive {
                content
                    .glassEffect(
                        .regular.interactive(),
                        in: .rect(cornerRadius: 16)
                    )
            } else {
                content
                    .glassEffect(
                        .regular,
                        in: .rect(cornerRadius: 16)
                    )
            }
        } else {
            content
                .background(
                    .ultraThinMaterial,
                    in: RoundedRectangle(cornerRadius: 16)
                )
        }
    }
}

// MARK: - View Extensions

extension View {
    /// Warm card with layered shadows — the primary card style
    func warmCard(_ tier: CardTier = .secondary) -> some View {
        modifier(WarmCardModifier(tier: tier))
    }

    /// Tinted semi-transparent badge (replaces glass badges)
    func tintedBadge(color: Color) -> some View {
        modifier(TintedBadgeModifier(color: color))
    }

    /// Glass effect — reserved for tab bar and nav chrome only
    func glassCard(interactive: Bool = false) -> some View {
        modifier(GlassCardModifier(isInteractive: interactive))
    }

    /// Legacy glass badge — now redirects to tinted badge
    func glassBadge(tint: Color? = nil) -> some View {
        modifier(TintedBadgeModifier(color: tint ?? .gray))
    }
}
