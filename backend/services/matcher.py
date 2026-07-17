import json

def load_schemes():
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        return json.load(f)

def match_schemes(user_profile: dict) -> list:
    schemes = load_schemes()
    matched = []

    for scheme in schemes:
        eligibility = scheme.get("eligibility", {})
        reasons = []
        failed = False

        # 1. Age check
        min_age = eligibility.get("min_age", 0)
        max_age = eligibility.get("max_age", 99)
        user_age = user_profile.get("age", 0)
        if not (min_age <= user_age <= max_age):
            continue

        # 2. Gender check
        allowed_genders = eligibility.get("gender", ["male", "female"])
        if user_profile.get("gender") not in allowed_genders:
            continue

        # 3. Caste check
        allowed_castes = eligibility.get("caste", ["general", "obc", "sc", "st"])
        if user_profile.get("caste") not in allowed_castes:
            continue

        # 4. Income check
        max_income = eligibility.get("income", 999999)
        if user_profile.get("income", 0) > max_income:
            continue

        # 5. Occupation check
        allowed_occupations = eligibility.get("occupation", ["any"])
        if "any" not in allowed_occupations:
            if user_profile.get("occupation") not in allowed_occupations:
                continue

        # 6. Domicile check
        required_domicile_years = eligibility.get("domicile_years", 0)
        required_domicile_state = eligibility.get("domicile_state", "")
        user_domicile_years = user_profile.get("domicile_years", 0)
        user_domicile_state = user_profile.get("domicile_state", "")

        domicile_status = "eligible"  # full, partial, none

        if required_domicile_state:
            if user_domicile_state != required_domicile_state:
                domicile_status = "not_eligible"
            elif user_domicile_years < required_domicile_years:
                domicile_status = "partial"

        if domicile_status == "not_eligible":
            continue

        # Build reason string
        reasons.append(f"Age {user_age} is within {min_age}-{max_age} range")
        reasons.append(f"Your caste category ({user_profile.get('caste').upper()}) is eligible")
        if user_profile.get("occupation") in allowed_occupations or "any" in allowed_occupations:
            reasons.append(f"Your occupation ({user_profile.get('occupation')}) qualifies")
        reasons.append(f"Your income is within the limit of Rs. {max_income:,}")

        matched.append({
            "id": scheme.get("id"),
            "title": scheme.get("title"),
            "description": scheme.get("description"),
            "ministry": scheme.get("ministry"),
            "state": scheme.get("state"),
            "benefits": scheme.get("benefits"),
            "documents": scheme.get("documents"),
            "application_process": scheme.get("application_process"),
            "scheme_url": scheme.get("scheme_url"),
            "tags": scheme.get("tags"),
            "domicile_status": domicile_status,
            "eligibility_reasons": reasons
        })

    # Sort: full eligible first, partial next
    matched.sort(key=lambda x: 0 if x["domicile_status"] == "eligible" else 1)

    return matched