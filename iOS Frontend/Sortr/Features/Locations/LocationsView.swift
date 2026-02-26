import SwiftUI

struct LocationsView: View {
    @State private var viewModel = LocationsViewModel()

    var body: some View {
        content
            .navigationTitle("Locations")
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if viewModel.rootLocations.isEmpty {
            ContentUnavailableView(
                "No Locations",
                systemImage: "map",
                description: Text("Add a location to start organising your inventory.")
            )
        } else {
            List {
                ForEach(viewModel.rootLocations) { location in
                    NavigationLink(
                        destination: LocationDetailView(
                            location: location,
                            allLocations: viewModel.locations
                        )
                    ) {
                        LocationRow(location: location)
                    }
                }
            }
            .listStyle(.plain)
        }
    }
}

#Preview {
    NavigationStack { LocationsView() }
}
