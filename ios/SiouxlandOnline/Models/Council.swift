import Foundation

struct CouncilMeeting: Decodable, Identifiable, Sendable {
    let id: String
    let title: String
    let videoId: String
    let publishedAt: Date
    let status: String
    let recap: String?
    let transcript: String?
    let thumbnailUrl: String?
    let duration: Int?
}

struct CouncilMeetingChunk: Decodable, Identifiable, Sendable {
    let id: String
    let meetingId: String
    let chunkIndex: Int
    let text: String
    let startTime: Double?
    let endTime: Double?
}

struct CouncilSearchResult: Decodable, Sendable {
    let chunk: CouncilMeetingChunk
    let meeting: CouncilMeeting
    let similarity: Double
}
