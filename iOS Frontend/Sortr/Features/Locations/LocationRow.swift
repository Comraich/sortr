import SwiftUI

struct LocationRow: View {
    let location: Location

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: location.children.isEmpty ? "mappin" : "mappin.and.ellipse")
                .font(.body)
                .foregroundStyle(.tint)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(location.name)
                    .font(.body)
                    .fontWeight(.medium)

                if !location.children.isEmpty {
                    Text("\(location.children.count) sub-location\(location.children.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}
