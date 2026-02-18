import Foundation

// MARK: - Traffic Cameras

struct TrafficCamera: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let description: String?
    let latitude: Double
    let longitude: Double
    let direction: String?
    let roadway: String?
    let streamUrl: String?
    let snapshotUrl: String?
    let isActive: Bool
    let lastUpdated: Date
}

struct CameraSource: Decodable, Sendable {
    let provider: String
    let cameras: [TrafficCamera]
}

// MARK: - 511 Traffic Events

enum TrafficEventType: String, Decodable, Sendable {
    case incident
    case construction
    case roadCondition = "road_condition"
    case closure
}

enum TrafficSeverity: String, Decodable, Sendable {
    case minor, moderate, major, critical
}

struct TrafficEvent: Decodable, Identifiable, Sendable {
    let id: String
    let type: TrafficEventType
    let severity: TrafficSeverity
    let headline: String
    let description: String
    let roadway: String
    let direction: String?
    let latitude: Double
    let longitude: Double
    let startTime: Date
    let endTime: Date?
    let lastUpdated: Date
    let url: String?
}
