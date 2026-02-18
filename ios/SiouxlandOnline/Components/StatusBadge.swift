import SwiftUI

// MARK: - Live/Stale/Error/Loading Status Badge
// Tinted-pill style matching web's bg-emerald-500/15 + text-emerald-700 pattern

struct StatusBadge: View {
    let status: DataStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)
                .modifier(PulseModifier(shouldPulse: isPulsingStatus))

            Text(status.label)
                .font(.slCompact)
                .fontWeight(.medium)
                .foregroundStyle(statusColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .tintedBadge(color: statusColor)
    }

    private var statusColor: Color {
        switch status {
        case .live: .slLive
        case .stale: .slStale
        case .error: .slError
        case .loading: .slLoading
        }
    }

    private var isPulsingStatus: Bool {
        if case .live = status { return true }
        return false
    }
}

// MARK: - Pulse Animation

private struct PulseModifier: ViewModifier {
    let shouldPulse: Bool
    @State private var isPulsing = false

    func body(content: Content) -> some View {
        content
            .opacity(shouldPulse ? (isPulsing ? 0.4 : 1.0) : 1.0)
            .animation(
                shouldPulse
                    ? .easeInOut(duration: 1.2).repeatForever(autoreverses: true)
                    : .default,
                value: isPulsing
            )
            .onAppear {
                if shouldPulse {
                    isPulsing = true
                }
            }
    }
}

#Preview {
    VStack(spacing: 12) {
        StatusBadge(status: .live)
        StatusBadge(status: .stale)
        StatusBadge(status: .error("Failed"))
        StatusBadge(status: .loading)
    }
    .padding()
    .background(Color("SlBackground"))
}
