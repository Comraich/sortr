import Foundation
import Observation

@Observable
@MainActor
final class DashboardViewModel {
    var stats: DashboardStats?
    var trends: [TrendPoint] = []
    var isLoading = false
    var errorMessage: String?

    func load() async {
        if stats == nil { isLoading = true }
        errorMessage = nil
        do {
            // Fetch stats and trends in parallel
            async let statsTask: DashboardStats = APIClient.shared.request(.stats)
            async let trendsTask: TrendsResponse = APIClient.shared.request(.statsTrends())
            // Await both — tasks run concurrently since they were declared with async let
            stats = try await statsTask
            trends = try await trendsTask.trends
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }
}
