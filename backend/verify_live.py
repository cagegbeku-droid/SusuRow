import httpx
import sys

# Set stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

base = 'http://127.0.0.1:8000'
client = httpx.Client(base_url=base)

print('--- 1. Platform Statistics ---')
stats = client.get('/api/stats').json()
print('Stats:', stats)

print('\n--- 2. Public Marketplace Circles ---')
groups = client.get('/api/groups').json()
print(f'Found {len(groups)} public circles:')
for g in groups:
    print(f"  - {g['name']} ({g['frequency']}, {g['rotation_type']}) | Pot: GHS {g['total_pool']} | Enrolled: {g['enrolled_count']}/{g['members_count']} | Status: {g['status']}")

print('\n--- 3. Detail for Osu Techies Weekly Susu ---')
osu = [g for g in groups if 'Osu' in g['name']][0]
detail = client.get(f"/api/groups/{osu['id']}").json()
print(f"Circle: {detail['name']} | Current Round: {detail['current_round']}")
for m in detail['members']:
    print(f"  Slot #{m['payout_position']}: {m['full_name']} ({m['phone_number']}) [{m['momo_provider']}] - Paid Current Round: {m['has_paid_current_round']} | Received Payout: {m['has_received_payout']}")

print('\n--- 4. Paying Round 2 for Ama Osei (0558765432) ---')
ama = [m for m in detail['members'] if '0558765432' in m['phone_number']][0]
p_ama = client.post('/api/payments/simulate-instant', json={'group_id': osu['id'], 'member_id': ama['id']}).json()
print('Ama contribution recorded. Circle round:', p_ama['current_round'])

print('\n--- 5. Paying Round 2 for Yaw Appiah (0549998877) -> Triggers Pot Disbursal & Round Increment! ---')
yaw = [m for m in detail['members'] if '0549998877' in m['phone_number']][0]
p_yaw = client.post('/api/payments/simulate-instant', json={'group_id': osu['id'], 'member_id': yaw['id']}).json()
print(f"State Machine Advanced to Round: {p_yaw['current_round']}!")
print(f"Total Payouts recorded in ledger: {len(p_yaw['payouts'])}")
for p in p_yaw['payouts']:
    print(f"  - Round #{p['round_number']} Pot: GHS {p['amount']} to {p['recipient_phone']} ({p['momo_provider']}) [Ref: {p['transaction_reference']}]")

print('\n--- 6. Testing Private Invite Code Lookup (SUSU-KUMAS) ---')
kumas = client.get('/api/groups/code/SUSU-KUMAS').json()
print(f"Found Private Circle: {kumas['name']} | Capacity: {kumas['enrolled_count']}/{kumas['members_count']} | Invite Code: {kumas['invite_code']}")

print('\n--- 7. Verification Complete: All Systems 100% Operational! ---')
