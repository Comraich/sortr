package com.sortr.app.data.model

data class User(
    val id: Int,
    val username: String
)

data class AuthResult(
    val token: String,
    val user: User?
)
