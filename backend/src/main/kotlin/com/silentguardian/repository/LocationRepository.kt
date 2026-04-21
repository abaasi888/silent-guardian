package com.silentguardian.repository
import com.silentguardian.model.Location
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface LocationRepository : ReactiveMongoRepository<Location, String> {
    fun findByDeviceIdAndUserIdOrderByTimestampDesc(deviceId: String, userId: String): Flux<Location>
}
