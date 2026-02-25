from datetime import datetime, timezone
from typing import TypeVar

T = TypeVar("T")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def paginate(items: list[T], limit: int, offset: int) -> list[T]:
    return items[offset : offset + limit]
