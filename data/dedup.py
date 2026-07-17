import json

with open("data/schemes.json", "r", encoding="utf-8") as f:
    schemes = json.load(f)

seen = set()
unique = []
for s in schemes:
    if s["id"] not in seen:
        seen.add(s["id"])
        unique.append(s)

with open("data/schemes.json", "w", encoding="utf-8") as f:
    json.dump(unique, f, ensure_ascii=False, indent=2)

print(f"Before: {len(schemes)} | After dedup: {len(unique)}")