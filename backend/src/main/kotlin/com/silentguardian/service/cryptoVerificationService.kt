package com.silentguardian.service

import org.json.JSONObject
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class CryptoVerificationService(
    @Value("\${crypto.api.key:}") private val apiKey: String,
    @Value("\${crypto.network:trc20}") private val network: String
) {
    private val webClient = WebClient.builder()
        .baseUrl(if (network == "trc20") "https://api.trongrid.io" else "https://api.bscscan.com/api")
        .build()

    fun verifyUSDTTransaction(expectedAmount: Double, targetAddress: String): Mono<String?> {
        return when (network.lowercase()) {
            "trc20" -> verifyTronUSDT(expectedAmount, targetAddress)
            "bep20" -> verifyBscUSDT(expectedAmount, targetAddress)
            else -> Mono.just(null)
        }
    }

    private fun verifyTronUSDT(expectedAmount: Double, targetAddress: String): Mono<String?> {
        return webClient.get()
            .uri("/v1/accounts/$targetAddress/transactions?only_confirmed=true&limit=10")
            .retrieve()
            .bodyToMono(String::class.java)
            .map { response ->
                val json = JSONObject(response)
                val data = json.getJSONArray("data")
                for (i in 0 until data.length()) {
                    val tx = data.getJSONObject(i)
                    val contract = tx.getJSONArray("raw_data").getJSONObject(0).getJSONArray("contract").getJSONObject(0)
                    if (contract.getString("type") == "TransferContract") {
                        val value = contract.getJSONObject("parameter").getJSONObject("value")
                        val toAddress = value.getString("to_address")
                        val amount = value.getLong("amount") / 1_000_000.0
                        if (toAddress.equals(targetAddress, ignoreCase = true) && amount == expectedAmount) {
                            return@map tx.getString("txID")
                        }
                    }
                }
                null
            }
            .onErrorReturn(null)
    }

    private fun verifyBscUSDT(expectedAmount: Double, targetAddress: String): Mono<String?> {
        val contractAddress = "0x55d398326f99059fF775485246999027B3197955"
        val url = "?module=account&action=tokentx&contractaddress=$contractAddress&address=$targetAddress&sort=desc&apikey=$apiKey"
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String::class.java)
            .map { response ->
                val json = JSONObject(response)
                val result = json.getJSONArray("result")
                for (i in 0 until result.length()) {
                    val tx = result.getJSONObject(i)
                    val value = tx.getString("value").toDouble() / 1e18
                    if (value == expectedAmount) {
                        return@map tx.getString("hash")
                    }
                }
                null
            }
            .onErrorReturn(null)
    }
}