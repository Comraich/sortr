package com.sortr.app.data.remote.dto

import com.sortr.app.data.model.Location

data class LocationDto(
    val id: Int,
    val name: String,
    val description: String?,
    val boxCount: Int?,
    val itemCount: Int?
)

data class CreateLocationRequest(
    val name: String,
    val description: String?
)

data class UpdateLocationRequest(
    val name: String,
    val description: String?
)

fun LocationDto.toLocation(): Location {
    return Location(
        id = id,
        name = name,
        description = description,
        boxCount = boxCount ?: 0,
        itemCount = itemCount ?: 0
    )
}

fun Location.toCreateRequest(): CreateLocationRequest {
    return CreateLocationRequest(
        name = name,
        description = description
    )
}

fun Location.toUpdateRequest(): UpdateLocationRequest {
    return UpdateLocationRequest(
        name = name,
        description = description
    )
}
