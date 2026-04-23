package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("org_users")
data class OrgUser(
    @Id val id: String? = null,
    val orgId: String,
    val userId: String,
    val role: OrgRole = OrgRole.MEMBER,
    val invitedBy: String? = null,
    val joinedAt: Date = Date(),
    var isActive: Boolean = true
)

enum class OrgRole {
    SUPER_ADMIN,    // across all orgs
    ORG_ADMIN,      // manage org settings, users, devices
    FLEET_MANAGER,  // view devices, generate reports
    VIEWER          // read-only
}