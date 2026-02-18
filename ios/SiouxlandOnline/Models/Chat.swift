import Foundation

// MARK: - Chat Messages

enum ChatRole: String, Codable, Sendable {
    case user, assistant, system
}

struct ChatMessage: Identifiable, Sendable {
    let id: String
    var role: ChatRole
    var content: String
    var toolCalls: [ToolCall]
    var isStreaming: Bool
    let timestamp: Date

    init(
        id: String = UUID().uuidString,
        role: ChatRole,
        content: String,
        toolCalls: [ToolCall] = [],
        isStreaming: Bool = false,
        timestamp: Date = .now
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.toolCalls = toolCalls
        self.isStreaming = isStreaming
        self.timestamp = timestamp
    }
}

// MARK: - Tool Calls (rendered as rich cards)

struct ToolCall: Identifiable, Sendable {
    let id: String
    let name: String
    var arguments: [String: String]
    var result: ToolResult?
}

struct ToolResult: Sendable {
    let content: String
    let isError: Bool
}

// MARK: - SSE Events from /api/chat

enum ChatSSEEvent: Sendable {
    case textDelta(String)
    case toolCallStart(id: String, name: String)
    case toolResult(id: String, content: String)
    case error(String)
    case finish(String)
}

// MARK: - Chat Request

struct ChatRequest: Encodable {
    let messages: [ChatRequestMessage]
    let sessionId: String?
}

struct ChatRequestMessage: Encodable {
    let role: String
    let content: String
}
