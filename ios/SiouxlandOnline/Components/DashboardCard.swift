import SwiftUI

// MARK: - Dashboard Card
// Reusable wrapper for all widget cards with warm background,
// header (icon + title + status + refresh), and expandable content.

struct DashboardCard<Content: View>: View {
    let title: String
    let icon: String
    let status: DataStatus
    let tier: CardTier
    let lastUpdated: Date?
    let onRefresh: (() async -> Void)?
    @ViewBuilder let content: Content

    @State private var isRefreshing = false

    init(
        title: String,
        icon: String,
        status: DataStatus = .loading,
        tier: CardTier = .secondary,
        lastUpdated: Date? = nil,
        onRefresh: (() async -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.icon = icon
        self.status = status
        self.tier = tier
        self.lastUpdated = lastUpdated
        self.onRefresh = onRefresh
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerView

            // Subtle separator
            Rectangle()
                .fill(Color("SlBorder"))
                .frame(height: 0.5)

            content

            // "Updated X ago" footer
            if let lastUpdated {
                Text("Updated \(lastUpdated.relativeShort)")
                    .font(.slCompact)
                    .foregroundStyle(Color("SlMutedForeground"))
            }
        }
        .padding(WarmCardConfig.padding(for: tier))
        .warmCard(tier)
    }

    private var headerView: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.slWidgetTitle)
                .foregroundStyle(.slWarmAmber)

            Text(title)
                .font(.slWidgetTitle)
                .foregroundStyle(Color("SlForeground"))

            Spacer()

            StatusBadge(status: status)

            if let onRefresh {
                RefreshButton(isRefreshing: isRefreshing) {
                    isRefreshing = true
                    await onRefresh()
                    isRefreshing = false
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 16) {
        DashboardCard(
            title: "Weather",
            icon: "cloud.sun.fill",
            status: .live,
            tier: .primary,
            lastUpdated: Date().addingTimeInterval(-120),
            onRefresh: { try? await Task.sleep(for: .seconds(1)) }
        ) {
            Text("72\u{00B0}F — Partly Cloudy")
                .font(.slDataLarge)
        }

        DashboardCard(
            title: "Traffic",
            icon: "car.fill",
            status: .stale,
            tier: .compact
        ) {
            Text("3 active incidents")
                .font(.slBody)
        }
    }
    .padding()
    .background(Color("SlBackground"))
}
