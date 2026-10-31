import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "merchant_mitra.db")
print("Migrating database at:", db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns in merchants table
cursor.execute("PRAGMA table_info(merchants)")
existing_cols = [col[1] for col in cursor.fetchall()]
print("Existing merchant columns:", existing_cols)

new_columns = [
    ("preferred_language", "VARCHAR(10) DEFAULT 'en'"),
    ("voice_enabled", "BOOLEAN DEFAULT 1"),
    ("auto_login_greeting", "BOOLEAN DEFAULT 1"),
    ("voice_responses", "BOOLEAN DEFAULT 1"),
    ("preferred_speech_lang", "VARCHAR(10) DEFAULT 'en-IN'"),
    ("notify_purchases", "BOOLEAN DEFAULT 1"),
    ("notify_low_stock", "BOOLEAN DEFAULT 1"),
    ("notify_profit_decline", "BOOLEAN DEFAULT 1"),
    ("profit_decline_threshold_pct", "INTEGER DEFAULT 20"),
]

for col_name, col_type in new_columns:
    if col_name not in existing_cols:
        sql = f"ALTER TABLE merchants ADD COLUMN {col_name} {col_type}"
        print("Executing:", sql)
        cursor.execute(sql)

conn.commit()
conn.close()
print("Migration completed successfully!")
