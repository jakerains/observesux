import Foundation

// Minimal Codable models for widget extensions
// These are simplified versions of the main app's models

struct WidgetApiResponse<T: Decodable>: Decodable {
    let data: T?
    let timestamp: Date
    let source: String
}

struct WidgetWeather: Decodable {
    let temperature: Double?
    let conditions: String
    let icon: String?
    let humidity: Double?
    let windSpeed: Double?
    let windDirection: String?
}

struct WidgetAQI: Decodable {
    let aqi: Int
    let category: String
    let primaryPollutant: String
}

struct WidgetRiver: Decodable {
    let siteName: String
    let gaugeHeight: Double?
    let floodStage: String
}

struct WidgetCamera: Decodable {
    let id: String
    let name: String
    let snapshotUrl: String?
}
