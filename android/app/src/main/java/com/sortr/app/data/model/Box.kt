package com.sortr.app.data.model

data class Box(
    val id: Int,
    val boxNumber: String,
    val description: String?,
    val locationId: Int,
    val locationName: String? = null,
    val itemCount: Int = 0
)
