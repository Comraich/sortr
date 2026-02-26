import Foundation
import Observation

@Observable
@MainActor
final class ItemsViewModel {
    var items: [Item] = []
    var isLoading = false
    var errorMessage: String?
    var searchText = ""
    var showFavoritesOnly = false

    func load() async {
        // Only show the full-screen spinner on the first load
        if items.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            items = try await APIClient.shared.request(
                .items(
                    search: searchText.isEmpty ? nil : searchText,
                    isFavorite: showFavoritesOnly ? true : nil
                )
            )
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    func delete(_ item: Item) async {
        // Optimistic removal
        items.removeAll { $0.id == item.id }
        do {
            let _: EmptyResponse = try await APIClient.shared.request(.deleteItem(id: item.id))
        } catch {
            // Restore item on failure
            items.append(item)
            items.sort { $0.createdAt > $1.createdAt }
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
    }
}
