import Foundation

/// Simple in-memory cache with TTL and prefix-based invalidation.
/// Used for rarely-changing resources (locations, categories) to avoid
/// redundant API calls within a short window.
final class CacheStore {
    static let shared = CacheStore()

    private struct Entry {
        let value: Any
        let expiry: Date
    }

    private var cache: [String: Entry] = [:]
    private let ttl: TimeInterval
    private let lock = NSLock()

    init(ttl: TimeInterval = 60) {
        self.ttl = ttl
    }

    func get<T>(_ key: String) -> T? {
        lock.lock()
        defer { lock.unlock() }
        guard let entry = cache[key], entry.expiry > .now else { return nil }
        return entry.value as? T
    }

    func set<T>(_ key: String, value: T) {
        lock.lock()
        defer { lock.unlock() }
        cache[key] = Entry(value: value, expiry: Date().addingTimeInterval(ttl))
    }

    /// Invalidate all cache entries whose key starts with `prefix`.
    /// E.g. `invalidate(prefix: "locations")` clears location-related entries.
    func invalidate(prefix: String) {
        lock.lock()
        defer { lock.unlock() }
        cache.keys
            .filter { $0.hasPrefix(prefix) }
            .forEach { cache.removeValue(forKey: $0) }
    }

    func invalidateAll() {
        lock.lock()
        defer { lock.unlock() }
        cache.removeAll()
    }
}
