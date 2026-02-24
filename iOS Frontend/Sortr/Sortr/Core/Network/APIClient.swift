import Foundation

/// Centralised API client.
/// - Auth: injects `Authorization: Bearer {token}` from Keychain for authenticated endpoints.
/// - Base URL: read from UserDefaults at request time, so changing it in Settings takes effect immediately.
/// - Error handling: maps HTTP status codes to typed `APIError` cases; posts `.sessionExpired` on 401.
final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let keychainManager: KeychainManager
    private let networkMonitor: NetworkMonitor

    init(
        session: URLSession = .shared,
        keychainManager: KeychainManager = .shared,
        networkMonitor: NetworkMonitor = NetworkMonitor()
    ) {
        self.session = session
        self.keychainManager = keychainManager
        self.networkMonitor = networkMonitor
    }

    // MARK: - Base URL

    var baseURL: URL {
        let fallback = URL(string: "http://localhost:8000")!
        guard
            let stored = UserDefaults.standard.string(forKey: "serverURL"),
            let url = URL(string: stored),
            let scheme = url.scheme,
            ["http", "https"].contains(scheme)
        else { return fallback }
        return url
    }

    // MARK: - Generic JSON request

    func request<T: Decodable>(_ endpoint: APIEndpoint, body: (any Encodable)? = nil) async throws -> T {
        guard networkMonitor.isConnected else { throw APIError.networkUnavailable }

        let urlRequest = try buildRequest(for: endpoint, body: body)
        let (data, response) = try await performRequest(urlRequest)
        return try decode(T.self, from: data, response: response)
    }

    /// Returns raw Data (for CSV/JSON export downloads)
    func requestData(_ endpoint: APIEndpoint, body: (any Encodable)? = nil) async throws -> Data {
        guard networkMonitor.isConnected else { throw APIError.networkUnavailable }

        let urlRequest = try buildRequest(for: endpoint, body: body)
        let (data, response) = try await performRequest(urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError("Invalid server response")
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            let err = try? JSONDecoder.sortr.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(err?.error ?? "Request failed")
        }
        return data
    }

    /// Multipart image upload — field name is `images`
    func uploadImages(itemId: Int, imagesData: [(data: Data, mimeType: String)]) async throws -> [String] {
        guard networkMonitor.isConnected else { throw APIError.networkUnavailable }

        let boundary = "Boundary-\(UUID().uuidString)"
        let url = baseURL.appending(path: "/api/items/\(itemId)/images")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let token = keychainManager.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        for (index, imageData) in imagesData.enumerated() {
            body.append("--\(boundary)\r\n".utf8Data)
            body.append("Content-Disposition: form-data; name=\"images\"; filename=\"image\(index).jpg\"\r\n".utf8Data)
            body.append("Content-Type: \(imageData.mimeType)\r\n\r\n".utf8Data)
            body.append(imageData.data)
            body.append("\r\n".utf8Data)
        }
        body.append("--\(boundary)--\r\n".utf8Data)
        request.httpBody = body

        let (data, response) = try await performRequest(request)
        let uploadResponse: ImageUploadResponse = try decode(ImageUploadResponse.self, from: data, response: response)
        return uploadResponse.images
    }

    /// Multipart CSV import
    func uploadCSV(csvData: Data, preview: Bool) async throws -> ImportPreviewResponse {
        guard networkMonitor.isConnected else { throw APIError.networkUnavailable }

        let boundary = "Boundary-\(UUID().uuidString)"
        guard var components = URLComponents(url: baseURL.appending(path: "/api/export/csv-import"), resolvingAgainstBaseURL: false) else {
            throw APIError.serverError("Invalid CSV import URL")
        }
        if preview { components.queryItems = [.init(name: "preview", value: "true")] }
        guard let csvImportURL = components.url else {
            throw APIError.serverError("Failed to build CSV import URL")
        }

        var request = URLRequest(url: csvImportURL)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = keychainManager.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        body.append("--\(boundary)\r\n".utf8Data)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"import.csv\"\r\n".utf8Data)
        body.append("Content-Type: text/csv\r\n\r\n".utf8Data)
        body.append(csvData)
        body.append("\r\n--\(boundary)--\r\n".utf8Data)
        request.httpBody = body

        let (data, response) = try await performRequest(request)
        return try decode(ImportPreviewResponse.self, from: data, response: response)
    }

    // MARK: - Private helpers

    private func buildRequest(for endpoint: APIEndpoint, body: (any Encodable)? = nil) throws -> URLRequest {
        guard var components = URLComponents(url: baseURL.appending(path: endpoint.path), resolvingAgainstBaseURL: false) else {
            throw APIError.serverError("Invalid URL for endpoint \(endpoint.path)")
        }

        let queryItems = endpoint.queryItems
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        guard let url = components.url else {
            throw APIError.serverError("Invalid URL for endpoint \(endpoint.path)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if endpoint.requiresAuth, let token = keychainManager.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        return request
    }

    private func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch {
            throw APIError.unknown(error)
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data, response: URLResponse) throws -> T {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError("Invalid server response")
        }

        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try JSONDecoder.sortr.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        case 401:
            NotificationCenter.default.post(name: .sessionExpired, object: nil)
            throw APIError.unauthorized
        case 403:
            let err = try? JSONDecoder.sortr.decode(APIErrorResponse.self, from: data)
            throw APIError.forbidden(err?.error ?? "Forbidden")
        case 404:
            throw APIError.notFound
        default:
            let err = try? JSONDecoder.sortr.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(err?.error ?? "Request failed (\(httpResponse.statusCode))")
        }
    }
}

// MARK: - JSONDecoder configuration

extension JSONDecoder {
    static let sortr: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        // Handle both ISO8601 datetime strings and YYYY-MM-DD date-only strings
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)

            // Try ISO8601 with fractional seconds
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso.date(from: string) { return date }

            // Try ISO8601 without fractional seconds
            iso.formatOptions = [.withInternetDateTime]
            if let date = iso.date(from: string) { return date }

            // Try YYYY-MM-DD (date only)
            let df = DateFormatter()
            df.dateFormat = "yyyy-MM-dd"
            df.timeZone = TimeZone.current
            if let date = df.date(from: string) { return date }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string: \(string)"
            )
        }
        return decoder
    }()
}

// MARK: - Notification names

extension Notification.Name {
    static let sessionExpired = Notification.Name("SortrSessionExpired")
}

// MARK: - String to Data helper

private extension String {
    var utf8Data: Data { Data(utf8) }
}

// MARK: - Response types for upload endpoints

struct ImageUploadResponse: Decodable {
    let message: String
    let images: [String]
}

struct ImportPreviewResponse: Decodable {
    let preview: Bool?
    let totalRows: Int
    let validRows: Int
    let errorCount: Int
    let errors: [ImportRowError]
    let sampleRows: [ImportSampleRow]?
    let success: Bool?
    let imported: Int?
    let message: String?
}

struct ImportRowError: Decodable, Identifiable {
    var id: String { "\(row)-\(field)" }
    let row: Int
    let field: String
    let message: String
}

struct ImportSampleRow: Decodable, Identifiable {
    var id: String { name }
    let name: String
    let category: String?
    let boxId: Int?
    let locationId: Int?
}

