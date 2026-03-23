import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class KaspiAPIClient:
    """
    Client for Kaspi.kz Partner API v2.
    Documentation: https://guide.kaspi.kz/partner/ru/shop/api/orders/q3202
    """
    
    BASE_URL = "https://kaspi.kz/shop/api/v2"
    
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.headers = {
            "Content-Type": "application/vnd.api+json",
            "X-Auth-Token": api_token
        }

    def get_orders(self, state: str = "NEW", start_date: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetch orders from Kaspi.
        :param state: Order state (NEW, PICKUP, DELIVERY, etc.)
        :param start_date: Creation date in milliseconds
        """
        params = {
            "filter[orders][state]": state,
            "page[size]": 100
        }
        if start_date:
            params["filter[orders][creationDate]"] = start_date

        try:
            response = requests.get(f"{self.BASE_URL}/orders", headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Kaspi API Error (get_orders): {e}")
            return []

    def get_order_entries(self, order_id: str) -> List[Dict[str, Any]]:
        """
        Get items within a specific order.
        """
        try:
            response = requests.get(f"{self.BASE_URL}/orders/{order_id}/entries", headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Kaspi API Error (get_order_entries): {e}")
            return []

    def get_order_address(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Get delivery address for an order.
        """
        try:
            response = requests.get(f"{self.BASE_URL}/orders/{order_id}/orderaddress", headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("data")
        except requests.exceptions.RequestException as e:
            logger.error(f"Kaspi API Error (get_order_address): {e}")
            return None

    def change_order_state(self, order_id: str, new_state: str) -> bool:
        """
        Change order state (e.g. to PICKUP or CANCELLED).
        """
        payload = {
            "data": {
                "type": "orders",
                "id": order_id,
                "attributes": {
                    "status": new_state
                }
            }
        }
        try:
            response = requests.patch(f"{self.BASE_URL}/orders", headers=self.headers, json=payload)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Kaspi API Error (change_order_state): {e}")
            return False
