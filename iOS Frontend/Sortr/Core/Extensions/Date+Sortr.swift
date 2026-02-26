import Foundation

extension Date {
    private static let apiFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f
    }()

    /// Format as `YYYY-MM-DD` for use in API query parameters and expiration date fields.
    var apiDateString: String {
        Self.apiFormatter.string(from: self)
    }

    /// Human-readable relative description (e.g. "2 days ago", "in 3 days")
    var relativeDescription: String {
        Self.relativeFormatter.localizedString(for: self, relativeTo: .now)
    }

    /// Whether this date is in the past (before start of today)
    var isPast: Bool {
        self < Calendar.current.startOfDay(for: .now)
    }

    /// Number of calendar days until this date (negative if in the past)
    var daysFromNow: Int {
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: .now), to: cal.startOfDay(for: self)).day ?? 0
    }
}

extension String {
    private static let sortrDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        return f
    }()

    /// Parse a `YYYY-MM-DD` date string to a `Date` using the current timezone.
    var sortrDate: Date? {
        Self.sortrDateFormatter.date(from: self)
    }
}
