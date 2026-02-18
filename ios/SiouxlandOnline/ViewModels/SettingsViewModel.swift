import Foundation

@Observable
@MainActor
final class SettingsViewModel {
    var appState: AppState

    init(appState: AppState) {
        self.appState = appState
    }

    var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}
