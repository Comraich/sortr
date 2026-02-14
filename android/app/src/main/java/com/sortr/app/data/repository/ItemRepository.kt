package com.sortr.app.data.repository

import com.sortr.app.data.model.Item
import com.sortr.app.data.remote.api.SortrApi
import com.sortr.app.data.remote.dto.toCreateRequest
import com.sortr.app.data.remote.dto.toItem
import com.sortr.app.data.remote.dto.toUpdateRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ItemRepository @Inject constructor(
    private val api: SortrApi
) {

    suspend fun getItems(): Result<List<Item>> {
        return try {
            val response = api.getItems()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toItem() })
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch items"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getItem(id: Int): Result<Item> {
        return try {
            val response = api.getItem(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toItem())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch item"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createItem(item: Item): Result<Item> {
        return try {
            val response = api.createItem(item.toCreateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toItem())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to create item"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateItem(id: Int, item: Item): Result<Item> {
        return try {
            val response = api.updateItem(id, item.toUpdateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toItem())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to update item"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteItem(id: Int): Result<Unit> {
        return try {
            val response = api.deleteItem(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to delete item"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
