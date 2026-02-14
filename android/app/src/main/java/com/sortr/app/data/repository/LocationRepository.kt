package com.sortr.app.data.repository

import com.sortr.app.data.model.Location
import com.sortr.app.data.remote.api.SortrApi
import com.sortr.app.data.remote.dto.toCreateRequest
import com.sortr.app.data.remote.dto.toLocation
import com.sortr.app.data.remote.dto.toUpdateRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepository @Inject constructor(
    private val api: SortrApi
) {

    suspend fun getLocations(): Result<List<Location>> {
        return try {
            val response = api.getLocations()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toLocation() })
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch locations"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLocation(id: Int): Result<Location> {
        return try {
            val response = api.getLocation(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toLocation())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to fetch location"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createLocation(location: Location): Result<Location> {
        return try {
            val response = api.createLocation(location.toCreateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toLocation())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to create location"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateLocation(id: Int, location: Location): Result<Location> {
        return try {
            val response = api.updateLocation(id, location.toUpdateRequest())
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toLocation())
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to update location"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteLocation(id: Int): Result<Unit> {
        return try {
            val response = api.deleteLocation(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to delete location"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
