package com.sortr.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Location
import com.sortr.app.data.repository.AuthRepository
import com.sortr.app.data.repository.BoxRepository
import com.sortr.app.data.repository.ItemRepository
import com.sortr.app.data.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = true,
    val locations: List<Location> = emptyList(),
    val totalItems: Int = 0,
    val totalBoxes: Int = 0,
    val totalLocations: Int = 0,
    val username: String? = null,
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val locationRepository: LocationRepository,
    private val itemRepository: ItemRepository,
    private val boxRepository: BoxRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
        observeUsername()
    }

    private fun observeUsername() {
        viewModelScope.launch {
            authRepository.username.collect { username ->
                _uiState.value = _uiState.value.copy(username = username)
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            // Load all data in parallel
            val locationsResult = locationRepository.getLocations()
            val itemsResult = itemRepository.getItems()
            val boxesResult = boxRepository.getBoxes()

            locationsResult.fold(
                onSuccess = { locations ->
                    val items = itemsResult.getOrNull() ?: emptyList()
                    val boxes = boxesResult.getOrNull() ?: emptyList()

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        locations = locations,
                        totalLocations = locations.size,
                        totalItems = items.size,
                        totalBoxes = boxes.size
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load data"
                    )
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
