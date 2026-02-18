import SwiftUI

// MARK: - Chat Tab
// SUX AI chat interface with SSE streaming

struct ChatTab: View {
    @State private var viewModel = ChatViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            // Welcome message
                            if viewModel.messages.isEmpty {
                                welcomeHeader
                            }

                            // Suggested questions
                            if !viewModel.suggestedQuestions.isEmpty {
                                SuggestedQuestions(
                                    questions: viewModel.suggestedQuestions,
                                    onTap: { viewModel.send($0) }
                                )
                            }

                            // Chat messages
                            ForEach(viewModel.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        if let lastId = viewModel.messages.last?.id {
                            withAnimation {
                                proxy.scrollTo(lastId, anchor: .bottom)
                            }
                        }
                    }
                }

                Divider()

                // Input bar
                inputBar
            }
            .navigationTitle("SUX Chat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if !viewModel.messages.isEmpty {
                        Button("Clear", systemImage: "trash") {
                            viewModel.clearChat()
                        }
                    }
                }
            }
        }
    }

    // MARK: - Welcome Header

    private var welcomeHeader: some View {
        VStack(spacing: 12) {
            Text("SUX")
                .font(.slHero)
                .foregroundStyle(.slWarmAmber)

            Text("Your Siouxland AI Assistant")
                .font(.slBody)
                .foregroundStyle(.secondary)

            Text("Ask me about weather, traffic, events, gas prices, or anything about Sioux City.")
                .font(.slCompact)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 8) {
            TextField("Ask SUX anything...", text: $viewModel.inputText, axis: .vertical)
                .textFieldStyle(.plain)
                .lineLimit(1...5)
                .padding(10)
                .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 20))

            if viewModel.isStreaming {
                Button {
                    viewModel.cancel()
                } label: {
                    Image(systemName: "stop.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.red)
                }
            } else {
                Button {
                    viewModel.send()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.slWarmAmber)
                }
                .disabled(viewModel.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .glassCard()
    }
}

#Preview {
    ChatTab()
}
