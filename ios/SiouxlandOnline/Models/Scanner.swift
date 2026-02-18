import Foundation

enum ScannerFeedType: String, Decodable, Sendable {
    case police, fire, ems, aviation, combined
}

struct ScannerFeed: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let description: String
    let type: ScannerFeedType
    let provider: String
    let feedId: String
    let isLive: Bool
    let listeners: Int?
}
