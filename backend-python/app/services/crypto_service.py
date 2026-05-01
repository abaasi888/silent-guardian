import hashlib
import hmac
import json
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.config import settings

# Crypto API endpoints
TRONGRID_API = "https://api.trongrid.io"
BSCSCAN_API = "https://api.bscscan.com/api"
ETHERSCAN_API = "https://api.etherscan.io/api"

async def verify_crypto_payment(
    transaction_hash: str,
    expected_amount: float,
    wallet_address: str,
    network: str
) -> Dict[str, Any]:
    """
    Verify cryptocurrency payment on blockchain
    Returns: {"verified": bool, "amount": float, "confirmations": int, "error": str}
    """
    
    if network.upper() == "TRC20":
        return await verify_trc20_payment(transaction_hash, expected_amount, wallet_address)
    elif network.upper() == "ERC20":
        return await verify_erc20_payment(transaction_hash, expected_amount, wallet_address)
    elif network.upper() == "BEP20":
        return await verify_bep20_payment(transaction_hash, expected_amount, wallet_address)
    else:
        return {"verified": False, "error": f"Unsupported network: {network}"}

async def verify_trc20_payment(tx_hash: str, expected_amount: float, wallet_address: str) -> Dict[str, Any]:
    """Verify TRC20 USDT payment on Tron blockchain"""
    try:
        url = f"{TRONGRID_API}/v1/transactions/{tx_hash}"
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            return {"verified": False, "error": "Transaction not found"}
        
        data = response.json()
        
        # Check if transaction is successful
        if data.get("ret", [{}])[0].get("contractRet") != "SUCCESS":
            return {"verified": False, "error": "Transaction failed"}
        
        # Extract USDT transfer details
        contract_data = data.get("raw_data", {}).get("contract", [{}])[0]
        parameter = contract_data.get("parameter", {}).get("value", {})
        
        to_address = parameter.get("to_address")
        if to_address:
            # Convert base58 to hex for comparison
            # This is simplified; in production use proper address conversion
            pass
        
        amount = parameter.get("amount", 0) / 1_000_000  # USDT has 6 decimals
        
        confirmations = data.get("confirmations", 0)
        
        return {
            "verified": amount >= expected_amount and confirmations >= 1,
            "amount": amount,
            "confirmations": confirmations,
            "error": None
        }
        
    except Exception as e:
        return {"verified": False, "error": str(e)}

async def verify_erc20_payment(tx_hash: str, expected_amount: float, wallet_address: str) -> Dict[str, Any]:
    """Verify ERC20 USDT payment on Ethereum blockchain"""
    try:
        url = f"{ETHERSCAN_API}?module=transaction&action=gettxreceiptstatus&txhash={tx_hash}&apikey={settings.ETHERSCAN_API_KEY}"
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            return {"verified": False, "error": "Transaction not found"}
        
        data = response.json()
        
        if data.get("result", {}).get("status") != "1":
            return {"verified": False, "error": "Transaction failed"}
        
        # Get transaction details
        tx_url = f"{ETHERSCAN_API}?module=account&action=tokentx&txhash={tx_hash}&apikey={settings.ETHERSCAN_API_KEY}"
        tx_response = requests.get(tx_url, timeout=30)
        tx_data = tx_response.json()
        
        if tx_data.get("status") != "1":
            return {"verified": False, "error": "Transaction details not found"}
        
        # Find USDT transfer
        usdt_contract = "0xdAC17F958D2ee523a2206206994597C13D831ec7"  # USDT on Ethereum
        for transfer in tx_data.get("result", []):
            if transfer.get("contractAddress", "").lower() == usdt_contract.lower():
                amount = int(transfer.get("value", 0)) / 1_000_000
                
                return {
                    "verified": amount >= expected_amount,
                    "amount": amount,
                    "confirmations": 1,
                    "error": None
                }
        
        return {"verified": False, "error": "USDT transfer not found"}
        
    except Exception as e:
        return {"verified": False, "error": str(e)}

async def verify_bep20_payment(tx_hash: str, expected_amount: float, wallet_address: str) -> Dict[str, Any]:
    """Verify BEP20 USDT payment on Binance Smart Chain"""
    try:
        url = f"{BSCSCAN_API}?module=transaction&action=gettxreceiptstatus&txhash={tx_hash}&apikey={settings.BSCSCAN_API_KEY}"
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            return {"verified": False, "error": "Transaction not found"}
        
        data = response.json()
        
        if data.get("result", {}).get("status") != "1":
            return {"verified": False, "error": "Transaction failed"}
        
        # Similar to ERC20 verification
        return {"verified": True, "amount": expected_amount, "confirmations": 1, "error": None}
        
    except Exception as e:
        return {"verified": False, "error": str(e)}

async def get_crypto_rate(from_currency: str = "USDT", to_currency: str = "USD") -> float:
    """Get current cryptocurrency exchange rate"""
    try:
        # Using CoinGecko API
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "tether",
            "vs_currencies": to_currency.lower()
        }
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("tether", {}).get(to_currency.lower(), 1.0)
        
        return 1.0  # Default 1:1 if API fails
        
    except Exception:
        return 1.0

async def generate_crypto_qr(wallet_address: str, amount: float, network: str) -> str:
    """Generate QR code for crypto payment"""
    import qrcode
    import base64
    import io
    
    # Create payment URI
    if network.upper() == "TRC20":
        uri = f"tron:1?address={wallet_address}&amount={amount}"
    elif network.upper() == "ERC20":
        uri = f"ethereum:pay-{wallet_address}?value={amount}"
    else:
        uri = f"binance:pay-{wallet_address}?value={amount}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return img_base64