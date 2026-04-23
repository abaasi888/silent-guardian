package com.silentguardian.controller.admin

import com.silentguardian.model.Employee
import com.silentguardian.model.User
import com.silentguardian.repository.EmployeeRepository
import com.silentguardian.repository.UserRepository
import com.silentguardian.service.EmployeeService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
class AdminEmployeeController(
    private val employeeRepository: EmployeeRepository,
    private val userRepository: UserRepository,
    private val employeeService: EmployeeService,
    private val passwordEncoder: PasswordEncoder
) {
    @PostMapping
    fun inviteEmployee(@RequestBody request: EmployeeInviteRequest): Mono<Employee> {
        // Create a user account for the employee
        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.temporaryPassword),
            fullName = request.fullName,
            phone = request.phone,
            role = Role.USER // will be linked to employee
        )
        return userRepository.save(user)
            .flatMap { savedUser ->
                val employee = Employee(
                    userId = savedUser.id!!,
                    fullName = request.fullName,
                    email = request.email,
                    phone = request.phone,
                    nationalId = request.nationalId,
                    cvUrl = request.cvUrl,
                    nssfCardUrl = request.nssfCardUrl,
                    bankAccount = request.bankAccount
                )
                employeeService.createEmployee(employee)
            }
    }

    @GetMapping
    fun getAllEmployees(): Flux<Employee> = employeeRepository.findAll()

    @GetMapping("/{employeeId}/commissions")
    fun getEmployeeCommissions(@PathVariable employeeId: String): Flux<Commission> = commissionRepository.findByEmployeeId(employeeId)

    @PostMapping("/{employeeId}/pay-commission")
    fun payCommission(@PathVariable employeeId: String, @RequestParam month: String): Mono<Map<String, String>> {
        return employeeService.calculateMonthlyCommission(employeeId, month)
            .flatMap { amount ->
                employeeService.markCommissionsPaid(employeeId, month)
                    .thenReturn(mapOf("message" to "Paid $$amount for month $month"))
            }
    }
}

data class EmployeeInviteRequest(
    val fullName: String,
    val email: String,
    val phone: String,
    val nationalId: String,
    val cvUrl: String,
    val nssfCardUrl: String,
    val bankAccount: BankAccount,
    val temporaryPassword: String
)