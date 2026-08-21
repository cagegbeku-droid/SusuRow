"""
SusuRow - Ghana Telecom Live SMS Test Script
Run with:
    python test_live_sms.py --phone 0248355112
"""
import sys
import asyncio
import argparse
from dotenv import load_dotenv
from services.sms_service import GhanaSMSService

load_dotenv(override=True)

async def main():
    parser = argparse.ArgumentParser(description="Test Live Ghana SMS Dispatch")
    parser.add_argument("--phone", type=str, default="0248355112", help="Ghana mobile phone number (e.g. 0248355112)")
    parser.add_argument("--code", type=str, default=None, help="Custom 6-digit OTP code (optional)")
    args = parser.parse_args()

    otp = args.code or GhanaSMSService.generate_otp(6)
    phone = args.phone

    print("\n==========================================")
    print("      SusuRow Ghana SMS Dispatch Test      ")
    print("==========================================")
    print(f"Target Handset: {phone}")
    print(f"Test OTP Code:  {otp}")
    print("Dispatching SMS via configured gateway...\n")

    result = await GhanaSMSService.send_otp_sms(phone, otp)

    print("\n--- Dispatch Result ---")
    print(f"Provider: {result.get('provider')}")
    print(f"Success:  {result.get('success')}")
    if result.get('response'):
        print(f"Response: {result.get('response')}")
    if result.get('error'):
        print(f"Error:    {result.get('error')}")

    if result.get('provider') == 'DEV_CONSOLE':
        print("\nNote: Provider is currently DEV_CONSOLE. To deliver real physical SMS to your handset,")
        print("add your ARKESEL_API_KEY, HUBTEL_CLIENT_ID, or MNOTIFY_API_KEY in backend/.env")
    else:
        print(f"\nDispatched via live telecom gateway [{result.get('provider')}]. Check your physical handset!")

if __name__ == "__main__":
    asyncio.run(main())
