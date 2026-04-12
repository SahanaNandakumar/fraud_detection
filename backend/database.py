"""
database.py - MongoDB connection using Motor (async MongoDB driver)
"""
import motor.motor_asyncio
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "fraud_detection"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections used dynamically in main.py:
# db.predictions  → stores every prediction result + features + SHAP values
# db.users        → stores registered users and hashed passwords (NEW)
