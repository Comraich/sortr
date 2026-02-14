package com.sortr.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.sortr.app.ui.auth.LoginScreen
import com.sortr.app.ui.box.BoxDetailScreen
import com.sortr.app.ui.box.BoxFormScreen
import com.sortr.app.ui.box.BoxListScreen
import com.sortr.app.ui.home.HomeScreen
import com.sortr.app.ui.item.ItemDetailScreen
import com.sortr.app.ui.item.ItemFormScreen
import com.sortr.app.ui.item.ItemListScreen
import com.sortr.app.ui.location.LocationDetailScreen
import com.sortr.app.ui.location.LocationFormScreen
import com.sortr.app.ui.location.LocationListScreen
import com.sortr.app.ui.scanner.QRScannerScreen
import com.sortr.app.ui.settings.SettingsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Home : Screen("home")
    object Settings : Screen("settings")
    object Scanner : Screen("scanner")

    object ItemList : Screen("items")
    object ItemDetail : Screen("items/{itemId}") {
        fun createRoute(itemId: Int) = "items/$itemId"
    }
    object ItemAdd : Screen("items/add")
    object ItemEdit : Screen("items/{itemId}/edit") {
        fun createRoute(itemId: Int) = "items/$itemId/edit"
    }

    object LocationList : Screen("locations")
    object LocationDetail : Screen("locations/{locationId}") {
        fun createRoute(locationId: Int) = "locations/$locationId"
    }
    object LocationAdd : Screen("locations/add")
    object LocationEdit : Screen("locations/{locationId}/edit") {
        fun createRoute(locationId: Int) = "locations/$locationId/edit"
    }

    object BoxList : Screen("boxes")
    object BoxDetail : Screen("boxes/{boxId}") {
        fun createRoute(boxId: Int) = "boxes/$boxId"
    }
    object BoxAdd : Screen("boxes/add")
    object BoxEdit : Screen("boxes/{boxId}/edit") {
        fun createRoute(boxId: Int) = "boxes/$boxId/edit"
    }
}

@Composable
fun SortrNavHost(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Auth
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // Home
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToLocation = { locationId ->
                    navController.navigate(Screen.LocationDetail.createRoute(locationId))
                },
                onNavigateToItems = {
                    navController.navigate(Screen.ItemList.route)
                },
                onNavigateToScanner = {
                    navController.navigate(Screen.Scanner.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // Settings
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToLocations = { navController.navigate(Screen.LocationList.route) },
                onNavigateToBoxes = { navController.navigate(Screen.BoxList.route) }
            )
        }

        // Scanner
        composable(Screen.Scanner.route) {
            QRScannerScreen(
                onNavigateBack = { navController.popBackStack() },
                onQrCodeScanned = { url ->
                    handleDeepLink(url, navController)
                }
            )
        }

        // Items
        composable(Screen.ItemList.route) {
            ItemListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToItem = { itemId ->
                    navController.navigate(Screen.ItemDetail.createRoute(itemId))
                },
                onNavigateToAddItem = {
                    navController.navigate(Screen.ItemAdd.route)
                }
            )
        }

        composable(
            route = Screen.ItemDetail.route,
            arguments = listOf(navArgument("itemId") { type = NavType.IntType }),
            deepLinks = listOf(
                navDeepLink { uriPattern = "sortr://item/{itemId}" },
                navDeepLink { uriPattern = "https://sortr.app/item/{itemId}" }
            )
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getInt("itemId") ?: return@composable
            ItemDetailScreen(
                itemId = itemId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToEdit = {
                    navController.navigate(Screen.ItemEdit.createRoute(itemId))
                }
            )
        }

        composable(Screen.ItemAdd.route) {
            ItemFormScreen(
                itemId = null,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.ItemEdit.route,
            arguments = listOf(navArgument("itemId") { type = NavType.IntType })
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getInt("itemId") ?: return@composable
            ItemFormScreen(
                itemId = itemId,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }

        // Locations
        composable(Screen.LocationList.route) {
            LocationListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToLocation = { locationId ->
                    navController.navigate(Screen.LocationDetail.createRoute(locationId))
                },
                onNavigateToAddLocation = {
                    navController.navigate(Screen.LocationAdd.route)
                }
            )
        }

        composable(
            route = Screen.LocationDetail.route,
            arguments = listOf(navArgument("locationId") { type = NavType.IntType }),
            deepLinks = listOf(
                navDeepLink { uriPattern = "sortr://location/{locationId}" },
                navDeepLink { uriPattern = "https://sortr.app/location/{locationId}" }
            )
        ) { backStackEntry ->
            val locationId = backStackEntry.arguments?.getInt("locationId") ?: return@composable
            LocationDetailScreen(
                locationId = locationId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToBox = { boxId ->
                    navController.navigate(Screen.BoxDetail.createRoute(boxId))
                },
                onNavigateToEdit = {
                    navController.navigate(Screen.LocationEdit.createRoute(locationId))
                }
            )
        }

        composable(Screen.LocationAdd.route) {
            LocationFormScreen(
                locationId = null,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.LocationEdit.route,
            arguments = listOf(navArgument("locationId") { type = NavType.IntType })
        ) { backStackEntry ->
            val locationId = backStackEntry.arguments?.getInt("locationId") ?: return@composable
            LocationFormScreen(
                locationId = locationId,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }

        // Boxes
        composable(Screen.BoxList.route) {
            BoxListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToBox = { boxId ->
                    navController.navigate(Screen.BoxDetail.createRoute(boxId))
                },
                onNavigateToAddBox = {
                    navController.navigate(Screen.BoxAdd.route)
                }
            )
        }

        composable(
            route = Screen.BoxDetail.route,
            arguments = listOf(navArgument("boxId") { type = NavType.IntType }),
            deepLinks = listOf(
                navDeepLink { uriPattern = "sortr://box/{boxId}" },
                navDeepLink { uriPattern = "https://sortr.app/box/{boxId}" }
            )
        ) { backStackEntry ->
            val boxId = backStackEntry.arguments?.getInt("boxId") ?: return@composable
            BoxDetailScreen(
                boxId = boxId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToItem = { itemId ->
                    navController.navigate(Screen.ItemDetail.createRoute(itemId))
                },
                onNavigateToEdit = {
                    navController.navigate(Screen.BoxEdit.createRoute(boxId))
                }
            )
        }

        composable(Screen.BoxAdd.route) {
            BoxFormScreen(
                boxId = null,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.BoxEdit.route,
            arguments = listOf(navArgument("boxId") { type = NavType.IntType })
        ) { backStackEntry ->
            val boxId = backStackEntry.arguments?.getInt("boxId") ?: return@composable
            BoxFormScreen(
                boxId = boxId,
                onNavigateBack = { navController.popBackStack() },
                onSaveSuccess = { navController.popBackStack() }
            )
        }
    }
}

private fun handleDeepLink(url: String, navController: NavHostController) {
    // Parse the URL and navigate to the appropriate screen
    val uri = android.net.Uri.parse(url)
    val pathSegments = uri.pathSegments

    when {
        pathSegments.size >= 2 && pathSegments[0] == "location" -> {
            pathSegments[1].toIntOrNull()?.let { id ->
                navController.navigate(Screen.LocationDetail.createRoute(id))
            }
        }
        pathSegments.size >= 2 && pathSegments[0] == "box" -> {
            pathSegments[1].toIntOrNull()?.let { id ->
                navController.navigate(Screen.BoxDetail.createRoute(id))
            }
        }
        pathSegments.size >= 2 && pathSegments[0] == "item" -> {
            pathSegments[1].toIntOrNull()?.let { id ->
                navController.navigate(Screen.ItemDetail.createRoute(id))
            }
        }
    }
}
