package com.silentguardian.employee.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.silentguardian.employee.R
import com.silentguardian.employee.models.Signup
import java.text.NumberFormat
import java.util.*

class SignupsAdapter(
    private val signups: List<Signup>
) : RecyclerView.Adapter<SignupsAdapter.SignupViewHolder>() {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SignupViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_signup, parent, false)
        return SignupViewHolder(view)
    }

    override fun onBindViewHolder(holder: SignupViewHolder, position: Int) {
        val signup = signups[position]
        holder.bind(signup)
    }

    override fun getItemCount(): Int = signups.size

    inner class SignupViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvDate: TextView = itemView.findViewById(R.id.tvSignupDate)
        private val tvUserId: TextView = itemView.findViewById(R.id.tvSignupUserId)
        private val tvPlan: TextView = itemView.findViewById(R.id.tvSignupPlan)
        private val tvAmount: TextView = itemView.findViewById(R.id.tvSignupAmount)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvSignupStatus)

        fun bind(signup: Signup) {
            tvDate.text = signup.date
            tvUserId.text = signup.userId
            tvPlan.text = signup.plan
            tvAmount.text = currencyFormat.format(signup.amount)
            tvStatus.text = signup.status.uppercase()
            
            when (signup.status.lowercase()) {
                "active" -> tvStatus.setTextColor(itemView.context.getColor(android.R.color.holo_green_dark))
                "expired" -> tvStatus.setTextColor(itemView.context.getColor(android.R.color.holo_red_dark))
                else -> tvStatus.setTextColor(itemView.context.getColor(android.R.color.darker_gray))
            }
        }
    }
}