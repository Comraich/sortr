package com.sortr.app.data.remote.api

import com.sortr.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface SortrApi {

    // Auth endpoints
    @POST("api/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/google-mobile")
    suspend fun googleMobileAuth(@Body request: GoogleMobileAuthRequest): Response<AuthResponse>

    // Item endpoints
    @GET("api/items")
    suspend fun getItems(): Response<List<ItemDto>>

    @GET("api/items/{id}")
    suspend fun getItem(@Path("id") id: Int): Response<ItemDto>

    @POST("api/items")
    suspend fun createItem(@Body request: CreateItemRequest): Response<ItemDto>

    @PUT("api/items/{id}")
    suspend fun updateItem(@Path("id") id: Int, @Body request: UpdateItemRequest): Response<ItemDto>

    @DELETE("api/items/{id}")
    suspend fun deleteItem(@Path("id") id: Int): Response<Unit>

    // Location endpoints
    @GET("api/locations")
    suspend fun getLocations(): Response<List<LocationDto>>

    @GET("api/locations/{id}")
    suspend fun getLocation(@Path("id") id: Int): Response<LocationDto>

    @POST("api/locations")
    suspend fun createLocation(@Body request: CreateLocationRequest): Response<LocationDto>

    @PUT("api/locations/{id}")
    suspend fun updateLocation(@Path("id") id: Int, @Body request: UpdateLocationRequest): Response<LocationDto>

    @DELETE("api/locations/{id}")
    suspend fun deleteLocation(@Path("id") id: Int): Response<Unit>

    // Box endpoints
    @GET("api/boxes")
    suspend fun getBoxes(): Response<List<BoxDto>>

    @GET("api/boxes")
    suspend fun getBoxesByLocation(@Query("locationId") locationId: Int): Response<List<BoxDto>>

    @GET("api/boxes/{id}")
    suspend fun getBox(@Path("id") id: Int): Response<BoxDto>

    @POST("api/boxes")
    suspend fun createBox(@Body request: CreateBoxRequest): Response<BoxDto>

    @PUT("api/boxes/{id}")
    suspend fun updateBox(@Path("id") id: Int, @Body request: UpdateBoxRequest): Response<BoxDto>

    @DELETE("api/boxes/{id}")
    suspend fun deleteBox(@Path("id") id: Int): Response<Unit>
}
