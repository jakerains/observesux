import SwiftUI

// MARK: - More Tab
// Settings & Account

struct MoreTab: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        NavigationStack {
            Form {
                AccountSection()
                AppearanceSettings()
                UnitsSettings()
                NotificationSettings()
                AboutView()
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    MoreTab()
        .environment(AppState())
}
