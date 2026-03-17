import uuid
import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Enum, ForeignKey, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Variant(str, enum.Enum):
    A = "A"
    B = "B"


class EventType(str, enum.Enum):
    list_complete = "list_complete"
    button_click = "button_click"
    list_depth = "list_depth"


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    list_variant: Mapped[Variant] = mapped_column(Enum(Variant), nullable=False)
    button_variant: Mapped[Variant] = mapped_column(Enum(Variant), nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    events: Mapped[list["Event"]] = relationship("Event", back_populates="session")
    demographics: Mapped[Optional["Demographics"]] = relationship("Demographics", back_populates="session", uselist=False)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.id"), nullable=False
    )
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["Session"] = relationship("Session", back_populates="events")


class Demographics(Base):
    __tablename__ = "demographics"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.id"), unique=True, nullable=False
    )
    age_range: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    technical_background: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    prior_knowledge: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["Session"] = relationship("Session", back_populates="demographics")
