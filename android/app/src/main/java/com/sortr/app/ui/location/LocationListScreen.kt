package com.sortr.app.ui.location

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sortr.app.data.model.Location
import com.sortr.app.ui.components.DeleteConfirmationDialog
import com.sortr.app.ui.components.EmptyState
import com.sortr.app.ui.components.ErrorScreen
import com.sortr.app.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LocationListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToLocation: (Int) -> Unit,
    onNavigateToAddLocation: () -> Unit,
    viewModel: LocationListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var locationToDelete by remember { mutableStateOf<Location?>(null) }

    locationToDelete?.let { location ->
        DeleteConfirmationDialog(
            title = "Delete Location",
            message = "Are you sure you want to delete '${location.name}'? All boxes and items in this location will also be deleted.",
            onConfirm = {
                viewModel.deleteLocation(location.id)
                locationToDelete = null
            },
            onDismiss = { locationToDelete = null }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Locations") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddLocation,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Location")
            }
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen()
            uiState.error != null -> ErrorScreen(
                message = uiState.error!!,
                onRetry = { viewModel.loadLocations() }
            )
            uiState.locations.isEmpty() -> Box(modifier = Modifier.padding(padding)) {
                EmptyState(
                    message = "No locations yet. Tap + to add one.",
                    icon = Icons.Default.Place
                )
            }
            else -> LocationList(
                locations = uiState.locations,
                onLocationClick = onNavigateToLocation,
                onDeleteClick = { locationToDelete = it },
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
private fun LocationList(
    locations: List<Location>,
    onLocationClick: (Int) -> Unit,
    onDeleteClick: (Location) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(locations, key = { it.id }) { location ->
            LocationListCard(
                location = location,
                onClick = { onLocationClick(location.id) },
                onDeleteClick = { onDeleteClick(location) }
            )
        }
    }
}

@Composable
private fun LocationListCard(
    location: Location,
    onClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Place,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = location.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                location.description?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "${location.boxCount} boxes · ${location.itemCount} items",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            IconButton(onClick = onDeleteClick) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
