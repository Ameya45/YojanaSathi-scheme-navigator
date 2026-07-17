from matcher import match_schemes

# Test user — 35 year old SC farmer from Maharashtra
user = {
    "age": 35,
    "gender": "male",
    "caste": "sc",
    "income": 150000,
    "occupation": "farmer",
    "domicile_state": "Maharashtra",
    "domicile_years": 5
}

results = match_schemes(user)
print(f"Total matched schemes: {len(results)}\n")
for s in results:
    print(f"{'✅' if s['domicile_status'] == 'eligible' else '⚠️'} {s['title']}")
    print(f"   Why: {s['eligibility_reasons'][0]}")
    print()