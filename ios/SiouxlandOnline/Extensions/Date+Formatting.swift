import Foundation

extension Date {
    /// "5 min ago", "2 hr ago", "3 days ago"
    var relativeShort: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: .now)
    }

    /// "5 minutes ago", "2 hours ago"
    var relativeFull: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: .now)
    }

    /// "3:45 PM"
    var timeString: String {
        formatted(date: .omitted, time: .shortened)
    }

    /// "Feb 18"
    var shortDate: String {
        formatted(.dateTime.month(.abbreviated).day())
    }

    /// "Feb 18, 2026"
    var mediumDate: String {
        formatted(date: .abbreviated, time: .omitted)
    }

    /// "February 18, 2026 at 3:45 PM"
    var fullDateTime: String {
        formatted(date: .long, time: .shortened)
    }

    /// "Tuesday"
    var dayOfWeek: String {
        formatted(.dateTime.weekday(.wide))
    }

    /// "Tue"
    var shortDayOfWeek: String {
        formatted(.dateTime.weekday(.abbreviated))
    }
}
