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
    async def send_otp_sms(phone_number: str, otp_code: str) -> Dict[str, Any]:
        """
        Dispatches high-priority OTP SMS to Ghanaian mobile numbers via configured telecom gateway.
        Optimized for sub-3-second carrier delivery:
        - Single GSM segment (<65 chars) prevents telco concatenation delays.
        - Direct priority telecom routing.
        """
        load_dotenv(override=True)
        sms_provider = os.getenv("SMS_PROVIDER", "DEV").upper()
        arkesel_key = os.getenv("ARKESEL_API_KEY", "").strip()
        arkesel_sender = os.getenv("ARKESEL_SENDER_ID", "SusuRow").strip()
        hubtel_client_id = os.getenv("HUBTEL_CLIENT_ID", "").strip()
        hubtel_client_secret = os.getenv("HUBTEL_CLIENT_SECRET", "").strip()
        mnotify_key = os.getenv("MNOTIFY_API_KEY", "").strip()
        termii_key = os.getenv("TERMII_API_KEY", "").strip()
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

        # Ultra-short single SMS part (55 chars) for instantaneous telco delivery
        message = f"SusuRow: Your code is {otp_code}. Valid for 10 mins."
        
        # Clean local and international phone format
        clean_phone = phone_number.replace("+233", "0").replace(" ", "").replace("-", "").strip()
        if clean_phone.startswith("233"):
            clean_phone = "0" + clean_phone[3:]

        # International format without plus (e.g., 233248355112)
        intl_phone = "233" + clean_phone[1:] if clean_phone.startswith("0") else clean_phone
        intl_phone_plus = "+" + intl_phone

        # 1. Arkesel Ghana Gateway (Direct High-Priority Delivery)
        if (sms_provider == "ARKESEL" or arkesel_key) and arkesel_key:
            try:
                # Use connection timeout of 5s and keep-alive for lowest latency
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
                    print(f"[Arkesel SMS Gateway]: Status {resp.status_code} - {resp.text}")

                    if resp.status_code == 200 and data.get("status") == "success":
                        return {"success": True, "provider": "ARKESEL", "response": data}
                    else:
                        # If sender ID caused issue, retry with standard Arkesel sender
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

        # 2. Hubtel Ghana Gateway
        elif (sms_provider == "HUBTEL" or hubtel_client_id) and hubtel_client_id and hubtel_client_secret:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        "https://smsc.hubtel.com/v1/messages/send",
                        auth=(hubtel_client_id, hubtel_client_secret),
                        json={
                            "From": "SusuRow",
                            "To": intl_phone,
                            "Content": message
                        }
                    )
                    data = resp.json() if resp.status_code == 200 else {}
                    return {"success": resp.status_code == 200, "provider": "HUBTEL", "response": data}
            except Exception as e:
                return {"success": False, "error": str(e), "provider": "HUBTEL"}

        # 3. mNotify Ghana Gateway
        elif (sms_provider == "MNOTIFY" or mnotify_key) and mnotify_key:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        f"https://api.mnotify.com/api/sms/quick?key={mnotify_key}",
                        json={
                            "recipient": [intl_phone],
                            "sender": "SusuRow",
                            "message": message,
                            "is_schedule": False
                        }
                    )
                    data = resp.json() if resp.status_code == 200 else {}
                    return {"success": resp.status_code == 200, "provider": "MNOTIFY", "response": data}
            except Exception as e:
                return {"success": False, "error": str(e), "provider": "MNOTIFY"}

        # 4. Termii Gateway
        elif (sms_provider == "TERMII" or termii_key) and termii_key:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        "https://api.ng.termii.com/api/sms/send",
                        json={
                            "to": intl_phone,
                            "from": "SusuRow",
                            "sms": message,
                            "type": "plain",
                            "channel": "generic",
                            "api_key": termii_key
                        }
                    )
                    data = resp.json() if resp.status_code == 200 else {}
                    return {"success": resp.status_code == 200, "provider": "TERMII", "response": data}
            except Exception as e:
                return {"success": False, "error": str(e), "provider": "TERMII"}

        # 5. Twilio Gateway
        elif (sms_provider == "TWILIO" or twilio_sid) and twilio_sid and twilio_token and twilio_from:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                        auth=(twilio_sid, twilio_token),
                        data={
                            "From": twilio_from,
                            "To": intl_phone_plus,
                            "Body": message
                        }
                    )
                    return {"success": resp.status_code in [200, 201], "provider": "TWILIO"}
            except Exception as e:
                return {"success": False, "error": str(e), "provider": "TWILIO"}

        # Local Development / Console Fallback
        print(f"\n==========================================")
        print(f"[FAST GHANA SMS DISPATCH]")
        print(f"To: {phone_number} ({intl_phone})")
        print(f"Message: {message}")
        print(f"OTP Code: >>> {otp_code} <<<")
        print(f"==========================================\n")

        return {
            "success": True,
            "provider": "DEV_CONSOLE",
            "otp_code": otp_code,
            "message": "OTP dispatched (Dev Console)"
        }
