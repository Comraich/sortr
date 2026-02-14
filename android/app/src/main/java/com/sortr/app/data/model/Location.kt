package com.sortr.app.data.model

data class Location(
    val id: Int,
    val name: String,
    val description: String?,
    val boxCount: Int = 0,
    val itemCount: Int = 0
)
