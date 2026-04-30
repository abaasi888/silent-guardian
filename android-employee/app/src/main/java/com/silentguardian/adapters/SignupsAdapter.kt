package com.silentguardian.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.TextView
import com.silentguardian.R
import com.silentguardian.models.Employee
import com.silentguardian.models.Signup
import java.text.NumberFormat
import java.util.Locale

class SignupsAdapter(
    private val context: android.content.Context,
    private val signups: List<Signup>,
    private val employee: Employee
) : BaseAdapter() {

    private val inflater = LayoutInflater.from(context)
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)

    override fun getCount(): Int = signups.size

    override fun getItem(position: Int): Any = signups[position]

    override fun getItemId(position: Int): Long = position.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val view = convertView ?: inflater.inflate(R.layout.item_signup, parent, false)
        
        val signup = signups[position]
        
        val tvDate = view.findViewById<TextView>(R.id.tvSignupDate)
        val tvUserId = view.findViewById<TextView>(R.id.tvSignupUserId)
        val tvPlan = view.findViewById<TextView>(R.id.tvSignupPlan)
        val tvAmount = view.findViewById<TextView>(R.id.tvSignupAmount)
        val tvCommission = view.findViewById<TextView>(R.id.tvSignupCommission)
        
        tvDate.text = signup.date
        tvUserId.text = signup.userId
        tvPlan.text = signup.plan
        tvAmount.text = currencyFormat.format(signup.amount)
        
        // Calculate commission based on employment type
        val commissionRate = if (employee.employmentType == "permanent") 0.1 else employee.commissionRate / 100.0
        val commission = signup.amount * commissionRate
        tvCommission.text = currencyFormat.format(commission)
        
        return view
    }
}