import SwiftUI

struct ContentView: View {
    @Environment(AuthSession.self) private var authSession

    var body: some View {
        if authSession.isAuthenticated {
            Text("Logged in as \(authSession.currentUser?.displayNameOrUsername ?? "")")
        } else {
            LoginView()
        }
    }
}
