package com.sortr.app.data.model

data class Item(
    val id: Int,
    val name: String,
    val category: String?,
    val location: String?,
    val boxNumber: String?,
    val boxId: Int?,
    val locationId: Int?
)
