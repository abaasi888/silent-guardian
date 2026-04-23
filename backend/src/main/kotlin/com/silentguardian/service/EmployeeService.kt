package com.silentguardian.service

import com.silentguardian.model.*
import com.silentguardian.repository.*
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*

@Service
class EmployeeService(
    private val employeeRepository: EmployeeRepository,
    private val referralLinkRepository: ReferralLinkRepository,
    private val commissionRepository: CommissionRepository,
    private val userRepository: UserRepository
) {
    fun generateEmployeeId(): String = "EMP${System.currentTimeMillis()}"

    fun generateReferralToken(): String = UUID.randomUUID().toString()

    fun createEmployee(employee: Employee): Mono<Employee> {
        return employeeRepository.save(employee.copy(employeeId = generateEmployeeId()))
    }

    fun getReferralLink(employeeId: String): Mono<ReferralLink> {
        return referralLinkRepository.findByEmployeeId(employeeId)
            .next()
            .switchIfEmpty(Mono.defer {
                val link = ReferralLink(
                    employeeId = employeeId,
                    token = generateReferralToken()
                )
                referralLinkRepository.save(link)
            })
    }

    fun processReferralSignup(token: String, newUserId: String, subscriptionAmount: Double): Mono<Commission> {
        return referralLinkRepository.findByToken(token)
            .flatMap { link ->
                employeeRepository.findByEmployeeId(link.employeeId)
                    .flatMap { employee ->
                        val commissionAmount = subscriptionAmount * employee.commissionRate
                        val commission = Commission(
                            employeeId = employee.employeeId,
                            referredUserId = newUserId,
                            subscriptionId = "", // would be set from actual subscription
                            subscriptionAmount = subscriptionAmount,
                            commissionRate = employee.commissionRate,
                            commissionAmount = commissionAmount,
                            payoutMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                        )
                        commissionRepository.save(commission)
                            .flatMap {
                                // Update employee referral count and check for permanent promotion
                                val newCount = employee.totalReferrals + 1
                                val updatedEmployee = employee.copy(totalReferrals = newCount)
                                if (newCount >= 1000 && !employee.isPermanent) {
                                    updatedEmployee.isPermanent = true
                                    updatedEmployee.permanentSince = Date()
                                    updatedEmployee.baseSalary = 1000.0 // example fixed salary
                                }
                                employeeRepository.save(updatedEmployee).thenReturn(it)
                            }
                    }
            }
    }

    fun calculateMonthlyCommission(employeeId: String, month: String): Mono<Double> {
        return commissionRepository.findByEmployeeIdAndPayoutMonth(employeeId, month)
            .filter { it.status == CommissionStatus.PENDING }
            .map { it.commissionAmount }
            .reduce(0.0, Double::plus)
    }

    fun markCommissionsPaid(employeeId: String, month: String): Mono<Void> {
        return commissionRepository.findByEmployeeIdAndPayoutMonth(employeeId, month)
            .filter { it.status == CommissionStatus.PENDING }
            .flatMap { commission ->
                commission.status = CommissionStatus.PAID
                commission.paidAt = Date()
                commissionRepository.save(commission)
            }
            .then()
    }
}