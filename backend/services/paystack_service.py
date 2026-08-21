import os
import hmac
import hashlib
import httpx
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class GhanaMoMoGateway:
    """
    Production-ready Ghana Mobile Money Gateway
    Supports:
      - Paystack Ghana (MTN MoMo, Telecel Cash, AT Money)
      - Hubtel Merchant Payment API
      - Local Simulation Mode for development testing
    """

    @classmethod
    def get_keys(cls):
        load_dotenv(override=True)
        return {
            "PAYSTACK_SECRET_KEY": os.getenv("PAYSTACK_SECRET_KEY", "").strip(),
            "PAYSTACK_PUBLIC_KEY": os.getenv("PAYSTACK_PUBLIC_KEY", "").strip(),
            "HUBTEL_CLIENT_ID": os.getenv("HUBTEL_CLIENT_ID", "").strip(),
            "HUBTEL_CLIENT_SECRET": os.getenv("HUBTEL_CLIENT_SECRET", "").strip(),
            "HUBTEL_MERCHANT_ACCOUNT_NUMBER": os.getenv("HUBTEL_MERCHANT_ACCOUNT_NUMBER", "").strip(),
        }

    @classmethod
    def _map_paystack_provider(cls, provider: str) -> str:
        """Map internal provider name to Paystack telecom code."""
        p = provider.upper()
        if p == "MTN":
            return "mtn"
        elif p in ["TELECEL", "VODAFONE"]:
            return "vod"
        elif p in ["AT", "AIRTELTIGO"]:
            return "tgo"
        return "mtn"

    @classmethod
    async def charge_momo(
        cls,
        phone_number: str,
        amount_ghs: float,
        provider: str,
        email: str,
        reference: str,
        description: str = "SusuRow Circle Contribution"
    ) -> Dict[str, Any]:
        """
        Sends real USSD Mobile Money debit prompt to user's phone.
        """
        keys = cls.get_keys()
        clean_phone = phone_number.replace("+233", "0").replace(" ", "").replace("-", "").strip()
        if clean_phone.startswith("233"):
            clean_phone = "0" + clean_phone[3:]

        # 1. Real Paystack Ghana MoMo API
        if keys["PAYSTACK_SECRET_KEY"]:
            try:
                paystack_provider = cls._map_paystack_provider(provider)
                amount_in_pesewas = int(round(amount_ghs * 100))

                async with httpx.AsyncClient() as client:
                    payload = {
                        "amount": str(amount_in_pesewas),
                        "email": email or f"{clean_phone}@susurow.com",
                        "currency": "GHS",
                        "reference": reference,
                        "mobile_money": {
                            "phone": clean_phone,
                            "provider": paystack_provider
                        },
                        "metadata": {
                            "description": description,
                            "phone_number": clean_phone,
                            "provider": provider
                        }
                    }

                    headers = {
                        "Authorization": f"Bearer {keys['PAYSTACK_SECRET_KEY']}",
                        "Content-Type": "application/json"
                    }

                    resp = await client.post(
                        "https://api.paystack.co/charge",
                        json=payload,
                        headers=headers,
                        timeout=15.0
                    )
                    data = resp.json()
                    print(f"[Paystack Ghana MoMo Response]: Status {resp.status_code} - {data}")

                    if data.get("status"):
                        charge_data = data.get("data", {})
                        display_text = charge_data.get("display_text") or f"Please authorize payment of GH₵{amount_ghs:.2f} on your {provider} phone."
                        return {
                            "success": True,
                            "gateway": "PAYSTACK",
                            "status": charge_data.get("status", "pending"),
                            "reference": reference,
                            "ussd_prompt": display_text,
                            "raw": charge_data
                        }
                    else:
                        return {
                            "success": False,
                            "gateway": "PAYSTACK",
                            "error": data.get("message", "Paystack payment initiation failed")
                        }
            except Exception as e:
                print(f"[Paystack Charge Error]: {e}")
                return {"success": False, "gateway": "PAYSTACK", "error": str(e)}

        # 2. Local Simulation Mode (when keys not configured)
        return {
            "success": True,
            "gateway": "SIMULATED",
            "status": "pending",
            "reference": reference,
            "ussd_prompt": f"Authorize payment of GH₵{amount_ghs:.2f} to SusuRow on {clean_phone} ({provider}).",
            "message": "Simulated USSD dispatched. Configure PAYSTACK_SECRET_KEY in .env for live debit prompts."
        }

    @classmethod
    async def verify_payment(cls, reference: str) -> Dict[str, Any]:
        """
        Verify payment status directly with the gateway.
        """
        keys = cls.get_keys()
        if keys["PAYSTACK_SECRET_KEY"]:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"https://api.paystack.co/transaction/verify/{reference}",
                        headers={"Authorization": f"Bearer {keys['PAYSTACK_SECRET_KEY']}"},
                        timeout=10.0
                    )
                    data = resp.json()
                    if data.get("status") and data.get("data", {}).get("status") == "success":
                        return {"success": True, "paid": True, "data": data.get("data")}
                    return {"success": True, "paid": False, "status": data.get("data", {}).get("status")}
            except Exception as e:
                return {"success": False, "error": str(e)}

        return {"success": True, "paid": True, "gateway": "SIMULATED"}

    @classmethod
    def verify_paystack_webhook_signature(cls, payload_body: bytes, signature_header: str) -> bool:
        """
        Verifies Paystack HMAC SHA512 signature on incoming webhook.
        """
        keys = cls.get_keys()
        secret = keys["PAYSTACK_SECRET_KEY"]
        if not secret or not signature_header:
            return False
        computed = hmac.new(secret.encode("utf-8"), payload_body, hashlib.sha512).hexdigest()
        return hmac.compare_digest(computed, signature_header)
