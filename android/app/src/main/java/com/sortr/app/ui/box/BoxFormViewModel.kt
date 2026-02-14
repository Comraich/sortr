package com.sortr.app.ui.box

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Box
import com.sortr.app.data.model.Location
import com.sortr.app.data.repository.BoxRepository
import com.sortr.app.data.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BoxFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val boxNumber: String = "",
    val description: String = "",
    val selectedLocationId: Int? = null,
    val locations: List<Location> = emptyList(),
    val error: String? = null,
    val isSaved: Boolean = false,
    val isEditMode: Boolean = false
)

@HiltViewModel
class BoxFormViewModel @Inject constructor(
    private val boxRepository: BoxRepository,
    private val locationRepository: LocationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BoxFormUiState())
    val uiState: StateFlow<BoxFormUiState> = _uiState.asStateFlow()

    fun initialize(boxId: Int?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Load locations
            locationRepository.getLocations().fold(
                onSuccess = { locations ->
                    _uiState.value = _uiState.value.copy(locations = locations)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = e.message ?: "Failed to load locations"
                    )
                }
            )

            // Load box if editing
            if (boxId != null) {
                boxRepository.getBox(boxId).fold(
                    onSuccess = { box ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isEditMode = true,
                            boxNumber = box.boxNumber,
                            description = box.description ?: "",
                            selectedLocationId = box.locationId
                        )
                    },
                    onFailure = { e ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load box"
                        )
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun onBoxNumberChanged(boxNumber: String) {
        _uiState.value = _uiState.value.copy(boxNumber = boxNumber, error = null)
    }

    fun onDescriptionChanged(description: String) {
        _uiState.value = _uiState.value.copy(description = description)
    }

    fun onLocationSelected(locationId: Int?) {
        _uiState.value = _uiState.value.copy(selectedLocationId = locationId, error = null)
    }

    fun save(boxId: Int?) {
        val state = _uiState.value

        if (state.boxNumber.isBlank()) {
            _uiState.value = state.copy(error = "Box number is required")
            return
        }

        if (state.selectedLocationId == null) {
            _uiState.value = state.copy(error = "Location is required")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)

            val box = Box(
                id = boxId ?: 0,
                boxNumber = state.boxNumber.trim(),
                description = state.description.trim().ifBlank { null },
                locationId = state.selectedLocationId
            )

            val result = if (boxId != null) {
                boxRepository.updateBox(boxId, box)
            } else {
                boxRepository.createBox(box)
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
                        error = e.message ?: "Failed to save box"
                    )
                }
            )
        }
    }
}
