package com.sortr.app.ui.location

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

data class LocationDetailUiState(
    val isLoading: Boolean = true,
    val location: Location? = null,
    val boxes: List<Box> = emptyList(),
    val error: String? = null,
    val isDeleted: Boolean = false
)

@HiltViewModel
class LocationDetailViewModel @Inject constructor(
    private val locationRepository: LocationRepository,
    private val boxRepository: BoxRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LocationDetailUiState())
    val uiState: StateFlow<LocationDetailUiState> = _uiState.asStateFlow()

    fun loadLocation(locationId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            locationRepository.getLocation(locationId).fold(
                onSuccess = { location ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        location = location
                    )
                    loadBoxes(locationId)
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

    private fun loadBoxes(locationId: Int) {
        viewModelScope.launch {
            boxRepository.getBoxesByLocation(locationId).fold(
                onSuccess = { boxes ->
                    _uiState.value = _uiState.value.copy(boxes = boxes)
                },
                onFailure = { /* Ignore box loading errors */ }
            )
        }
    }

    fun deleteLocation(locationId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            locationRepository.deleteLocation(locationId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isDeleted = true
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to delete location"
                    )
                }
            )
        }
    }
}
