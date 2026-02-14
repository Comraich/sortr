package com.sortr.app.data.remote.dto

import com.google.gson.annotations.SerializedName
import com.sortr.app.data.model.Box

data class BoxDto(
    val id: Int,
    @SerializedName("boxNumber")
    val boxNumber: String,
    val description: String?,
    @SerializedName("LocationId")
    val locationId: Int,
    val locationName: String?,
    val itemCount: Int?
)

data class CreateBoxRequest(
    @SerializedName("boxNumber")
    val boxNumber: String,
    val description: String?,
    @SerializedName("LocationId")
    val locationId: Int
)

data class UpdateBoxRequest(
    @SerializedName("boxNumber")
    val boxNumber: String,
    val description: String?,
    @SerializedName("LocationId")
    val locationId: Int
)

fun BoxDto.toBox(): Box {
    return Box(
        id = id,
        boxNumber = boxNumber,
        description = description,
        locationId = locationId,
        locationName = locationName,
        itemCount = itemCount ?: 0
    )
}

fun Box.toCreateRequest(): CreateBoxRequest {
    return CreateBoxRequest(
        boxNumber = boxNumber,
        description = description,
        locationId = locationId
    )
}

fun Box.toUpdateRequest(): UpdateBoxRequest {
    return UpdateBoxRequest(
        boxNumber = boxNumber,
        description = description,
        locationId = locationId
    )
}
