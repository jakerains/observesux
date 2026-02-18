import Foundation

// MARK: - Transit (Sioux City Transit GTFS-RT)

enum OccupancyStatus: String, Decodable, Sendable {
    case empty
    case manySeats = "many_seats"
    case fewSeats = "few_seats"
    case standingOnly = "standing_only"
    case crushed
    case full
    case notAccepting = "not_accepting"
    case unknown

    var label: String {
        switch self {
        case .empty: "Empty"
        case .manySeats: "Seats Available"
        case .fewSeats: "Few Seats"
        case .standingOnly: "Standing Only"
        case .crushed: "Very Crowded"
        case .full: "Full"
        case .notAccepting: "Not Boarding"
        case .unknown: "Unknown"
        }
    }

    var hexColor: String {
        switch self {
        case .empty, .manySeats: "#22c55e"
        case .fewSeats: "#eab308"
        case .standingOnly: "#f97316"
        case .crushed, .full: "#ef4444"
        case .notAccepting, .unknown: "#6b7280"
        }
    }
}

enum ScheduleAdherence: String, Decodable, Sendable {
    case early
    case onTime = "on-time"
    case late
    case unknown
}

struct TransitStop: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let sequence: Int
    let scheduledArrival: String?
    let scheduledDeparture: String?
    let latitude: Double
    let longitude: Double
    let wheelchairBoarding: Bool?
}

struct TripProgress: Decodable, Sendable {
    let currentStop: Int
    let totalStops: Int
}

struct BusPosition: Decodable, Identifiable, Sendable {
    let vehicleId: String
    let routeId: String
    let routeName: String
    let routeColor: String?
    let latitude: Double
    let longitude: Double
    let heading: Double
    let speed: Double
    let timestamp: Date
    let tripId: String?
    let occupancyStatus: OccupancyStatus?
    let occupancyRaw: Int?
    let currentStopSequence: Int?
    let currentStopId: String?
    let currentStopName: String?
    let upcomingStops: [TransitStop]?
    let scheduleAdherence: ScheduleAdherence?
    let scheduledArrival: String?
    let minutesOffSchedule: Int?
    let tripProgress: TripProgress?

    var id: String { vehicleId }
}

struct TransitRoute: Decodable, Identifiable, Sendable {
    let id: String
    let shortName: String
    let longName: String
    let color: String
    let textColor: String
}

struct RouteShape: Decodable, Sendable {
    let routeId: String
    let shapeId: String
    let coordinates: [[Double]]
    let color: String
}

struct TransitData: Decodable, Sendable {
    let buses: [BusPosition]
    let routes: [TransitRoute]
    let activeBusCount: Int
    let activeRoutes: [String]
    let timestamp: Date
    let source: String
    let error: String?
}
