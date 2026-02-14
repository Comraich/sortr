package com.sortr.app.data.remote.dto

import com.google.gson.annotations.SerializedName
import com.sortr.app.data.model.Item

data class ItemDto(
    val id: Int,
    val name: String,
    val category: String?,
    val location: String?,
    @SerializedName("boxNumber")
    val boxNumber: String?,
    @SerializedName("BoxId")
    val boxId: Int?,
    @SerializedName("LocationId")
    val locationId: Int?
)

data class CreateItemRequest(
    val name: String,
    val category: String?,
    val location: String?,
    @SerializedName("boxNumber")
    val boxNumber: String?,
    @SerializedName("BoxId")
    val boxId: Int?,
    @SerializedName("LocationId")
    val locationId: Int?
)

data class UpdateItemRequest(
    val name: String,
    val category: String?,
    val location: String?,
    @SerializedName("boxNumber")
    val boxNumber: String?,
    @SerializedName("BoxId")
    val boxId: Int?,
    @SerializedName("LocationId")
    val locationId: Int?
)

fun ItemDto.toItem(): Item {
    return Item(
        id = id,
        name = name,
        category = category,
        location = location,
        boxNumber = boxNumber,
        boxId = boxId,
        locationId = locationId
    )
}

fun Item.toCreateRequest(): CreateItemRequest {
    return CreateItemRequest(
        name = name,
        category = category,
        location = location,
        boxNumber = boxNumber,
        boxId = boxId,
        locationId = locationId
    )
}

fun Item.toUpdateRequest(): UpdateItemRequest {
    return UpdateItemRequest(
        name = name,
        category = category,
        location = location,
        boxNumber = boxNumber,
        boxId = boxId,
        locationId = locationId
    )
}
