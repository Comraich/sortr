import SwiftUI

struct LocationDetailView: View {
    let location: Location
    /// All locations fetched at the root level — used to resolve child stubs into full objects.
    let allLocations: [Location]

    @State private var boxes: [Box] = []
    @State private var isLoadingBoxes = false

    /// Resolve child stubs into full Location objects for navigation.
    private var childLocations: [Location] {
        location.children.compactMap { ref in
            allLocations.first { $0.id == ref.id }
        }
    }

    var body: some View {
        List {
            // Parent breadcrumb
            if let parent = location.parent {
                Section {
                    Label(parent.name, systemImage: "arrow.turn.left.up")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            // Sub-locations
            if !childLocations.isEmpty {
                Section("Sub-locations") {
                    ForEach(childLocations) { child in
                        NavigationLink(destination: LocationDetailView(location: child, allLocations: allLocations)) {
                            LocationRow(location: child)
                        }
                    }
                }
            }

            // Boxes
            Section("Boxes") {
                if isLoadingBoxes {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                } else if boxes.isEmpty {
                    Text("No boxes in this location")
                        .foregroundStyle(.secondary)
                        .font(.subheadline)
                } else {
                    ForEach(boxes) { box in
                        NavigationLink(destination: BoxDetailView(box: box)) {
                            BoxRow(box: box)
                        }
                    }
                }
            }
        }
        .navigationTitle(location.name)
        .navigationBarTitleDisplayMode(.large)
        .task { await fetchBoxes() }
        .refreshable { await fetchBoxes() }
    }

    private func fetchBoxes() async {
        isLoadingBoxes = true
        boxes = (try? await APIClient.shared.request(.boxes(locationId: location.id))) ?? []
        isLoadingBoxes = false
    }
}
