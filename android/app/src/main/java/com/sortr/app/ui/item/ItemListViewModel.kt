package com.sortr.app.ui.item

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sortr.app.data.model.Item
import com.sortr.app.data.repository.ItemRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ItemListUiState(
    val isLoading: Boolean = true,
    val items: List<Item> = emptyList(),
    val searchQuery: String = "",
    val error: String? = null
)

@HiltViewModel
class ItemListViewModel @Inject constructor(
    private val itemRepository: ItemRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ItemListUiState())
    val uiState: StateFlow<ItemListUiState> = _uiState.asStateFlow()

    private var allItems: List<Item> = emptyList()

    init {
        loadItems()
    }

    fun loadItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            itemRepository.getItems().fold(
                onSuccess = { items ->
                    allItems = items
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        items = filterItems(items, _uiState.value.searchQuery)
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load items"
                    )
                }
            )
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            items = filterItems(allItems, query)
        )
    }

    private fun filterItems(items: List<Item>, query: String): List<Item> {
        if (query.isBlank()) return items
        val lowerQuery = query.lowercase()
        return items.filter {
            it.name.lowercase().contains(lowerQuery) ||
            it.category?.lowercase()?.contains(lowerQuery) == true ||
            it.location?.lowercase()?.contains(lowerQuery) == true ||
            it.boxNumber?.lowercase()?.contains(lowerQuery) == true
        }
    }

    fun deleteItem(itemId: Int) {
        viewModelScope.launch {
            itemRepository.deleteItem(itemId).fold(
                onSuccess = { loadItems() },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = e.message ?: "Failed to delete item"
                    )
                }
            )
        }
    }
}
