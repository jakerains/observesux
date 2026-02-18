import Foundation
import SwiftUI

// MARK: - Air Quality

enum AQICategory: String, Decodable, Sendable {
    case good = "Good"
    case moderate = "Moderate"
    case unhealthySensitive = "Unhealthy for Sensitive Groups"
    case unhealthy = "Unhealthy"
    case veryUnhealthy = "Very Unhealthy"
    case hazardous = "Hazardous"

    var color: Color {
        switch self {
        case .good: .green
        case .moderate: .yellow
        case .unhealthySensitive: .orange
        case .unhealthy: .red
        case .veryUnhealthy: Color(red: 0.56, green: 0.25, blue: 0.59)
        case .hazardous: Color(red: 0.49, green: 0, blue: 0.14)
        }
    }
}

struct AirQualityReading: Decodable, Sendable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
    let aqi: Int
    let category: AQICategory
    let primaryPollutant: String
    let pm25: Double?
    let pm10: Double?
    let ozone: Double?
    let source: String
    let sensorId: String?

    static func categoryFromValue(_ aqi: Int) -> AQICategory {
        switch aqi {
        case ...50: .good
        case 51...100: .moderate
        case 101...150: .unhealthySensitive
        case 151...200: .unhealthy
        case 201...300: .veryUnhealthy
        default: .hazardous
        }
    }
}
