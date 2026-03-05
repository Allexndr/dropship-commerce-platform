import requests
import json
import time
import random
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

class WBParser:
    def __init__(self, use_proxies=False, proxy_list=None):
        self.use_proxies = use_proxies
        self.proxy_list = proxy_list or []
        self.session = self._create_session()
        
        # A small list of modern User-Agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15'
        ]

    def _create_session(self):
        """Creates a requests session with exponential backoff retries."""
        session = requests.Session()
        
        # Retry strategy: up to 3 retries, backoff factor 1.0 (sleeps 1s, 2s, 4s...)
        # Retry on common server errors and connection issues
        retry = Retry(
            total=3,
            read=3,
            connect=3,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        return session

    def _get_random_headers(self, nm_id):
        """Generates random headers to mimic a real browser."""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'https://www.wildberries.ru',
            'Referer': f'https://www.wildberries.ru/catalog/{nm_id}/detail.aspx',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
        }

    def _get_random_proxy(self):
        """Returns a formatted proxy dictionary if proxies are enabled."""
        if not self.use_proxies or not self.proxy_list:
            return None
        proxy_url = random.choice(self.proxy_list)
        return {
            "http": proxy_url,
            "https": proxy_url,
        }

    def get_product_info(self, nm_id, dest=-1257786):
        """
        Fetches product info from Wildberries internal API with anti-ban measures.
        dest=-1257786 is a common region code for Almaty/KZ.
        """
        vol = nm_id // 100000
        part = nm_id // 1000
        
        # Primary API URL for detailed price and delivery (v4 is the current version)
        url_v4 = f"https://u-card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest={dest}&spp=30&nm={nm_id}"
        
        headers = self._get_random_headers(nm_id)
        proxies = self._get_random_proxy()

        try:
            # Add a small random sleep (0.5 to 2 seconds) before each request to simulate human delay
            time.sleep(random.uniform(0.5, 2.0))
            
            response = self.session.get(url_v4, headers=headers, proxies=proxies, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # in v4, 'products' is often at the root
                products = data.get('products')
                if products is None:
                    products = data.get('data', {}).get('products', [])
                
                if products:
                    p = products[0]
                    # v4 has structure: sizes[0].price.product and sizes[0].time1/time2
                    sizes = p.get('sizes', [])
                    if not sizes:
                         return {"status": "error", "message": "No sizes/price found on WB"}
                    
                    main_size = sizes[0]
                    t1 = main_size.get('time1', 0)
                    t2 = main_size.get('time2', 0)
                    total_hours = t1 + t2
                    delivery_days = round(total_hours / 24) if total_hours > 0 else 0
                    
                    # Nested price structure
                    price_info = main_size.get('price', {})
                    raw_price = price_info.get('product') or price_info.get('basic') or 0
                    
                    return {
                        "status": "success",
                        "name": p.get('name', 'Unknown'),
                        "brand": p.get('brand', 'Unknown'),
                        "price": raw_price / 100, 
                        "delivery_days": delivery_days,
                        "stock_status": "ok" if p.get('totalQuantity', 0) > 0 else "out_of_stock",
                        "quantity": p.get('totalQuantity', 0),
                        "source": "api_v4"
                    }

            # Fallback to basket shards if primary API 404s or fails
            # This is less likely to be rate-limited but doesn't have live price
            for shard in range(1, 15):
                url_basket = f"https://basket-{shard:02d}.wb.ru/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
                try:
                    res = self.session.get(url_basket, headers=headers, proxies=proxies, timeout=2)
                    if res.status_code == 200:
                        p = res.json()
                        name = p.get('imt_name') or p.get('subj_name') or "N/A"
                        brand = p.get('selling', {}).get('brand_name') or "N/A"
                        return {
                            "status": "success",
                            "name": str(name),
                            "brand": str(brand),
                            "price": 0,
                            "delivery_days": 0,
                            "stock_status": "detecting",
                            "quantity": 0,
                            "source": f"shard_{shard:02d}",
                            "note": "Price/Delivery unavailable on fallback shard."
                        }
                except:
                    continue
                    
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": f"Network error: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Parsing error: {str(e)}"}

        return {"status": "error", "message": "Product not found on WB"}


if __name__ == "__main__":
    # Test configuration
    # To use proxies, set use_proxies=True and provide a list: ['http://user:pass@ip:port', ...]
    parser = WBParser(use_proxies=False)
    
    test_ids = [287248036, 138457796, 246237703] # Replace with your real SKUs
    dest_almaty = -1257786
    
    print(f"{'NM_ID':<12} | {'Price':<10} | {'Days':<5} | {'Status':<15} | {'Source':<10} | {'Name'}")
    print("-" * 100)
    
    for nm in test_ids:
        try:
            info = parser.get_product_info(nm, dest=dest_almaty)
            if info['status'] == 'success':
                name = info.get('name', 'N/A')
                print(f"{nm:<12} | {info['price']:<10.2f} | {info['delivery_days']:<5} | {info['stock_status']:<15} | {info.get('source', 'unknown'):<10} | {name[:30]}...")
            else:
                msg = info.get('message', 'Unknown Error')
                print(f"{nm:<12} | {'ERROR':<10} | {'-':<5} | {'-':<15} | {'-':<10} | {msg[:30]}")
        except Exception as e:
            print(f"{nm:<12} | {'EXC':<10} | {'-':<5} | {'-':<15} | {'-':<10} | {str(e)[:30]}")
