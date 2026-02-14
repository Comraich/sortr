package com.sortr.app.data.repository

import com.sortr.app.data.model.AuthResult
import com.sortr.app.data.remote.api.SortrApi
import com.sortr.app.data.remote.dto.GoogleMobileAuthRequest
import com.sortr.app.data.remote.dto.LoginRequest
import com.sortr.app.data.remote.dto.RegisterRequest
import com.sortr.app.data.remote.dto.toAuthResult
import com.sortr.app.util.TokenManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthState {
    object Loading : AuthState()
    object LoggedOut : AuthState()
    data class LoggedIn(val username: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: SortrApi,
    private val tokenManager: TokenManager
) {

    val isLoggedIn: Flow<Boolean> = tokenManager.isLoggedInFlow
    val username: Flow<String?> = tokenManager.usernameFlow

    suspend fun login(username: String, password: String): Result<AuthResult> {
        return try {
            val response = api.login(LoginRequest(username, password))
            if (response.isSuccessful && response.body() != null) {
                val authResult = response.body()!!.toAuthResult()
                tokenManager.saveToken(authResult.token)
                tokenManager.saveUsername(username)
                Result.success(authResult)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Login failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(username: String, password: String): Result<AuthResult> {
        return try {
            val response = api.register(RegisterRequest(username, password))
            if (response.isSuccessful && response.body() != null) {
                val authResult = response.body()!!.toAuthResult()
                tokenManager.saveToken(authResult.token)
                tokenManager.saveUsername(username)
                Result.success(authResult)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Registration failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun googleSignIn(idToken: String): Result<AuthResult> {
        return try {
            val response = api.googleMobileAuth(GoogleMobileAuthRequest(idToken))
            if (response.isSuccessful && response.body() != null) {
                val authResult = response.body()!!.toAuthResult()
                tokenManager.saveToken(authResult.token)
                authResult.user?.username?.let { tokenManager.saveUsername(it) }
                Result.success(authResult)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Google sign-in failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        tokenManager.clearToken()
    }

    suspend fun isLoggedIn(): Boolean {
        return tokenManager.getToken() != null
    }
}
