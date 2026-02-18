import Foundation

struct Earthquake: Decodable, Identifiable, Sendable {
    let id: String
    let magnitude: Double
    let location: String
    let latitude: Double
    let longitude: Double
    let depth: Double
    let time: Date
    let url: String
    let felt: Int?
    let tsunami: Bool
}
