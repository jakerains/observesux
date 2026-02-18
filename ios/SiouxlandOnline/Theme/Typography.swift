import SwiftUI

// MARK: - Typography Styles

extension Font {
    /// Hero temperature display: 96pt ultraLight (matches web's thin hero temp)
    static let slHero: Font = .system(size: 96, weight: .ultraLight, design: .default)

    /// Large data value: 32pt semibold
    static let slDataLarge: Font = .system(size: 32, weight: .semibold, design: .rounded)

    /// Medium data value: 24pt medium
    static let slDataMedium: Font = .system(size: 24, weight: .medium, design: .rounded)

    /// Widget title: 17pt semibold
    static let slWidgetTitle: Font = .system(size: 17, weight: .semibold)

    /// Section header: 12pt semibold, uppercase with tracking
    static let slSectionHeader: Font = .system(size: 12, weight: .semibold)

    /// Card label: 11pt medium, uppercase
    static let slLabel: Font = .system(size: 11, weight: .medium)

    /// Compact data: 11pt regular
    static let slCompact: Font = .system(size: 11, weight: .regular)

    /// Body text for descriptions
    static let slBody: Font = .system(size: 15, weight: .regular)

    /// Chat message text
    static let slChat: Font = .system(size: 16, weight: .regular)
}

// MARK: - Text Style View Modifiers

extension View {
    func slLabelStyle() -> some View {
        self
            .font(.slLabel)
            .textCase(.uppercase)
            .foregroundStyle(.secondary)
            .tracking(0.5)
    }

    func slSectionHeaderStyle() -> some View {
        self
            .font(.slSectionHeader)
            .textCase(.uppercase)
            .tracking(1.0)
            .foregroundStyle(Color("SlMutedForeground"))
    }
}
