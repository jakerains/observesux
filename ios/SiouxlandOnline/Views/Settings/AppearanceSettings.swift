import SwiftUI

struct AppearanceSettings: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var state = appState

        Section("Appearance") {
            Picker("Theme", selection: $state.preferences.theme) {
                ForEach(AppTheme.allCases, id: \.self) { theme in
                    Text(theme.label).tag(theme)
                }
            }
        }
    }
}
