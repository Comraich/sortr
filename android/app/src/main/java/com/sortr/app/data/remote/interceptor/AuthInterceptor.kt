package com.sortr.app.data.remote.interceptor

import com.sortr.app.util.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth for login and register endpoints
        val path = originalRequest.url.encodedPath
        if (path.contains("/api/login") || path.contains("/api/register") || path.contains("/api/auth/")) {
            return chain.proceed(originalRequest)
        }

        // Add token to other requests
        val token = runBlocking { tokenManager.getToken() }

        return if (token != null) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }
    }
}
