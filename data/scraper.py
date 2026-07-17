import requests
import json
import time

def fetch_all_schemes():
    all_schemes = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.myscheme.gov.in",
        "Referer": "https://www.myscheme.gov.in/",
    }

    page = 0
    page_size = 10

    while True:
        url = f"https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&from={page * page_size}&size={page_size}"
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"Status {response.status_code} on page {page}. Stopping.")
                break

            data = response.json()
            
            # Print raw response on first page so we can see structure
            if page == 0:
                print("Raw response keys:", data.keys())
                print("Sample:", json.dumps(data, indent=2)[:500])
            
            hits = data.get("data", {}).get("hits", [])
            
            if not hits:
                print(f"No more data at page {page}.")
                break

            for scheme in hits:
                src = scheme.get("_source", {})
                all_schemes.append({
                    "id": scheme.get("_id", ""),
                    "title": src.get("schemeName", ""),
                    "description": src.get("briefDescription", ""),
                    "ministry": src.get("nodalMinistryName", ""),
                    "state": src.get("state", "Central"),
                    "eligibility": src.get("eligibility", []),
                    "benefits": src.get("benefits", []),
                    "documents": src.get("documents", []),
                    "tags": src.get("tags", []),
                    "application_process": src.get("applicationProcess", ""),
                    "scheme_url": f"https://www.myscheme.gov.in/schemes/{scheme.get('_id', '')}"
                })

            print(f"Page {page + 1} done — total: {len(all_schemes)} schemes")
            page += 1
            time.sleep(0.5)

        except Exception as e:
            print(f"Error: {e}")
            break

    with open("data/schemes.json", "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Saved {len(all_schemes)} schemes.")

if __name__ == "__main__":
    fetch_all_schemes()