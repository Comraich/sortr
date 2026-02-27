import SwiftUI

struct CategoriesView: View {
    @State private var categories: [Category] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var sheetItem: SheetItem?

    private enum SheetItem: Identifiable {
        case add
        case rename(Category)
        var id: String {
            switch self {
            case .add:             return "add"
            case .rename(let c):  return "rename-\(c.id)"
            }
        }
    }

    var body: some View {
        content
            .navigationTitle("Categories")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { sheetItem = .add } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .task { await load() }
            .refreshable { await load() }
            .sheet(item: $sheetItem) { item in
                CategoryFormSheet(item: item) { await load() }
            }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if categories.isEmpty {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView(
                    "No Categories",
                    systemImage: "tag",
                    description: Text("Tap + to add a category.")
                )
            }
        } else {
            List {
                ForEach(categories) { category in
                    HStack {
                        Label(category.name, systemImage: "tag.fill")
                        Spacer()
                        if let count = category.itemCount {
                            Text("\(count)")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .swipeActions(edge: .leading) {
                        Button { sheetItem = .rename(category) } label: {
                            Label("Rename", systemImage: "pencil")
                        }
                        .tint(.blue)
                    }
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            Task { await delete(category) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
            .listStyle(.plain)
        }
    }

    private func load() async {
        if categories.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            categories = try await APIClient.shared.request(.categories)
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    private func delete(_ category: Category) async {
        categories.removeAll { $0.id == category.id }
        do {
            let _: MessageResponse = try await APIClient.shared.request(.deleteCategory(id: category.id))
        } catch {
            await load()
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
    }
}

// MARK: - Add / Rename sheet

private struct CategoryFormSheet: View {
    let item: CategoriesView.SheetItem
    let onSave: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @FocusState private var fieldFocused: Bool

    private var isRename: Bool {
        if case .rename = item { return true }
        return false
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                        .focused($fieldFocused)
                        .autocorrectionDisabled()
                        .submitLabel(.done)
                        .onSubmit { Task { await save() } }
                }
                if let error = errorMessage {
                    Section {
                        Label(error, systemImage: "exclamationmark.circle")
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(isRename ? "Rename Category" : "New Category")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Save") { Task { await save() } }
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                            .fontWeight(.semibold)
                    }
                }
            }
            .onAppear {
                if case .rename(let cat) = item { name = cat.name }
                fieldFocused = true
            }
        }
    }

    private func save() async {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        isSaving = true
        errorMessage = nil
        do {
            struct NameBody: Encodable { let name: String }
            switch item {
            case .add:
                let _: Category = try await APIClient.shared.request(.createCategory, body: NameBody(name: trimmed))
            case .rename(let cat):
                let _: Category = try await APIClient.shared.request(.updateCategory(id: cat.id), body: NameBody(name: trimmed))
            }
            await onSave()
            dismiss()
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isSaving = false
    }
}

private struct MessageResponse: Decodable { let message: String }

#Preview {
    NavigationStack { CategoriesView() }
}
