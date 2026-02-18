import Foundation
import SwiftUI

// MARK: - Aviation Weather (METAR/TAF)

enum FlightCategory: String, Decodable, Sendable {
    case vfr = "VFR"
    case mvfr = "MVFR"
    case ifr = "IFR"
    case lifr = "LIFR"

    var color: Color {
        switch self {
        case .vfr: .green
        case .mvfr: .blue
        case .ifr: .red
        case .lifr: Color(red: 1, green: 0, blue: 1)
        }
    }

    var description: String {
        switch self {
        case .vfr: "Visual Flight Rules - Good conditions"
        case .mvfr: "Marginal VFR - Reduced visibility/ceiling"
        case .ifr: "Instrument Flight Rules - Low ceiling/visibility"
        case .lifr: "Low IFR - Very low ceiling/visibility"
        }
    }
}

struct CloudLayer: Decodable, Sendable {
    let coverage: String // SKC, CLR, FEW, SCT, BKN, OVC, VV
    let base: Int?
    let type: String?
}

struct METAR: Decodable, Sendable {
    let icaoId: String
    let stationName: String
    let observationTime: Date
    let rawOb: String
    let temperature: Double?
    let dewpoint: Double?
    let windDirection: Int?
    let windSpeed: Int?
    let windGust: Int?
    let visibility: Double?
    let altimeter: Double?
    let ceiling: Int?
    let cloudLayers: [CloudLayer]
    let weatherPhenomena: [String]
    let flightCategory: FlightCategory
    let verticalVisibility: Int?
    let remarks: String
}

struct TAFForecastPeriod: Decodable, Sendable {
    let type: String // FM, TEMPO, BECMG, PROB, BASE
    let probability: Int?
    let timeFrom: Date
    let timeTo: Date
    let windDirection: Int?
    let windSpeed: Int?
    let windGust: Int?
    let visibility: Double?
    let cloudLayers: [CloudLayer]
    let weatherPhenomena: [String]
    let flightCategory: FlightCategory
}

struct TAF: Decodable, Sendable {
    let icaoId: String
    let stationName: String
    let issueTime: Date
    let validTimeFrom: Date
    let validTimeTo: Date
    let rawTaf: String
    let forecasts: [TAFForecastPeriod]
    let remarks: String?
}

struct NOTAM: Decodable, Identifiable, Sendable {
    let id: String
    let icaoId: String
    let notamNumber: String
    let type: String
    let classification: String
    let effectiveStart: Date
    let effectiveEnd: Date?
    let text: String
    let location: String?
    let affectedFIR: String?
    let category: String?
    let schedule: String?
    let isActive: Bool
}

struct AviationWeather: Decodable, Sendable {
    let metar: METAR?
    let taf: TAF?
    let notams: [NOTAM]
    let lastUpdated: Date
}

// MARK: - Aircraft (OpenSky Network)

enum SuxAssociation: String, Decodable, Sendable {
    case arriving, departing, nearby
}

struct Aircraft: Decodable, Identifiable, Sendable {
    let icao24: String
    let callsign: String?
    let registration: String?
    let aircraftType: String?
    let latitude: Double
    let longitude: Double
    let altitude: Double?
    let velocity: Double?
    let heading: Double?
    let verticalRate: Double?
    let onGround: Bool
    let squawk: String?
    let positionSource: Int?
    let suxAssociation: SuxAssociation?

    var id: String { icao24 }
}

struct AircraftData: Decodable, Sendable {
    let aircraft: [Aircraft]
    let timestamp: Date
    let source: String
    let suxArrivals: Int
    let suxDepartures: Int
    let nearSux: Int
}

// MARK: - Flights (SUX Airport)

enum FlightStatus: String, Decodable, Sendable {
    case scheduled, boarding, departed
    case inAir = "in_air"
    case landed, arrived, delayed, cancelled
}

enum FlightDirection: String, Decodable, Sendable {
    case arrival, departure
}

struct Flight: Decodable, Identifiable, Sendable {
    let flightNumber: String
    let airline: String
    let origin: String?
    let destination: String?
    let originCity: String?
    let destinationCity: String?
    let scheduledTime: Date
    let estimatedTime: Date?
    let actualTime: Date?
    let status: FlightStatus
    let gate: String?
    let terminal: String?
    let aircraft: String?
    let type: FlightDirection

    var id: String { flightNumber }
}

// MARK: - SUX Airport Constants

enum SUXAirport {
    static let icao = "KSUX"
    static let name = "Sioux Gateway Airport"
    static let latitude = 42.4036
    static let longitude = -96.3844
    static let elevation = 1098 // feet MSL
}
