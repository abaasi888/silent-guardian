package com.silentguardian.controller.corporate

import com.silentguardian.model.Report
import com.silentguardian.repository.ReportRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/corporate/reports")
@PreAuthorize("hasRole('ORG_ADMIN') or hasRole('FLEET_MANAGER')")
class ReportController(private val reportRepository: ReportRepository) {

    @PostMapping
    fun generateReport(@RequestBody report: Report): Mono<Report> = reportRepository.save(report)

    @GetMapping("/org/{orgId}")
    fun getReportsByOrg(@PathVariable orgId: String): Flux<Report> = reportRepository.findByOrgIdOrderByCreatedAtDesc(orgId)

    @GetMapping("/{reportId}")
    fun getReport(@PathVariable reportId: String): Mono<Report> = reportRepository.findById(reportId)

    @DeleteMapping("/{reportId}")
    fun deleteReport(@PathVariable reportId: String): Mono<Void> = reportRepository.deleteById(reportId)
}