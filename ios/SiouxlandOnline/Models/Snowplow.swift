import Foundation

enum PlowActivity: String, Decodable, Sendable {
    case plowing, salting, both, deadheading, parked
}

struct Snowplow: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let latitude: Double
    let longitude: Double
    let heading: Double
    let speed: Double
    let activity: PlowActivity
    let timestamp: Date
}
