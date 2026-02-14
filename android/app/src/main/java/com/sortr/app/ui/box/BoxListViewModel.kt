package com.sortr.app.ui.box

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Box
import com.sortr.app.data.repository.BoxRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BoxListUiState(
    val isLoading: Boolean = true,
    val boxes: List<Box> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class BoxListViewModel @Inject constructor(
    private val boxRepository: BoxRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BoxListUiState())
    val uiState: StateFlow<BoxListUiState> = _uiState.asStateFlow()

    init {
        loadBoxes()
    }

    fun loadBoxes() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            boxRepository.getBoxes().fold(
                onSuccess = { boxes ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        boxes = boxes
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load boxes"
                    )
                }
            )
        }
    }

    fun deleteBox(boxId: Int) {
        viewModelScope.launch {
            boxRepository.deleteBox(boxId).fold(
                onSuccess = { loadBoxes() },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = e.message ?: "Failed to delete box"
                    )
                }
            )
        }
    }
}
