import SwiftUI
import AVKit

// MARK: - HLS Video/Audio Player
// Wraps AVPlayer for traffic camera HLS streams and scanner audio

struct HLSPlayerView: View {
    let url: URL
    let isAudio: Bool

    @State private var player: AVPlayer?

    init(url: URL, isAudio: Bool = false) {
        self.url = url
        self.isAudio = isAudio
    }

    var body: some View {
        Group {
            if isAudio {
                audioPlayer
            } else {
                videoPlayer
            }
        }
        .onAppear { setupPlayer() }
        .onDisappear { player?.pause() }
    }

    private var videoPlayer: some View {
        VideoPlayer(player: player)
            .clipShape(.rect(cornerRadius: 12))
    }

    private var audioPlayer: some View {
        HStack(spacing: 12) {
            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(.slWarmAmber)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading) {
                Text("Live Audio")
                    .font(.slWidgetTitle)
                Text("Streaming")
                    .font(.slCompact)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
    }

    private var isPlaying: Bool {
        player?.timeControlStatus == .playing
    }

    private func setupPlayer() {
        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)
        if !isAudio {
            player?.play()
        }
    }

    private func togglePlayback() {
        guard let player else { return }
        if player.timeControlStatus == .playing {
            player.pause()
        } else {
            player.play()
        }
    }
}
