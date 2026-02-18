import SwiftUI

// MARK: - Root TabView

struct ContentView: View {
    @State private var appState = AppState()

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            Tab("Weather", systemImage: "cloud.sun.fill", value: .home) {
                HomeTab()
            }

            Tab("Map", systemImage: "map.fill", value: .map) {
                MapTab()
            }

            Tab("SUX", systemImage: "bubble.left.and.text.bubble.right.fill", value: .chat) {
                ChatTab()
            }

            Tab("Cameras", systemImage: "video.fill", value: .cameras) {
                CamerasTab()
            }

            Tab("More", systemImage: "ellipsis.circle.fill", value: .more) {
                MoreTab()
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tint(Color("SlPrimary"))
        .environment(appState)
    }
}

#Preview {
    ContentView()
}
