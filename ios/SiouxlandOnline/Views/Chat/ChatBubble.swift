import SwiftUI

struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if message.role == .assistant {
                assistantAvatar
            }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 8) {
                // Message text
                if !message.content.isEmpty {
                    Text(message.content)
                        .font(.slChat)
                        .padding(12)
                        .background(bubbleBackground)
                        .clipShape(.rect(cornerRadius: 16))
                }

                // Tool output cards
                ForEach(message.toolCalls, id: \.id) { toolCall in
                    ToolOutputView(toolCall: toolCall)
                }

                // Streaming indicator
                if message.isStreaming && message.content.isEmpty {
                    ThinkingIndicator()
                }
            }

            if message.role == .user {
                Spacer(minLength: 40)
            }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
    }

    private var assistantAvatar: some View {
        Text("SUX")
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 28, height: 28)
            .background(.slWarmAmber, in: Circle())
    }

    private var bubbleBackground: Color {
        message.role == .user ? Color.slWarmAmber.opacity(0.2) : Color.gray.opacity(0.1)
    }
}
