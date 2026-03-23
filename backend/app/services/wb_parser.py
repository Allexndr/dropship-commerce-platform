import requests
import json
import time
import random
import logging
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WBParser:
    def __init__(self, use_proxies=True):
        self.use_proxies = use_proxies
        # Load proxies from settings
        raw_proxies = settings.WB_PROXY_LIST
        self.proxy_list = [p.strip() for p in raw_proxies.split(',') if p.strip()] if raw_proxies else []
        
        self.session = self._create_session()
        
        # Modern User-Agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
        ]

    def _create_session(self):
        """Creates a requests session with exponential backoff retries."""
        session = requests.Session()
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
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': '*/*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'https://www.wildberries.ru',
            'Referer': f'https://www.wildberries.ru/catalog/{nm_id}/detail.aspx',
            'Sec-Ch-Ua': '"Not(A:Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
        }

    def _get_random_proxy(self):
        if not self.use_proxies or not self.proxy_list:
            return None
        proxy_url = random.choice(self.proxy_list)
        return {"http": proxy_url, "https": proxy_url}

    def get_product_info(self, nm_id, dest=-1257786):
        """
        Fetches product info for Almaty/KZ (dest=-1257786).
        """
        # API v4/v6 endpoint
        url = f"https://u-card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest={dest}&spp=30&nm={nm_id}"
        
        headers = self._get_random_headers(nm_id)
        proxies = self._get_random_proxy()

        try:
            # Random delay to avoid bot detection
            time.sleep(random.uniform(0.3, 1.2))
            
            logger.info(f"Fetching WB data for NM_ID: {nm_id} (Proxy: {'Enabled' if proxies else 'None'})")
            response = self.session.get(url, headers=headers, proxies=proxies, timeout=12)
            
            if response.status_code != 200:
                logger.warning(f"WB API returned status {response.status_code} for {nm_id}")
                return {"status": "error", "message": f"WB Server Error: {response.status_code}"}

            data = response.json()
            products = data.get('products') or data.get('data', {}).get('products', [])
            
            if not products:
                logger.info(f"Product {nm_id} not found on WB")
                return {"status": "error", "message": "Product not found"}

            p = products[0]
            sizes = p.get('sizes', [])
            if not sizes:
                return {"status": "error", "message": "Price not available"}

            main_size = sizes[0]
            # Price extraction (use final 'product' price if available, else 'basic')
            price_info = main_size.get('price', {})
            px = price_info.get('product') or price_info.get('basic') or 0
            
            # Delivery time extraction
            t1 = main_size.get('time1', 0)
            t2 = main_size.get('time2', 0)
            delivery_days = round((t1 + t2) / 24) if (t1+t2) > 0 else 0

            return {
                "status": "success",
                "name": p.get('name', 'N/A'),
                "brand": p.get('brand', 'N/A'),
                "price": px / 100,
                "delivery_days": delivery_days,
                "stock_status": "ok" if p.get('totalQuantity', 0) > 0 else "out_of_stock",
                "quantity": p.get('totalQuantity', 0),
                "source": "api_v4_stable"
            }

        except Exception as e:
            logger.error(f"Failed to parse WB NM_ID {nm_id}: {str(e)}")
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    p = WBParser(use_proxies=False)
    print(p.get_product_info(287248036))
