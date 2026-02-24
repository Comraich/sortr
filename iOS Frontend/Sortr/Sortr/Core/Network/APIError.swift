import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case forbidden(String)
    case notFound
    case serverError(String)
    case decodingError(Error)
    case networkUnavailable
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Session expired. Please log in again."
        case .forbidden(let msg):
            return msg
        case .notFound:
            return "Resource not found."
        case .serverError(let msg):
            return msg
        case .decodingError(let error):
            #if DEBUG
            return "Unexpected server response: \(error.localizedDescription)"
            #else
            return "Unexpected server response."
            #endif
        case .networkUnavailable:
            return "No internet connection."
        case .unknown(let e):
            return e.localizedDescription
        }
    }
}

// Server error response shape: { "error": "message" }
struct APIErrorResponse: Decodable {
    let error: String
}
