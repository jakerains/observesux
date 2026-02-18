import SwiftUI

// MARK: - Warm Pill Modifier (for toggle chips, layer selectors)

extension View {
    func glassPill(isSelected: Bool = false) -> some View {
        modifier(WarmPillModifier(isSelected: isSelected))
    }
}

private struct WarmPillModifier: ViewModifier {
    let isSelected: Bool

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                isSelected ? Color("SlPrimary").opacity(0.15) : Color("SlBorder").opacity(0.3),
                in: Capsule()
            )
            .overlay(
                Capsule()
                    .strokeBorder(
                        isSelected ? Color("SlPrimary").opacity(0.4) : Color("SlBorder").opacity(0.5),
                        lineWidth: 0.5
                    )
            )
    }
}
