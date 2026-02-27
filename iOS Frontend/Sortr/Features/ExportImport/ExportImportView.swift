import SwiftUI
import UniformTypeIdentifiers

struct ExportImportView: View {
    @Environment(AuthSession.self) private var authSession

    // Export state
    @State private var isExportingCSV  = false
    @State private var isExportingJSON = false
    @State private var exportFileURL: URL?

    // Import state
    @State private var showingFilePicker = false
    @State private var isPreviewingCSV  = false
    @State private var preview: ImportPreviewResponse?
    @State private var isImporting = false
    @State private var importSuccess: String?
    @State private var pendingCSVData: Data?

    @State private var errorMessage: String?

    var body: some View {
        Form {
            exportSection
            importSection
        }
        .navigationTitle("Export / Import")
        // Share sheet for downloaded files
        .sheet(item: $exportFileURL) { url in
            ShareSheet(url: url)
                .presentationDetents([.medium, .large])
        }
        // CSV file picker
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [.commaSeparatedText, .text],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                Task { await previewCSV(url: url) }
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
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

    // MARK: - Export section

    private var exportSection: some View {
        Section {
            // CSV export
            Button {
                Task { await exportCSV() }
            } label: {
                HStack {
                    Label("Export Items as CSV", systemImage: "tablecells")
                    Spacer()
                    if isExportingCSV { ProgressView() }
                }
            }
            .disabled(isExportingCSV || isExportingJSON)

            // JSON backup (admin only)
            if authSession.isAdmin {
                Button {
                    Task { await exportJSON() }
                } label: {
                    HStack {
                        Label("Export Full Backup (JSON)", systemImage: "cylinder.split.1x2")
                        Spacer()
                        if isExportingJSON { ProgressView() }
                    }
                }
                .disabled(isExportingCSV || isExportingJSON)
            }
        } header: {
            Text("Export")
        } footer: {
            Text("CSV exports all items. JSON backup includes items, boxes, locations, and categories.")
        }
    }

    // MARK: - Import section

    @ViewBuilder
    private var importSection: some View {
        Section("Import") {
            Button {
                preview = nil
                pendingCSVData = nil
                importSuccess = nil
                showingFilePicker = true
            } label: {
                Label("Import from CSV…", systemImage: "square.and.arrow.down")
            }
            .disabled(isPreviewingCSV || isImporting)
        }

        // Preview results
        if let p = preview {
            Section {
                LabeledContent("Total rows",   value: "\(p.totalRows)")
                LabeledContent("Valid rows",   value: "\(p.validRows)")
                if p.errorCount > 0 {
                    LabeledContent("Errors", value: "\(p.errorCount)")
                        .foregroundStyle(.red)
                }
            } header: {
                Text("Preview")
            }

            if !p.errors.isEmpty {
                Section("Validation Errors") {
                    ForEach(p.errors) { err in
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Row \(err.row) — \(err.field)")
                                .font(.caption.bold())
                            Text(err.message)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }

            if p.validRows > 0 {
                Section {
                    Button {
                        Task { await confirmImport() }
                    } label: {
                        HStack {
                            Label(
                                "Import \(p.validRows) item\(p.validRows == 1 ? "" : "s")",
                                systemImage: "checkmark.circle.fill"
                            )
                            .foregroundStyle(.green)
                            Spacer()
                            if isImporting { ProgressView() }
                        }
                    }
                    .disabled(isImporting)
                }
            }
        }

        // Success banner
        if let msg = importSuccess {
            Section {
                Label(msg, systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            }
        }
    }

    // MARK: - Export actions

    private func exportCSV() async {
        isExportingCSV = true
        errorMessage = nil
        do {
            struct Filters: Encodable { let filters: [String: String] }
            let data = try await APIClient.shared.requestData(.exportCSV, body: Filters(filters: [:]))
            exportFileURL = try writeTempFile(data, name: "sortr-items.csv")
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription ?? error.localizedDescription
        }
        isExportingCSV = false
    }

    private func exportJSON() async {
        isExportingJSON = true
        errorMessage = nil
        do {
            let data = try await APIClient.shared.requestData(.exportJSON)
            exportFileURL = try writeTempFile(data, name: "sortr-backup.json")
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription ?? error.localizedDescription
        }
        isExportingJSON = false
    }

    private func writeTempFile(_ data: Data, name: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(name)
        try data.write(to: url)
        return url
    }

    // MARK: - Import actions

    private func previewCSV(url: URL) async {
        isPreviewingCSV = true
        errorMessage = nil
        preview = nil
        importSuccess = nil
        do {
            guard url.startAccessingSecurityScopedResource() else {
                throw APIError.serverError("Could not access the selected file")
            }
            defer { url.stopAccessingSecurityScopedResource() }
            let data = try Data(contentsOf: url)
            pendingCSVData = data
            preview = try await APIClient.shared.uploadCSV(csvData: data, preview: true)
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription ?? error.localizedDescription
        }
        isPreviewingCSV = false
    }

    private func confirmImport() async {
        guard let data = pendingCSVData else { return }
        isImporting = true
        errorMessage = nil
        do {
            let result = try await APIClient.shared.uploadCSV(csvData: data, preview: false)
            let count = result.imported ?? result.validRows
            importSuccess = "Successfully imported \(count) item\(count == 1 ? "" : "s")."
            preview = nil
            pendingCSVData = nil
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription ?? error.localizedDescription
        }
        isImporting = false
    }
}

// MARK: - Share sheet

private struct ShareSheet: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}

// MARK: - URL as sheet item

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}

#Preview {
    NavigationStack { ExportImportView() }
        .environment(AuthSession())
}
