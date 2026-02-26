import SwiftUI

struct BoxDetailView: View {
    let box: Box

    @State private var items: [Item] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        content
            .navigationTitle(box.name)
            .navigationBarTitleDisplayMode(.large)
            .task { await fetchItems() }
            .refreshable { await fetchItems() }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if items.isEmpty {
            ContentUnavailableView(
                "Empty Box",
                systemImage: "shippingbox",
                description: Text("No items in this box yet.")
            )
        } else {
            List {
                if let location = box.location {
                    Section {
                        Label(location.name, systemImage: "mappin")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("\(items.count) item\(items.count == 1 ? "" : "s")") {
                    ForEach(items) { item in
                        NavigationLink(destination: ItemDetailView(item: item)) {
                            ItemRow(item: item)
                        }
                    }
                }
            }
        }
    }

    private func fetchItems() async {
        isLoading = items.isEmpty
        errorMessage = nil
        do {
            items = try await APIClient.shared.request(.items(boxId: box.id))
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }
}
