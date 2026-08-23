import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_chat_and_reminders(client):
    # 1. Create a group
    create_payload = {
        "name": "Coratech Dev Circle",
        "description": "Savings circle for developers",
        "is_private": False,
        "contribution_amount": 100.0,
        "frequency": "WEEKLY",
        "members_count": 2,
        "commitment_deposit": 0.0,
        "rotation_type": "SEQUENTIAL",
        "creator_phone": "0244111222",
        "creator_name": "Tech Leader",
        "creator_momo_provider": "MTN"
    }
    res = client.post("/api/groups", json=create_payload)
    assert res.status_code == 200
    group = res.json()
    group_id = group["id"]

    # 2. Post a chat message
    chat_payload = {
        "group_id": group_id,
        "sender_phone": "0244111222",
        "sender_name": "Tech Leader",
        "message_text": "Welcome to Coratech Dev Circle!",
        "is_announcement": True
    }
    chat_res = client.post("/api/chat/send", json=chat_payload)
    assert chat_res.status_code == 200
    msg = chat_res.json()
    assert msg["message_text"] == "Welcome to Coratech Dev Circle!"

    # 3. Fetch messages
    get_msgs = client.get(f"/api/chat/{group_id}/messages")
    assert get_msgs.status_code == 200
    assert len(get_msgs.json()) >= 1

    # 4. Trigger due reminders
    reminders_res = client.post(f"/api/reminders/send-due-reminders?group_id={group_id}")
    assert reminders_res.status_code == 200
    assert reminders_res.json()["status"] == "success"
