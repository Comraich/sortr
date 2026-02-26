import SwiftUI

struct ItemsView: View {
    @State private var viewModel = ItemsViewModel()

    // Combined key so both search and filter changes fire a single debounced reload
    private struct LoadKey: Hashable {
        var search: String
        var favoritesOnly: Bool
    }

    var body: some View {
        content
            .navigationTitle("Items")
            .searchable(text: $viewModel.searchText, prompt: "Search items")
            .toolbar { toolbar }
            .task(id: LoadKey(search: viewModel.searchText, favoritesOnly: viewModel.showFavoritesOnly)) {
                // Skip debounce on the initial load (list is still empty)
                if !viewModel.items.isEmpty {
                    try? await Task.sleep(for: .milliseconds(350))
                    guard !Task.isCancelled else { return }
                }
                await viewModel.load()
            }
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

    // MARK: - Content states

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if viewModel.items.isEmpty {
            emptyState
        } else {
            list
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if !viewModel.searchText.isEmpty || viewModel.showFavoritesOnly {
            ContentUnavailableView.search(text: viewModel.searchText)
        } else {
            ContentUnavailableView(
                "No Items",
                systemImage: "tray",
                description: Text("Tap + to add your first item.")
            )
        }
    }

    private var list: some View {
        List {
            ForEach(viewModel.items) { item in
                NavigationLink(destination: ItemDetailView(item: item)) {
                    ItemRow(item: item)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        Task { await viewModel.delete(item) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button("Add Item", systemImage: "plus") {
                // TODO: present AddItemView
            }
        }
        ToolbarItem(placement: .topBarLeading) {
            Button {
                viewModel.showFavoritesOnly.toggle()
            } label: {
                Image(systemName: viewModel.showFavoritesOnly ? "star.fill" : "star")
                    .foregroundStyle(viewModel.showFavoritesOnly ? .yellow : .secondary)
            }
            .accessibilityLabel(viewModel.showFavoritesOnly ? "Show all items" : "Show favourites only")
        }
    }
}

#Preview {
    NavigationStack { ItemsView() }
}
