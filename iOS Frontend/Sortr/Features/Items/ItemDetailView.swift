import SwiftUI

struct ItemDetailView: View {
    let item: Item
    @State private var isFavorite: Bool
    @State private var isTogglingFavorite = false

    init(item: Item) {
        self.item = item
        _isFavorite = State(initialValue: item.isFavorite)
    }

    var body: some View {
        List {
            // Images
            if let images = item.images, !images.isEmpty {
                imageSection(images)
            }

            // Core details
            Section {
                if let category = item.category {
                    LabeledContent("Category", value: category)
                }
                if let loc = item.displayLocation {
                    LabeledContent("Location", value: locationLabel(loc: loc))
                }
            }

            // Description
            if let description = item.description, !description.isEmpty {
                Section("Description") {
                    Text(description)
                        .font(.body)
                }
            }

            // Tags
            if let tags = item.tags, !tags.isEmpty {
                Section("Tags") {
                    tagCloud(tags)
                }
            }

            // Expiration
            if let exp = item.expirationDate {
                Section("Expiration") {
                    LabeledContent("Date") {
                        Text(exp.formatted(date: .long, time: .omitted))
                    }
                    if item.expirationStatus == .expired {
                        Label("This item has expired", systemImage: "exclamationmark.circle.fill")
                            .foregroundStyle(.red)
                    } else if item.expirationStatus == .expiringSoon {
                        Label(
                            "Expires \(exp.formatted(.relative(presentation: .named)))",
                            systemImage: "clock.fill"
                        )
                        .foregroundStyle(.orange)
                    }
                }
            }

            // Metadata
            Section {
                LabeledContent("Added", value: item.createdAt.formatted(date: .abbreviated, time: .shortened))
                LabeledContent("Updated", value: item.updatedAt.formatted(date: .abbreviated, time: .shortened))
            }
        }
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await toggleFavorite() }
                } label: {
                    Image(systemName: isFavorite ? "star.fill" : "star")
                        .foregroundStyle(isFavorite ? .yellow : .secondary)
                }
                .disabled(isTogglingFavorite)
            }
        }
    }

    // MARK: - Subviews

    @ViewBuilder
    private func imageSection(_ images: [String]) -> some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(images, id: \.self) { filename in
                        AsyncImage(url: APIClient.shared.baseURL.appending(path: "/uploads/\(filename)")) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 180, height: 180)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                            case .failure:
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.fill.tertiary)
                                    .frame(width: 180, height: 180)
                                    .overlay {
                                        Image(systemName: "photo.slash")
                                            .foregroundStyle(.secondary)
                                    }
                            case .empty:
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.fill.tertiary)
                                    .frame(width: 180, height: 180)
                                    .overlay { ProgressView() }
                            @unknown default:
                                EmptyView()
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
    }

    @ViewBuilder
    private func tagCloud(_ tags: [String]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(tags, id: \.self) { tag in
                    Text("#\(tag)")
                        .font(.caption)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(.fill.secondary, in: Capsule())
                }
            }
            .padding(.vertical, 4)
        }
        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
    }

    // MARK: - Helpers

    private func locationLabel(loc: Item.ItemLocation) -> String {
        if let box = item.box {
            return "\(loc.name) › \(box.name)"
        }
        return loc.name
    }

    // MARK: - Actions

    private func toggleFavorite() async {
        isTogglingFavorite = true
        isFavorite.toggle()
        struct FavoriteUpdate: Encodable { let isFavorite: Bool }
        do {
            let _: Item = try await APIClient.shared.request(
                .updateItem(id: item.id),
                body: FavoriteUpdate(isFavorite: isFavorite)
            )
        } catch {
            isFavorite.toggle() // revert on failure
        }
        isTogglingFavorite = false
    }
}

#Preview {
    NavigationStack {
        ItemDetailView(item: .preview)
    }
}

// MARK: - Preview data

private extension Item {
    static let preview = Item(
        id: 1,
        name: "Winter Jacket",
        category: "Clothing",
        description: "A warm winter jacket, size M.",
        images: nil,
        tags: ["winter", "outerwear"],
        isFavorite: true,
        expirationDate: nil,
        locationId: 1,
        boxId: nil,
        createdAt: .now,
        updatedAt: .now,
        location: Item.ItemLocation(id: 1, name: "Wardrobe"),
        box: nil
    )
}
