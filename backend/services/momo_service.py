import uuid
import random
import string
import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models import MoMoWebhookLog, MoMoProvider

class GhanaMoMoService:
    @staticmethod
    def generate_transaction_ref(prefix: str = "MOMO") -> str:
        """Generates an authentic Ghanaian telecom mobile money transaction reference (e.g. MOMO-GHS-7K9A2F)."""
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        timestamp = datetime.utcnow().strftime("%y%m%d")
        return f"{prefix}-{timestamp}-{suffix}"

    @staticmethod
    def detect_provider(phone_number: str) -> str:
        """Detects Ghana telecom provider based on National Communication Authority (NCA) assigned prefixes."""
        clean = phone_number.replace("+233", "0").replace(" ", "").replace("-", "")
        if clean.startswith("233"):
            clean = "0" + clean[3:]
        
        if len(clean) >= 3:
            prefix = clean[:3]
            # MTN Ghana: 024, 054, 055, 059, 025, 053
            if prefix in ["024", "054", "055", "059", "025", "053"]:
                return MoMoProvider.MTN.value
            # Telecel (formerly Vodafone Ghana): 020, 050
            elif prefix in ["020", "050"]:
                return MoMoProvider.TELECEL.value
            # AT (formerly AirtelTigo): 027, 057, 026, 056
            elif prefix in ["027", "057", "026", "056"]:
                return MoMoProvider.AT.value
        return MoMoProvider.MTN.value

    @staticmethod
    def log_webhook_event(db: Session, reference: str, provider: str, event_type: str, payload: Dict[str, Any]):
        """Persists incoming or simulated Ghana Mobile Money webhook payloads for auditability."""
        log_entry = MoMoWebhookLog(
            id=str(uuid.uuid4()),
            transaction_reference=reference,
            provider=provider,
            event_type=event_type,
            payload_json=json.dumps(payload, default=str),
            processed_at=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        return log_entry

    @staticmethod
    def create_ussd_prompt_payload(
        phone_number: str,
        amount: float,
        provider: str,
        group_name: str,
        round_number: int,
        reference: str
    ) -> Dict[str, Any]:
        """Generates formatted USSD confirmation prompt matching authentic Ghana MoMo prompt text."""
        ussd_prompts = {
            "MTN": f"Payment request from SUSUROW for GH₵{amount:.2f} for '{group_name}' Round {round_number}. Enter MM PIN to approve. Reference: {reference}",
            "TELECEL": f"Telecel Cash: Authorize GH₵{amount:.2f} to SUSUROW (Round {round_number}). Dial *110# or enter PIN to approve.",
            "AT": f"AT Money: Approve debit of GH₵{amount:.2f} for SUSUROW. Ref: {reference}. Enter PIN:"
        }
        prompt_text = ussd_prompts.get(provider, ussd_prompts["MTN"])
        
        return {
            "transaction_reference": reference,
            "provider": provider,
            "recipient_phone": phone_number,
            "amount": amount,
            "currency": "GHS",
            "prompt_text": prompt_text,
            "status": "PROMPT_SENT",
            "expires_in_seconds": 120
        }
