import SwiftUI

struct SettingsView: View {
    @Environment(AuthSession.self) private var authSession

    /// Persisted server URL. Empty string means "use the default".
    @AppStorage("serverURL") private var savedURL: String = ""

    @State private var editText: String = ""
    @State private var urlError: String?
    @FocusState private var fieldFocused: Bool

    private let defaultURL = "http://localhost:8000"

    var body: some View {
        Form {
            // MARK: Server
            Section {
                TextField(defaultURL, text: $editText)
                    .textContentType(.URL)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .keyboardType(.URL)
                    .focused($fieldFocused)
                    .onSubmit { applyURL() }

                if let urlError {
                    Text(urlError)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                if !savedURL.isEmpty {
                    Button("Reset to Default") {
                        editText = ""
                        UserDefaults.standard.removeObject(forKey: "serverURL")
                        savedURL = ""
                        urlError = nil
                    }
                    .foregroundStyle(.secondary)
                }
            } header: {
                Text("Server")
            } footer: {
                Text("Address of the Sortr backend server. Leave blank to use the default (\(defaultURL)).")
            }

            // MARK: Account
            Section {
                Button("Log Out", role: .destructive) {
                    Task { await authSession.logout() }
                }
            }
        }
        .navigationTitle("Settings")
        .onAppear { editText = savedURL }
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { applyURL() }
                    .disabled(editText == savedURL)
            }
        }
    }

    private func applyURL() {
        let trimmed = editText.trimmingCharacters(in: .whitespacesAndNewlines)

        // Empty → remove saved value, fall back to default
        guard !trimmed.isEmpty else {
            UserDefaults.standard.removeObject(forKey: "serverURL")
            savedURL = ""
            urlError = nil
            fieldFocused = false
            return
        }

        guard
            let url = URL(string: trimmed),
            let scheme = url.scheme,
            ["http", "https"].contains(scheme),
            !(url.host ?? "").isEmpty
        else {
            urlError = "Enter a valid URL starting with http:// or https://"
            return
        }

        savedURL = trimmed
        urlError = nil
        fieldFocused = false
    }
}

#Preview {
    NavigationStack { SettingsView() }
        .environment(AuthSession())
}
