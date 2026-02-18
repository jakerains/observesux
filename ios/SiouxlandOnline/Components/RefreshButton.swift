import SwiftUI

struct RefreshButton: View {
    let isRefreshing: Bool
    let action: () async -> Void

    @State private var rotation: Double = 0

    var body: some View {
        Button {
            HapticManager.impact(.light)
            Task { await action() }
        } label: {
            Image(systemName: "arrow.clockwise")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.secondary)
                .rotationEffect(.degrees(rotation))
                .animation(
                    isRefreshing
                        ? .linear(duration: 1).repeatForever(autoreverses: false)
                        : .default,
                    value: rotation
                )
        }
        .buttonStyle(.plain)
        .disabled(isRefreshing)
        .onChange(of: isRefreshing) { _, refreshing in
            rotation = refreshing ? 360 : 0
        }
    }
}
