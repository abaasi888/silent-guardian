package com.silentguardian.repository
import com.silentguardian.model.User
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono

interface UserRepository : ReactiveMongoRepository<User, String> {
    fun findByEmail(email: String): Mono<User>
    fun existsByEmail(email: String): Mono<Boolean>
}
