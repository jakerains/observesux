import Foundation

struct CommunityEvent: Decodable, Identifiable, Sendable {
    let title: String
    let date: String
    let time: String?
    let location: String?
    let description: String?
    let url: String?
    let source: String?

    var id: String { "\(title)-\(date)" }
}

struct CommunityEventsData: Decodable, Sendable {
    let events: [CommunityEvent]
    let rawMarkdown: String?
    let fetchedAt: Date
    let fromCache: Bool?
}

// MARK: - User-Submitted Events

enum EventCategory: String, Decodable, Sendable, CaseIterable {
    case general, music, sports, community, food, arts, family, education, charity

    var label: String {
        switch self {
        case .general: "General"
        case .music: "Music"
        case .sports: "Sports"
        case .community: "Community"
        case .food: "Food & Drink"
        case .arts: "Arts & Culture"
        case .family: "Family"
        case .education: "Education"
        case .charity: "Charity"
        }
    }
}

enum EventSubmissionStatus: String, Decodable, Sendable {
    case pending, approved, rejected
}

struct UserEvent: Decodable, Identifiable, Sendable {
    let id: String
    let title: String
    let date: String
    let startTime: String?
    let endTime: String?
    let location: String?
    let description: String?
    let url: String?
    let category: EventCategory
    let status: EventSubmissionStatus
    let submittedBy: String
    let submittedByEmail: String?
    let adminNotes: String?
    let createdAt: Date
    let updatedAt: Date
}
