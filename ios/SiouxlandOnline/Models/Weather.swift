import Foundation

// MARK: - Weather Observation

struct WeatherObservation: Decodable, Sendable {
    let stationId: String
    let stationName: String
    let timestamp: Date
    let temperature: Double?
    let temperatureUnit: String
    let humidity: Double?
    let windSpeed: Double?
    let windDirection: String?
    let windGust: Double?
    let pressure: Double?
    let visibility: Double?
    let conditions: String
    let icon: String?
    let dewpoint: Double?
    let heatIndex: Double?
    let windChill: Double?
}

// MARK: - Weather Alerts

enum AlertSeverity: String, Decodable, Sendable {
    case minor = "Minor"
    case moderate = "Moderate"
    case severe = "Severe"
    case extreme = "Extreme"
}

enum AlertUrgency: String, Decodable, Sendable {
    case immediate = "Immediate"
    case expected = "Expected"
    case future = "Future"
    case past = "Past"
    case unknown = "Unknown"
}

enum AlertCertainty: String, Decodable, Sendable {
    case observed = "Observed"
    case likely = "Likely"
    case possible = "Possible"
    case unlikely = "Unlikely"
    case unknown = "Unknown"
}

struct WeatherAlert: Decodable, Identifiable, Sendable {
    let id: String
    let event: String
    let severity: AlertSeverity
    let urgency: AlertUrgency
    let certainty: AlertCertainty
    let headline: String
    let description: String
    let instruction: String?
    let areaDesc: String
    let effective: Date
    let expires: Date
    let onset: Date?
    let sender: String
}

// MARK: - Forecast

struct ForecastPeriod: Decodable, Identifiable, Sendable {
    let number: Int
    let name: String
    let startTime: Date
    let endTime: Date
    let temperature: Int
    let temperatureUnit: String
    let temperatureTrend: String?
    let probabilityOfPrecipitation: Int?
    let windSpeed: String
    let windDirection: String
    let shortForecast: String
    let detailedForecast: String
    let icon: String
    let isDaytime: Bool

    var id: Int { number }
}

struct HourlyForecast: Decodable, Sendable {
    let startTime: Date
    let endTime: Date
    let temperature: Int
    let temperatureUnit: String
    let probabilityOfPrecipitation: Int?
    let humidity: Int?
    let windSpeed: String
    let windDirection: String
    let shortForecast: String
    let icon: String
    let isDaytime: Bool
}

struct WeatherForecast: Decodable, Sendable {
    let periods: [ForecastPeriod]
    let generatedAt: Date
    let updateTime: Date
}

struct HourlyWeatherForecast: Decodable, Sendable {
    let periods: [HourlyForecast]
    let generatedAt: Date
    let updateTime: Date
}

// MARK: - Storm Reports

enum StormReportType: String, Decodable, Sendable {
    case tornado, hail, wind, flood, other
}

struct StormReport: Decodable, Sendable {
    let type: StormReportType
    let magnitude: String?
    let location: String
    let county: String
    let state: String
    let latitude: Double
    let longitude: Double
    let reportedAt: Date
    let source: String
    let remarks: String?
}
