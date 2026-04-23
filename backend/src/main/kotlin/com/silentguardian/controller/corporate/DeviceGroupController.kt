package com.silentguardian.controller.corporate

import com.silentguardian.model.DeviceGroup
import com.silentguardian.repository.DeviceGroupRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/corporate/groups")
@PreAuthorize("hasRole('ORG_ADMIN') or hasRole('SUPER_ADMIN')")
class DeviceGroupController(private val groupRepository: DeviceGroupRepository) {

    @PostMapping
    fun createGroup(@RequestBody group: DeviceGroup): Mono<DeviceGroup> = groupRepository.save(group)

    @GetMapping("/org/{orgId}")
    fun getGroupsByOrg(@PathVariable orgId: String): Flux<DeviceGroup> = groupRepository.findByOrgId(orgId)

    @PutMapping("/{groupId}")
    fun updateGroup(@PathVariable groupId: String, @RequestBody group: DeviceGroup): Mono<DeviceGroup> {
        return groupRepository.findById(groupId)
            .flatMap { existing ->
                existing.name = group.name
                existing.description = group.description
                existing.deviceIds = group.deviceIds
                existing.updatedAt = Date()
                groupRepository.save(existing)
            }
    }

    @DeleteMapping("/{groupId}")
    fun deleteGroup(@PathVariable groupId: String): Mono<Void> = groupRepository.deleteById(groupId)
}