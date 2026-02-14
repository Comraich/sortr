package com.sortr.app.data.repository

import com.sortr.app.data.model.Box
import com.sortr.app.data.remote.api.SortrApi
import com.sortr.app.data.remote.dto.toBox
import com.sortr.app.data.remote.dto.toCreateRequest
import com.sortr.app.data.remote.dto.toUpdateRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BoxRepository @Inject constructor(
    private val api: SortrApi
) {

    suspend fun getBoxes(): Result<List<Box>> {
        return try {
            val response = api.getBoxes()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toBox() })
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch boxes"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBoxesByLocation(locationId: Int): Result<List<Box>> {
        return try {
            val response = api.getBoxesByLocation(locationId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toBox() })
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch boxes"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBox(id: Int): Result<Box> {
        return try {
            val response = api.getBox(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toBox())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch box"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createBox(box: Box): Result<Box> {
        return try {
            val response = api.createBox(box.toCreateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toBox())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to create box"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateBox(id: Int, box: Box): Result<Box> {
        return try {
            val response = api.updateBox(id, box.toUpdateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toBox())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to update box"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteBox(id: Int): Result<Unit> {
        return try {
            val response = api.deleteBox(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to delete box"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
