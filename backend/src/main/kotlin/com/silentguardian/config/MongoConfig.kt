package com.silentguardian.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.mongodb.config.AbstractReactiveMongoConfiguration
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories

@Configuration
@EnableReactiveMongoRepositories(basePackages = ["com.silentguardian.repository"])
class MongoConfig : AbstractReactiveMongoConfiguration() {

    override fun getDatabaseName(): String = "silentguardian"

    // Optional: Custom converters for better date/object mapping
    @Bean
    override fun reactiveMongoTemplate(): org.springframework.data.mongodb.core.ReactiveMongoTemplate {
        return org.springframework.data.mongodb.core.ReactiveMongoTemplate(reactiveMongoClientFactory.createMongoClient(), getDatabaseName())
    }
}