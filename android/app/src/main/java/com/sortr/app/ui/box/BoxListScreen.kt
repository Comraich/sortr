package com.sortr.app.ui.box

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
import com.sortr.app.data.model.Box
import com.sortr.app.ui.components.DeleteConfirmationDialog
import com.sortr.app.ui.components.EmptyState
import com.sortr.app.ui.components.ErrorScreen
import com.sortr.app.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoxListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToBox: (Int) -> Unit,
    onNavigateToAddBox: () -> Unit,
    viewModel: BoxListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var boxToDelete by remember { mutableStateOf<Box?>(null) }

    boxToDelete?.let { box ->
        DeleteConfirmationDialog(
            title = "Delete Box",
            message = "Are you sure you want to delete '${box.boxNumber}'? All items in this box will also be deleted.",
            onConfirm = {
                viewModel.deleteBox(box.id)
                boxToDelete = null
            },
            onDismiss = { boxToDelete = null }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Boxes") },
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
                onClick = onNavigateToAddBox,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Box")
            }
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen()
            uiState.error != null -> ErrorScreen(
                message = uiState.error!!,
                onRetry = { viewModel.loadBoxes() }
            )
            uiState.boxes.isEmpty() -> Box(modifier = Modifier.padding(padding)) {
                EmptyState(
                    message = "No boxes yet. Tap + to add one.",
                    icon = Icons.Default.Inbox
                )
            }
            else -> BoxList(
                boxes = uiState.boxes,
                onBoxClick = onNavigateToBox,
                onDeleteClick = { boxToDelete = it },
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
private fun BoxList(
    boxes: List<Box>,
    onBoxClick: (Int) -> Unit,
    onDeleteClick: (Box) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(boxes, key = { it.id }) { box ->
            BoxListCard(
                box = box,
                onClick = { onBoxClick(box.id) },
                onDeleteClick = { onDeleteClick(box) }
            )
        }
    }
}

@Composable
private fun BoxListCard(
    box: Box,
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
                imageVector = Icons.Default.Inbox,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = box.boxNumber,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                box.locationName?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                box.description?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "${box.itemCount} items",
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
