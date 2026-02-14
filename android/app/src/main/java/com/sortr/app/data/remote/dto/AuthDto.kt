package com.sortr.app.data.remote.dto

import com.google.gson.annotations.SerializedName
import com.sortr.app.data.model.AuthResult
import com.sortr.app.data.model.User

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val password: String
)

data class GoogleMobileAuthRequest(
    @SerializedName("idToken")
    val idToken: String
)

data class AuthResponse(
    val token: String,
    val user: UserDto?
)

data class UserDto(
    val id: Int,
    val username: String
)

fun AuthResponse.toAuthResult(): AuthResult {
    return AuthResult(
        token = token,
        user = user?.toUser()
    )
}

fun UserDto.toUser(): User {
    return User(
        id = id,
        username = username
    )
}
