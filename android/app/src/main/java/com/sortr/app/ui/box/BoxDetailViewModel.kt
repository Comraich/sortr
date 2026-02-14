package com.sortr.app.ui.box

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Box
import com.sortr.app.data.model.Item
import com.sortr.app.data.repository.BoxRepository
import com.sortr.app.data.repository.ItemRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BoxDetailUiState(
    val isLoading: Boolean = true,
    val box: Box? = null,
    val items: List<Item> = emptyList(),
    val error: String? = null,
    val isDeleted: Boolean = false
)

@HiltViewModel
class BoxDetailViewModel @Inject constructor(
    private val boxRepository: BoxRepository,
    private val itemRepository: ItemRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BoxDetailUiState())
    val uiState: StateFlow<BoxDetailUiState> = _uiState.asStateFlow()

    fun loadBox(boxId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            boxRepository.getBox(boxId).fold(
                onSuccess = { box ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        box = box
                    )
                    loadItems(boxId)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load box"
                    )
                }
            )
        }
    }

    private fun loadItems(boxId: Int) {
        viewModelScope.launch {
            itemRepository.getItems().fold(
                onSuccess = { allItems ->
                    val boxItems = allItems.filter { it.boxId == boxId }
                    _uiState.value = _uiState.value.copy(items = boxItems)
                },
                onFailure = { /* Ignore item loading errors */ }
            )
        }
    }

    fun deleteBox(boxId: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            boxRepository.deleteBox(boxId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isDeleted = true
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to delete box"
                    )
                }
            )
        }
    }
}
