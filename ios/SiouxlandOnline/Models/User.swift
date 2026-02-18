import Foundation

struct UserProfile: Decodable, Sendable {
    let id: String
    let name: String?
    let email: String?
    let image: String?
    let createdAt: Date?
}

struct UserPreferences: Codable, Sendable {
    var temperatureUnit: TemperatureUnit
    var distanceUnit: DistanceUnit
    var theme: AppTheme
    var notificationsEnabled: Bool
    var alertTypes: [String]

    static let `default` = UserPreferences(
        temperatureUnit: .fahrenheit,
        distanceUnit: .miles,
        theme: .system,
        notificationsEnabled: true,
        alertTypes: ["weather", "flood", "traffic"]
    )
}

enum TemperatureUnit: String, Codable, Sendable, CaseIterable {
    case fahrenheit = "F"
    case celsius = "C"
}

enum DistanceUnit: String, Codable, Sendable, CaseIterable {
    case miles, kilometers
}

enum AppTheme: String, Codable, Sendable, CaseIterable {
    case system, light, dark

    var label: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }
}
