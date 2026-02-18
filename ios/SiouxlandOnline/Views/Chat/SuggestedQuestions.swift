import SwiftUI

struct SuggestedQuestions: View {
    let questions: [String]
    let onTap: (String) -> Void

    var body: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer(spacing: 8) {
                content
            }
        } else {
            content
        }
    }

    private var content: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(questions, id: \.self) { question in
                    Button {
                        HapticManager.impact(.light)
                        onTap(question)
                    } label: {
                        Text(question)
                            .font(.slCompact)
                            .glassPill()
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
        }
    }
}
