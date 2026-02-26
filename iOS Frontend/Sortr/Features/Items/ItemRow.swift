import SwiftUI

struct ItemRow: View {
    let item: Item

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Name + favourite star
            HStack(alignment: .firstTextBaseline) {
                Text(item.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .lineLimit(1)
                Spacer()
                if item.isFavorite {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundStyle(.yellow)
                }
            }

            // Category pill + location breadcrumb
            HStack(spacing: 6) {
                if let category = item.category {
                    Text(category)
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.tint.opacity(0.12), in: Capsule())
                        .foregroundStyle(.tint)
                }

                if let loc = item.displayLocation {
                    HStack(spacing: 2) {
                        Image(systemName: "mappin")
                        Text(locationLabel(loc: loc))
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
            }

            // Tags (first 3, with overflow count)
            if let tags = item.tags, !tags.isEmpty {
                HStack(spacing: 4) {
                    ForEach(tags.prefix(3), id: \.self) { tag in
                        Text("#\(tag)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if tags.count > 3 {
                        Text("+\(tags.count - 3)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Expiration indicator
            expirationBadge
        }
        .padding(.vertical, 2)
    }

    private func locationLabel(loc: Item.ItemLocation) -> String {
        if let box = item.box {
            return "\(loc.name) › \(box.name)"
        }
        return loc.name
    }

    @ViewBuilder
    private var expirationBadge: some View {
        switch item.expirationStatus {
        case .expired:
            Label("Expired", systemImage: "exclamationmark.circle.fill")
                .font(.caption)
                .foregroundStyle(.red)
        case .expiringSoon:
            if let exp = item.expirationDate {
                Label(
                    "Expires \(exp.formatted(.relative(presentation: .named)))",
                    systemImage: "clock.fill"
                )
                .font(.caption)
                .foregroundStyle(.orange)
            }
        case .none, .ok:
            EmptyView()
        }
    }
}
