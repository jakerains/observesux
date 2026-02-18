import SwiftUI

// MARK: - Map Layer Toggle Pills

struct MapLayerToggle: View {
    @Bindable var viewModel: MapViewModel

    var body: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer(spacing: GlassConfig.containerSpacing) {
                scrollContent
            }
        } else {
            scrollContent
        }
    }

    private var scrollContent: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(MapLayer.allCases) { layer in
                    layerButton(layer)
                }
            }
            .padding(.horizontal)
        }
    }

    private func layerButton(_ layer: MapLayer) -> some View {
        let isActive = viewModel.activeLayers.contains(layer)

        return Button {
            HapticManager.selection()
            viewModel.toggleLayer(layer)
        } label: {
            Label(layer.label, systemImage: layer.icon)
                .font(.slCompact)
                .bold()
                .foregroundStyle(isActive ? .primary : .secondary)
                .glassPill(isSelected: isActive)
        }
        .buttonStyle(.plain)
    }
}
