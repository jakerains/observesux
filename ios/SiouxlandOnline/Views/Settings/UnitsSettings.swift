import SwiftUI

struct UnitsSettings: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var state = appState

        Section("Units") {
            Picker("Temperature", selection: $state.preferences.temperatureUnit) {
                Text("°F").tag(TemperatureUnit.fahrenheit)
                Text("°C").tag(TemperatureUnit.celsius)
            }

            Picker("Distance", selection: $state.preferences.distanceUnit) {
                Text("Miles").tag(DistanceUnit.miles)
                Text("Kilometers").tag(DistanceUnit.kilometers)
            }
        }
    }
}
