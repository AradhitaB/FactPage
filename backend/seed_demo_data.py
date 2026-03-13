#!/usr/bin/env python3
"""Seed the FactPage database with synthetic demo data.

Conversion rates are set so B outperforms A on both metrics, producing
a statistically significant result once enough sessions are seeded:
  List:   A=40% completion, B=55% completion
  Button: A=30% clicks,     B=45% clicks

Usage (from backend/ directory with venv active):
    python seed_demo_data.py                  # 500 sessions, reproducible
    python seed_demo_data.py --sessions 200   # fewer sessions
    python seed_demo_data.py --clear          # clear existing data first, then seed
    python seed_demo_data.py --clear --sessions 200
"""
import argparse
import random
import uuid
from datetime import datetime, timezone, timedelta

import config  # noqa: F401  loads .env before any other import
from database import engine, Base, SessionLocal
from models import Session, Event, Variant, EventType

_LIST_RATES: dict[Variant, float] = {Variant.A: 0.40, Variant.B: 0.55}
_BUTTON_RATES: dict[Variant, float] = {Variant.A: 0.30, Variant.B: 0.45}


def seed(n_sessions: int, clear: bool, random_seed: int) -> None:
    rng = random.Random(random_seed)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if clear:
            db.query(Event).delete()
            db.query(Session).delete()
            db.commit()
            print("Cleared existing data.")

        variants = [Variant.A, Variant.B]
        now = datetime.now(timezone.utc)
        list_completions: dict[Variant, int] = {Variant.A: 0, Variant.B: 0}
        button_clicks: dict[Variant, int] = {Variant.A: 0, Variant.B: 0}

        for _ in range(n_sessions):
            list_v = rng.choice(variants)
            button_v = rng.choice(variants)
            created = now - timedelta(seconds=rng.randint(0, 7 * 24 * 3600))

            session = Session(
                id=str(uuid.uuid4()),
                created_at=created,
                list_variant=list_v,
                button_variant=button_v,
            )
            db.add(session)
            db.flush()  # assigns session.id without committing

            if rng.random() < _LIST_RATES[list_v]:
                db.add(Event(
                    id=str(uuid.uuid4()),
                    session_id=session.id,
                    event_type=EventType.list_complete,
                    created_at=created + timedelta(seconds=rng.randint(30, 300)),
                ))
                list_completions[list_v] += 1

            if rng.random() < _BUTTON_RATES[button_v]:
                db.add(Event(
                    id=str(uuid.uuid4()),
                    session_id=session.id,
                    event_type=EventType.button_click,
                    created_at=created + timedelta(seconds=rng.randint(5, 60)),
                ))
                button_clicks[button_v] += 1

        db.commit()

        print(f"Seeded {n_sessions} sessions.")
        print(f"  List completions  — A: {list_completions[Variant.A]}, B: {list_completions[Variant.B]}")
        print(f"  Button clicks     — A: {button_clicks[Variant.A]},    B: {button_clicks[Variant.B]}")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed FactPage DB with synthetic demo data.")
    parser.add_argument(
        "--sessions", type=int, default=500,
        help="Number of sessions to create (default: 500; ~250/variant, above the ~197 required threshold)",
    )
    parser.add_argument(
        "--clear", action="store_true",
        help="Delete all existing sessions and events before seeding",
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    args = parser.parse_args()
    seed(args.sessions, args.clear, args.seed)


if __name__ == "__main__":
    main()
