"""Seed the insurance_policies catalog table from seed_policies.json."""

import sys
import os
import json

# Allow imports from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

# Explicitly load .env from backend root
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from services.vector_store import get_client

SEED_FILE = os.path.join(
    os.path.dirname(__file__),
    "../data/seed_policies.json"
)


def main():
    # 🔍 Verification prints
    print("DEBUG — SUPABASE_URL:",
          repr(os.getenv("SUPABASE_URL")))
    print("DEBUG — KEY LENGTH:",
          len(os.getenv("SUPABASE_SERVICE_KEY"))
          if os.getenv("SUPABASE_SERVICE_KEY") else None)

    client = get_client()

    with open(SEED_FILE, "r", encoding="utf-8") as f:
        policies = json.load(f)

    print(f"Seeding {len(policies)} policies...")

    # Clear existing catalog
    client.table("insurance_policies") \
        .delete() \
        .neq("id", "00000000-0000-0000-0000-000000000000") \
        .execute()

    for i, policy in enumerate(policies):
        client.table("insurance_policies").insert(policy).execute()
        print(f"[{i+1}/{len(policies)}] {policy['name']} — {policy['insurer']}")

    print("\nCatalog seeded successfully.")


if __name__ == "__main__":
    main()