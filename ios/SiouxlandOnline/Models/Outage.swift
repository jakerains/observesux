import Foundation

enum OutageStatus: String, Decodable, Sendable {
    case active
    case crewAssigned = "crew_assigned"
    case assessing
    case restored
}

struct PowerOutage: Decodable, Identifiable, Sendable {
    let id: String
    let provider: String
    let area: String
    let customersAffected: Int
    let cause: String?
    let startTime: Date
    let estimatedRestoration: Date?
    let latitude: Double?
    let longitude: Double?
    let status: OutageStatus
}

struct OutageSummary: Decodable, Sendable {
    let provider: String
    let totalOutages: Int
    let totalCustomersAffected: Int
    let lastUpdated: Date
}
