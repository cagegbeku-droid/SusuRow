from database import engine, SessionLocal, Base
import models

def wipe_all_database_data():
    print("Wiping all demo/test data from SusuRow database...")
    db = SessionLocal()
    try:
        db.query(models.ContributionPayment).delete()
        db.query(models.PayoutDisbursement).delete()
        db.query(models.GroupMember).delete()
        db.query(models.SusuGroup).delete()
        db.query(models.OTPVerification).delete()
        db.query(models.User).delete()
        db.commit()
        print("Successfully wiped all data! Database is 100% clean and fresh.")
    except Exception as e:
        db.rollback()
        print(f"Error wiping database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    wipe_all_database_data()
