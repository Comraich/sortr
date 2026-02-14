package com.sortr.app.ui.item

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Box
import com.sortr.app.data.model.Item
import com.sortr.app.data.model.Location
import com.sortr.app.data.repository.BoxRepository
import com.sortr.app.data.repository.ItemRepository
import com.sortr.app.data.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ItemFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val name: String = "",
    val category: String = "",
    val selectedLocationId: Int? = null,
    val selectedBoxId: Int? = null,
    val locations: List<Location> = emptyList(),
    val boxes: List<Box> = emptyList(),
    val filteredBoxes: List<Box> = emptyList(),
    val error: String? = null,
    val isSaved: Boolean = false,
    val isEditMode: Boolean = false
)

@HiltViewModel
class ItemFormViewModel @Inject constructor(
    private val itemRepository: ItemRepository,
    private val locationRepository: LocationRepository,
    private val boxRepository: BoxRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ItemFormUiState())
    val uiState: StateFlow<ItemFormUiState> = _uiState.asStateFlow()

    fun initialize(itemId: Int?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Load locations and boxes
            val locationsResult = locationRepository.getLocations()
            val boxesResult = boxRepository.getBoxes()

            locationsResult.fold(
                onSuccess = { locations ->
                    val boxes = boxesResult.getOrNull() ?: emptyList()
                    _uiState.value = _uiState.value.copy(
                        locations = locations,
                        boxes = boxes
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = e.message ?: "Failed to load data"
                    )
                }
            )

            // Load item if editing
            if (itemId != null) {
                itemRepository.getItem(itemId).fold(
                    onSuccess = { item ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isEditMode = true,
                            name = item.name,
                            category = item.category ?: "",
                            selectedLocationId = item.locationId,
                            selectedBoxId = item.boxId,
                            filteredBoxes = _uiState.value.boxes.filter { it.locationId == item.locationId }
                        )
                    },
                    onFailure = { e ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load item"
                        )
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun onNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(name = name, error = null)
    }

    fun onCategoryChanged(category: String) {
        _uiState.value = _uiState.value.copy(category = category)
    }

    fun onLocationSelected(locationId: Int?) {
        val filteredBoxes = if (locationId != null) {
            _uiState.value.boxes.filter { it.locationId == locationId }
        } else {
            emptyList()
        }
        _uiState.value = _uiState.value.copy(
            selectedLocationId = locationId,
            selectedBoxId = null, // Reset box selection when location changes
            filteredBoxes = filteredBoxes
        )
    }

    fun onBoxSelected(boxId: Int?) {
        _uiState.value = _uiState.value.copy(selectedBoxId = boxId)
    }

    fun save(itemId: Int?) {
        val state = _uiState.value

        if (state.name.isBlank()) {
            _uiState.value = state.copy(error = "Name is required")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)

            val selectedBox = state.boxes.find { it.id == state.selectedBoxId }
            val selectedLocation = state.locations.find { it.id == state.selectedLocationId }

            val item = Item(
                id = itemId ?: 0,
                name = state.name.trim(),
                category = state.category.trim().ifBlank { null },
                location = selectedLocation?.name,
                boxNumber = selectedBox?.boxNumber,
                boxId = state.selectedBoxId,
                locationId = state.selectedLocationId
            )

            val result = if (itemId != null) {
                itemRepository.updateItem(itemId, item)
            } else {
                itemRepository.createItem(item)
            }

            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        isSaved = true
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = e.message ?: "Failed to save item"
                    )
                }
            )
        }
    }
}
