import SwiftUI

struct AboutView: View {
    var body: some View {
        Section("About") {
            LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
            LabeledContent("Build", value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")

            Link(destination: URL(string: "https://siouxland.online")!) {
                Label("siouxland.online", systemImage: "globe")
            }

            Link(destination: URL(string: "https://github.com/jakerains/siouxlandonline")!) {
                Label("GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
            }

            Text("Built with SwiftUI for iOS 26+")
                .font(.slCompact)
                .foregroundStyle(.secondary)

            Text("Powered by SUX AI")
                .font(.slCompact)
                .foregroundStyle(.slWarmAmber)
        }
    }
}
