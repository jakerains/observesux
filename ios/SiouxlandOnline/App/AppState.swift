import SwiftUI

// MARK: - Global App State
// Owns cross-cutting concerns: auth status, selected tab, preferences

@Observable
@MainActor
final class AppState {
    // Auth
    var isAuthenticated = false
    var currentUser: UserProfile?

    // Navigation
    var selectedTab: AppTab = .home

    // Preferences (persisted to UserDefaults)
    var preferences: UserPreferences {
        didSet { savePreferences() }
    }

    // Global error banner
    var globalError: String?

    init() {
        // Load saved preferences
        if let data = UserDefaults.standard.data(forKey: "userPreferences"),
           let prefs = try? JSONDecoder().decode(UserPreferences.self, from: data) {
            self.preferences = prefs
        } else {
            self.preferences = .default
        }

        // Check for existing auth token
        if KeychainManager.read(.authToken) != nil {
            isAuthenticated = true
        }
    }

    private func savePreferences() {
        if let data = try? JSONEncoder().encode(preferences) {
            UserDefaults.standard.set(data, forKey: "userPreferences")
        }
    }

    func signOut() {
        KeychainManager.deleteAll()
        isAuthenticated = false
        currentUser = nil
    }
}

// MARK: - Tab Enum

enum AppTab: String, CaseIterable {
    case home, map, chat, cameras, more
}
