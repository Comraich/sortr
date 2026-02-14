package com.sortr.app.ui.location

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Location
import com.sortr.app.data.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LocationFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val name: String = "",
    val description: String = "",
    val error: String? = null,
    val isSaved: Boolean = false,
    val isEditMode: Boolean = false
)

@HiltViewModel
class LocationFormViewModel @Inject constructor(
    private val locationRepository: LocationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LocationFormUiState())
    val uiState: StateFlow<LocationFormUiState> = _uiState.asStateFlow()

    fun initialize(locationId: Int?) {
        if (locationId != null) {
            viewModelScope.launch {
                _uiState.value = _uiState.value.copy(isLoading = true)

                locationRepository.getLocation(locationId).fold(
                    onSuccess = { location ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isEditMode = true,
                            name = location.name,
                            description = location.description ?: ""
                        )
                    },
                    onFailure = { e ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load location"
                        )
                    }
                )
            }
        }
    }

    fun onNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(name = name, error = null)
    }

    fun onDescriptionChanged(description: String) {
        _uiState.value = _uiState.value.copy(description = description)
    }

    fun save(locationId: Int?) {
        val state = _uiState.value

        if (state.name.isBlank()) {
            _uiState.value = state.copy(error = "Name is required")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)

            val location = Location(
                id = locationId ?: 0,
                name = state.name.trim(),
                description = state.description.trim().ifBlank { null }
            )

            val result = if (locationId != null) {
                locationRepository.updateLocation(locationId, location)
            } else {
                locationRepository.createLocation(location)
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
                        error = e.message ?: "Failed to save location"
                    )
                }
            )
        }
    }
}
