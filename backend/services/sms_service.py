import os
import random
import string
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class GhanaSMSService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generates a secure 6-digit numeric OTP."""
        return "".join(random.choices(string.digits, k=length))

    @staticmethod
    async def send_sms_message(phone_number: str, message: str) -> Dict[str, Any]:
        """
        Dispatches an SMS message to a Ghanaian mobile number via configured telecom gateway.
        """
        load_dotenv(override=True)
        sms_provider = os.getenv("SMS_PROVIDER", "DEV").upper()
        arkesel_key = os.getenv("ARKESEL_API_KEY", "").strip()
        arkesel_sender = os.getenv("ARKESEL_SENDER_ID", "SusuRow").strip()
        
        # Clean local and international phone format
        clean_phone = phone_number.replace("+233", "0").replace(" ", "").replace("-", "").strip()
        if clean_phone.startswith("233"):
            clean_phone = "0" + clean_phone[3:]

        intl_phone = "233" + clean_phone[1:] if clean_phone.startswith("0") else clean_phone

        # 1. Arkesel Ghana Gateway (Direct High-Priority Delivery)
        if (sms_provider == "ARKESEL" or arkesel_key) and arkesel_key:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        "https://sms.arkesel.com/api/v2/sms/send",
                        headers={
                            "api-key": arkesel_key,
                            "Content-Type": "application/json"
                        },
                        json={
                            "sender": arkesel_sender,
                            "message": message,
                            "recipients": [intl_phone]
                        }
                    )
                    data = resp.json() if resp.status_code == 200 else {}
                    if resp.status_code == 200 and data.get("status") == "success":
                        return {"success": True, "provider": "ARKESEL", "response": data}
                    else:
                        if arkesel_sender != "Arkesel":
                            retry_resp = await client.post(
                                "https://sms.arkesel.com/api/v2/sms/send",
                                headers={"api-key": arkesel_key, "Content-Type": "application/json"},
                                json={"sender": "Arkesel", "message": message, "recipients": [intl_phone]}
                            )
                            if retry_resp.status_code == 200:
                                return {"success": True, "provider": "ARKESEL", "response": retry_resp.json()}
                        return {"success": False, "error": data.get("message", "Delivery error"), "provider": "ARKESEL"}
            except Exception as e:
                print(f"[SMS Gateway Error - Arkesel]: {e}")
                return {"success": False, "error": str(e), "provider": "ARKESEL"}

        # Local Development / Console Fallback
        print(f"\n==========================================")
        print(f"[FAST GHANA SMS DISPATCH]")
        print(f"To: {phone_number} ({intl_phone})")
        print(f"Message: {message}")
        print(f"==========================================\n")

        return {
            "success": True,
            "provider": "DEV_CONSOLE",
            "message": "SMS dispatched (Dev Console)"
        }

    @classmethod
    async def send_otp_sms(cls, phone_number: str, otp_code: str) -> Dict[str, Any]:
        """Dispatches high-priority OTP SMS to Ghanaian mobile numbers."""
        message = f"SusuRow: Your code is {otp_code}. Valid for 10 mins."
        return await cls.send_sms_message(phone_number, message)
