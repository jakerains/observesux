import Foundation

struct NewsItem: Decodable, Identifiable, Sendable {
    let id: String
    let title: String
    let link: String
    let description: String?
    let pubDate: Date
    let source: String
    let category: String?
    let isBreaking: Bool?
}
