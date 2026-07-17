from __future__ import annotations

import json
from pathlib import Path
from typing import Any


SOURCE = Path(__file__).with_name("schemes.json")


def load_concatenated_arrays(text: str) -> list[dict[str, Any]]:
    decoder = json.JSONDecoder()
    position = 0
    combined: list[dict[str, Any]] = []

    while position < len(text):
        while position < len(text) and text[position].isspace():
            position += 1

        if position >= len(text):
            break

        value, end = decoder.raw_decode(text, position)
        if not isinstance(value, list):
            raise ValueError(f"Expected a JSON array at position {position}")

        for item in value:
            if not isinstance(item, dict):
                raise ValueError("Expected each scheme entry to be a JSON object")
            combined.append(item)

        position = end

    return combined


def dedupe_by_id(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []

    for item in items:
        scheme_id = item.get("id")
        if not isinstance(scheme_id, str):
            raise ValueError("Every scheme object must have a string 'id' field")
        if scheme_id in seen:
            continue
        seen.add(scheme_id)
        deduped.append(item)

    return deduped


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    items = load_concatenated_arrays(text)
    items = dedupe_by_id(items)

    SOURCE.write_text(
        json.dumps(items, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Final count of schemes: {len(items)}")


if __name__ == "__main__":
    main()
