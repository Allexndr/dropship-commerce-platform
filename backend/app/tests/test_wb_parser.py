import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Ensure the root of the backend is in sys.path
# File is in backend/app/tests/test_wb_parser.py, so we go 2 levels up to reach 'backend'
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Correctly import from app.services
try:
    from app.services.wb_parser import WBParser
except ImportError:
    # Fallback for different execution contexts
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
    from app.services.wb_parser import WBParser

class TestWBParser(unittest.TestCase):
    def setUp(self):
        self.parser = WBParser(use_proxies=False)
        self.test_nm_id = 287248036 
        self.dest_almaty = -1257786

    @patch('app.services.wb_parser.requests.Session.get')
    def test_parse_v4_success(self, mock_get):
        """Test successful parsing of WB API v4 response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "products": [
                {
                    "id": 287248036,
                    "name": "Test Product",
                    "brand": "Test Brand",
                    "totalQuantity": 100,
                    "sizes": [
                        {
                            "time1": 48,
                            "time2": 24,
                            "price": {
                                "product": 150000,
                                "basic": 200000
                            }
                        }
                    ]
                }
            ]
        }
        mock_get.return_value = mock_response

        result = self.parser.get_product_info(self.test_nm_id, dest=self.dest_almaty)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['price'], 1500.0)
        self.assertEqual(result['delivery_days'], 3)
        self.assertEqual(result['stock_status'], 'ok')

    @patch('app.services.wb_parser.requests.Session.get')
    def test_parse_out_of_stock(self, mock_get):
        """Test handling of products with zero quantity."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "products": [
                {
                    "id": 12345,
                    "totalQuantity": 0,
                    "sizes": [{"time1": 0, "time2": 0, "price": {"product": 10000}}]
                }
            ]
        }
        mock_get.return_value = mock_response

        result = self.parser.get_product_info(12345)
        self.assertEqual(result['stock_status'], 'out_of_stock')

if __name__ == '__main__':
    unittest.main()
