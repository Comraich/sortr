package com.sortr.app.ui.item

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sortr.app.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItemFormScreen(
    itemId: Int?,
    onNavigateBack: () -> Unit,
    onSaveSuccess: () -> Unit,
    viewModel: ItemFormViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(itemId) {
        viewModel.initialize(itemId)
    }

    LaunchedEffect(uiState.isSaved) {
        if (uiState.isSaved) {
            onSaveSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (uiState.isEditMode) "Edit Item" else "Add Item") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    IconButton(
                        onClick = { viewModel.save(itemId) },
                        enabled = !uiState.isSaving
                    ) {
                        Icon(Icons.Default.Save, contentDescription = "Save")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            LoadingScreen()
        } else {
            ItemFormContent(
                uiState = uiState,
                onNameChanged = viewModel::onNameChanged,
                onCategoryChanged = viewModel::onCategoryChanged,
                onLocationSelected = viewModel::onLocationSelected,
                onBoxSelected = viewModel::onBoxSelected,
                onSave = { viewModel.save(itemId) },
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ItemFormContent(
    uiState: ItemFormUiState,
    onNameChanged: (String) -> Unit,
    onCategoryChanged: (String) -> Unit,
    onLocationSelected: (Int?) -> Unit,
    onBoxSelected: (Int?) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier
) {
    var locationExpanded by remember { mutableStateOf(false) }
    var boxExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Name field
        OutlinedTextField(
            value = uiState.name,
            onValueChange = onNameChanged,
            label = { Text("Name *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            isError = uiState.error?.contains("Name") == true
        )

        // Category field
        OutlinedTextField(
            value = uiState.category,
            onValueChange = onCategoryChanged,
            label = { Text("Category") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        // Location dropdown
        ExposedDropdownMenuBox(
            expanded = locationExpanded,
            onExpandedChange = { locationExpanded = it }
        ) {
            OutlinedTextField(
                value = uiState.locations.find { it.id == uiState.selectedLocationId }?.name ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Location") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = locationExpanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = locationExpanded,
                onDismissRequest = { locationExpanded = false }
            ) {
                DropdownMenuItem(
                    text = { Text("None") },
                    onClick = {
                        onLocationSelected(null)
                        locationExpanded = false
                    }
                )
                uiState.locations.forEach { location ->
                    DropdownMenuItem(
                        text = { Text(location.name) },
                        onClick = {
                            onLocationSelected(location.id)
                            locationExpanded = false
                        }
                    )
                }
            }
        }

        // Box dropdown (filtered by location)
        ExposedDropdownMenuBox(
            expanded = boxExpanded,
            onExpandedChange = { boxExpanded = it }
        ) {
            OutlinedTextField(
                value = uiState.boxes.find { it.id == uiState.selectedBoxId }?.boxNumber ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Box") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = boxExpanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                enabled = uiState.selectedLocationId != null
            )
            ExposedDropdownMenu(
                expanded = boxExpanded,
                onDismissRequest = { boxExpanded = false }
            ) {
                DropdownMenuItem(
                    text = { Text("None") },
                    onClick = {
                        onBoxSelected(null)
                        boxExpanded = false
                    }
                )
                uiState.filteredBoxes.forEach { box ->
                    DropdownMenuItem(
                        text = { Text(box.boxNumber) },
                        onClick = {
                            onBoxSelected(box.id)
                            boxExpanded = false
                        }
                    )
                }
            }
        }

        // Error message
        uiState.error?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Save button
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isSaving
        ) {
            if (uiState.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(if (uiState.isEditMode) "Update Item" else "Add Item")
            }
        }
    }
}
