package com.silentguardian.controller.corporate

import com.silentguardian.repository.AuditLogRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux

@RestController
@RequestMapping("/api/v1/corporate/audit")
@PreAuthorize("hasRole('ORG_ADMIN') or hasRole('SUPER_ADMIN')")
class AuditController(private val auditLogRepository: AuditLogRepository) {

    @GetMapping("/org/{orgId}")
    fun getAuditLogs(@PathVariable orgId: String): Flux<AuditLog> = auditLogRepository.findByOrgIdOrderByTimestampDesc(orgId)

    @GetMapping("/org/{orgId}/action/{action}")
    fun getAuditLogsByAction(@PathVariable orgId: String, @PathVariable action: String): Flux<AuditLog> = auditLogRepository.findByOrgIdAndAction(orgId, action)
}