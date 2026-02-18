import SwiftUI

struct NotificationSettings: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var state = appState

        Section("Notifications") {
            Toggle("Enable Notifications", isOn: $state.preferences.notificationsEnabled)

            if state.preferences.notificationsEnabled {
                alertTypeToggle("Weather Alerts", type: "weather")
                alertTypeToggle("Flood Warnings", type: "flood")
                alertTypeToggle("Traffic Events", type: "traffic")
            }
        }
    }

    private func alertTypeToggle(_ label: String, type: String) -> some View {
        Toggle(label, isOn: Binding(
            get: { appState.preferences.alertTypes.contains(type) },
            set: { enabled in
                if enabled {
                    appState.preferences.alertTypes.append(type)
                } else {
                    appState.preferences.alertTypes.removeAll { $0 == type }
                }
            }
        ))
    }
}
