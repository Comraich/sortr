import Foundation
import Observation

@Observable
@MainActor
final class LocationsViewModel {
    var locations: [Location] = []
    var isLoading = false
    var errorMessage: String?

    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    /// Locations that have no parent — shown in the root list.
    var rootLocations: [Location] {
        locations.filter { $0.parentId == nil }
    }

    /// Look up a full Location by id (for drilling into children).
    func location(withId id: Int) -> Location? {
        locations.first { $0.id == id }
    }

    func load() async {
        if locations.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            locations = try await apiClient.request(.locations)
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }
}
