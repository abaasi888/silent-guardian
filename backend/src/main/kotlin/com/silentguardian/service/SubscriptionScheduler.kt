package com.silentguardian.service

import com.silentguardian.repository.SubscriptionRepository
import com.silentguardian.repository.UserRepository
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.Date

@Component
@EnableScheduling
class SubscriptionScheduler(
    private val subscriptionRepository: SubscriptionRepository,
    private val userRepository: UserRepository
) {
    @Scheduled(cron = "0 0 0 * * *")
    fun checkExpiredSubscriptions() {
        val now = Date()
        subscriptionRepository.findByEndDateBeforeAndActiveTrue(now)
            .flatMap { sub ->
                sub.active = false
                subscriptionRepository.save(sub)
                    .then(userRepository.findById(sub.userId))
                    .flatMap { user ->
                        user.subscriptionActive = false
                        userRepository.save(user)
                    }
            }
            .subscribe()
    }
}
