import Foundation

// MARK: - River/Flood Monitoring

enum FloodStage: String, Decodable, Sendable {
    case normal, action, minor, moderate, major
}

struct RiverGaugeReading: Decodable, Identifiable, Sendable {
    let siteId: String
    let siteName: String
    let latitude: Double
    let longitude: Double
    let gaugeHeight: Double?
    let discharge: Double?
    let waterTemp: Double?
    let floodStage: FloodStage
    let actionStage: Double?
    let floodStageLevel: Double?
    let moderateFloodStage: Double?
    let majorFloodStage: Double?
    let timestamp: Date
    let trend: String?

    var id: String { siteId }
}

struct FloodForecastPoint: Decodable, Sendable {
    let time: Date
    let stage: Double
    let floodCategory: FloodStage
}

struct FloodForecast: Decodable, Sendable {
    let siteId: String
    let siteName: String
    let forecastIssued: Date
    let forecasts: [FloodForecastPoint]
}
