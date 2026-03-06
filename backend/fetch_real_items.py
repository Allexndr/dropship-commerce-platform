import requests
import json
import time

def search_wb(query):
    # Wildberries Search API
    url = f"https://search.wb.ru/exactmatch/ru/common/v4/search?appType=1&curr=rub&dest=-1257786&query={query}&resultset=catalog"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return data.get('data', {}).get('products', [])
    except Exception as e:
        print(f"Error searching for {query}: {e}")
    return []

queries = ["зарядка type c", "кабель lightning", "powerbank 20000", "наушники bluetooth"]
real_items = []

print("Searching for real products on WB...")
for q in queries:
    products = search_wb(q)
    # Take top 3 from each category to get ~10-12 items
    for p in products[:3]:
        real_items.append({
            "nm_id": p.get("id"),
            "name": p.get("name"),
            "brand": p.get("brand"),
            "price_initial": p.get("salePriceU", 0) / 100 # WB prices are in cents
        })
    time.sleep(1) # Polite delay

# Fallback items if search fails
if not real_items:
    print("Search failed or returned no results. Using fallback items.")
    real_items = [
        {"nm_id": 588950902, "name": "Зарядное устройство Breaking P-08 Type-C", "brand": "Breaking", "price_initial": 1282},
        {"nm_id": 461551075, "name": "СЗУ USB Type-C 2 4A", "brand": "ISA", "price_initial": 503},
        {"nm_id": 559256346, "name": "СЗУ USB Turbo Charger (67W QC3.0 кабель Type-C с чипом I)", "brand": "Promise mobile", "price_initial": 1204},
        {"nm_id": 808908009, "name": "Зарядное устройство GAN 20W PD с кабелем USB-C – USB-C 3A", "brand": "TTEC", "price_initial": 3147},
        {"nm_id": 808908010, "name": "Зарядник GAN 30W PD Travel Fast Charger USB-C 150cm", "brand": "TTEC", "price_initial": 3501}
    ]

# Limit to 10
real_items = real_items[:10]

output_path = '/tmp/real_items.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(real_items, f, ensure_ascii=False, indent=2)

print(f"Successfully saved {len(real_items)} items to {output_path}")
for item in real_items:
    print(f"- {item['brand']} {item['name']} (ID: {item['nm_id']})")
