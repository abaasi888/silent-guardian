package com.silentguardian.controller.corporate

import com.silentguardian.model.Organization
import com.silentguardian.model.OrgRole
import com.silentguardian.model.OrgUser
import com.silentguardian.repository.OrganizationRepository
import com.silentguardian.repository.OrgUserRepository
import com.silentguardian.repository.UserRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/corporate/orgs")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
class OrgController(
    private val orgRepository: OrganizationRepository,
    private val orgUserRepository: OrgUserRepository,
    private val userRepository: UserRepository
) {

    @PostMapping
    fun createOrg(@RequestBody org: Organization): Mono<Organization> {
        return orgRepository.save(org)
    }

    @GetMapping
    fun getAllOrgs(): Flux<Organization> = orgRepository.findAll()

    @GetMapping("/{orgId}")
    fun getOrg(@PathVariable orgId: String): Mono<Organization> = orgRepository.findById(orgId)

    @PutMapping("/{orgId}")
    fun updateOrg(@PathVariable orgId: String, @RequestBody org: Organization): Mono<Organization> {
        return orgRepository.findById(orgId)
            .flatMap { existing ->
                existing.name = org.name
                existing.domain = org.domain
                existing.subscriptionTier = org.subscriptionTier
                existing.maxDevices = org.maxDevices
                existing.maxUsers = org.maxUsers
                existing.features = org.features
                existing.settings = org.settings
                existing.updatedAt = Date()
                orgRepository.save(existing)
            }
    }

    @DeleteMapping("/{orgId}")
    fun deleteOrg(@PathVariable orgId: String): Mono<Void> = orgRepository.deleteById(orgId)

    @PostMapping("/{orgId}/users/{userId}")
    fun addUserToOrg(@PathVariable orgId: String, @PathVariable userId: String, @RequestParam role: OrgRole): Mono<OrgUser> {
        val orgUser = OrgUser(orgId = orgId, userId = userId, role = role)
        return orgUserRepository.save(orgUser)
    }

    @DeleteMapping("/{orgId}/users/{userId}")
    fun removeUserFromOrg(@PathVariable orgId: String, @PathVariable userId: String): Mono<Void> {
        return orgUserRepository.findByOrgIdAndUserId(orgId, userId)
            .flatMap { orgUserRepository.delete(it) }
    }
}