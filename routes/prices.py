import json
import requests
import threading
import time
from decimal import Decimal, InvalidOperation, getcontext
from flask import Blueprint, jsonify
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import unittest
from unittest.mock import patch

# Set decimal precision high enough to handle small values accurately
getcontext().prec = 18

# Create a Blueprint for the app routes
prices_bp = Blueprint('prices', __name__)

# Manually extracted JSON data from networks.js
coins = [
    { "name": "DOGE", "ticker": "DOGE", "color": "#BA9F33", "plugzfee": "69000000", "plugzfee_address": "DC8Jiub8pP9Vd1Scy3qU52AcjwsiKaj1mG" },
    { "name": "PEP", "ticker": "PEP", "color": "#009E60", "plugzfee": "1000000000", "plugzfee_address": "PfG5F6EQuukMXeec1YE465iFEq7BRwWKRe" },
    { "name": "LKY", "ticker": "LKY", "color": "#FF6600", "plugzfee": "100000000", "plugzfee_address": "Kxv5GYhaGqe5KA79EKJp86pSWMbYewssZA" },
    { "name": "SHIC", "ticker": "SHIC", "color": "#F93E3E", "plugzfee": "2000000000", "plugzfee_address": "SaivTHkECMw583DVqVaJS89jUahMa93sRQ" },
    { "name": "BONC", "ticker": "BONC", "color": "#FFB347", "plugzfee": "2000000000", "plugzfee_address": "BJ5mDERYAmEtBhQuJxmvfjYqy2DCg1TzqV" },
    { "name": "FLOP", "ticker": "FLOP", "color": "#6C6CFF", "plugzfee": "4000000000", "plugzfee_address": "FDdDMBfxGG1mXTtpPfsShrYEHauZgb8yVo", "networkfee": 100000000 },
    { "name": "DGB", "ticker": "DGB, DIGI", "color": "#3A80E0", "plugzfee": "70000000", "plugzfee_address": "DQe94HDmbjFrDfVGB11CCmvXsF1mY6a4pT" }
]

# Define the API endpoints for NonKYC, Xeggex, and Mecacex
NONKYC_API_URL = "https://api.nonkyc.io/api/v2/asset/getbyticker"
XEGGEX_API_URL = "https://api.xeggex.com/api/v2/asset/getbyticker"
MECACEX_API_URL = "https://mecacex.com/api/v2/trade/coinmarketcap/ticker"

# Global cache for storing prices
cached_prices = {}

# Global variable to track if the data collection process is running
is_fetching_prices = False

# Global variable to track the last time prices were updated
lastTimeUpdated = None

def requests_retry_session(
    retries=3,
    backoff_factor=0.3,
    status_forcelist=(500, 502, 504),
    session=None,
):
    session = session or requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def fetch_prices():
    global cached_prices, is_fetching_prices, lastTimeUpdated

    # Check if the data collection process is already running
    if is_fetching_prices:
        print("Price fetching process is already running.")
        return

    # Set the flag to indicate the process is running
    is_fetching_prices = True

    try:
        prices = {}
        mecacex_data = fetch_mecacex_data()
        if not mecacex_data:
            print("Mecacex data is empty. Skipping price fetching.")
            cached_prices = prices
            return

        print("Fetched Mecacex data successfully.")

        for coin in coins:
            tickers = [ticker.strip().upper() for ticker in coin['ticker'].split(',')]
            print(f"\nProcessing coin: {coin['name']} with tickers: {tickers}")

            price_nonkyc = get_price_from_sources(tickers, get_price_from_nonkyc)
            price_xeggex = get_price_from_sources(tickers, get_price_from_xeggex)
            price_mecacex = get_price_from_mecacex(tickers, mecacex_data)

            # Round prices to 8 decimal places using Decimal
            price_nonkyc_rounded = round_decimal(price_nonkyc, 10)
            price_xeggex_rounded = round_decimal(price_xeggex, 10)
            price_mecacex_rounded = round_decimal(price_mecacex, 10)

            # Calculate the aggregated price
            price_list = [price for price in [price_nonkyc_rounded, price_xeggex_rounded, price_mecacex_rounded] if price is not None]

            if price_list:
                try:
                    aggregated_price = round_decimal(sum(price_list) / Decimal(len(price_list)), 10)
                    print(f"Aggregated price for {coin['name']}: {aggregated_price}")
                except (InvalidOperation, ZeroDivisionError) as e:
                    print(f"Error calculating aggregated price for {coin['name']}: {e}")
                    aggregated_price = None
            else:
                aggregated_price = None
                print(f"No valid prices available to aggregate for {coin['name']}.")

            # Return prices as strings to preserve precision
            prices[coin['name']] = {
                'nonkyc': f"{price_nonkyc_rounded}" if price_nonkyc_rounded is not None else None,
                'xeggex': f"{price_xeggex_rounded}" if price_xeggex_rounded is not None else None,
                'mecacex': f"{price_mecacex_rounded}" if price_mecacex_rounded is not None else None,
                'aggregated': f"{aggregated_price}" if aggregated_price is not None else None
            }

        cached_prices = prices
        lastTimeUpdated = time.time()  # Update the last time prices were fetched
        print("\nUpdated cached_prices successfully.")
    finally:
        # Reset the flag to indicate the process is no longer running
        is_fetching_prices = False

def round_decimal(value, places):
    if value is None:
        return None
    try:
        decimal_value = Decimal(value)
        quantize_exp = Decimal('1.' + '0' * places)
        rounded_value = decimal_value.quantize(quantize_exp)
        return rounded_value
    except (InvalidOperation, TypeError) as e:
        print(f"Error rounding value {value}: {e}")
        return None

def fetch_mecacex_data():
    try:
        session = requests_retry_session()
        response = session.get(MECACEX_API_URL)
        response.raise_for_status()
        data = response.json()
        print("Successfully fetched Mecacex data.")
        return data
    except requests.RequestException as e:
        print(f"Error fetching data from Mecacex: {e}")
        return {}

def get_price_from_sources(tickers, price_function):
    for ticker in tickers:
        price = price_function(ticker)
        if price is not None:
            return price
    return None

def validate_decimal(value):
    try:
        Decimal(value)
        return True
    except (InvalidOperation, TypeError):
        return False

def get_price_from_nonkyc(ticker):
    try:
        url = f"{NONKYC_API_URL}/{ticker.lower()}"
        response = requests_retry_session().get(url)
        response.raise_for_status()
        data = response.json()
        usd_value = data.get('usdValue', None)
        if usd_value and validate_decimal(usd_value):
            usd_value_decimal = Decimal(usd_value)
            print(f"Fetched usdValue for {ticker} from NonKYC: {usd_value_decimal}")
            return usd_value_decimal
        else:
            print(f"usdValue not found or invalid for {ticker} in NonKYC response.")
            return None
    except requests.RequestException as e:
        print(f"Error fetching price from NonKYC for {ticker}: {e}")
        return None
    except (InvalidOperation, TypeError) as e:
        print(f"Error parsing usdValue for {ticker} from NonKYC: {e}")
        return None

def get_price_from_xeggex(ticker):
    try:
        url = f"{XEGGEX_API_URL}/{ticker.lower()}"
        response = requests_retry_session().get(url)
        response.raise_for_status()
        data = response.json()
        usd_value = data.get('usdValue', None)
        if usd_value and validate_decimal(usd_value):
            usd_value_decimal = Decimal(usd_value)
            print(f"Fetched usdValue for {ticker} from Xeggex: {usd_value_decimal}")
            return usd_value_decimal
        else:
            print(f"usdValue not found or invalid for {ticker} in Xeggex response.")
            return None
    except requests.RequestException as e:
        print(f"Error fetching price from Xeggex for {ticker}: {e}")
        return None
    except (InvalidOperation, TypeError) as e:
        print(f"Error parsing usdValue for {ticker} from Xeggex: {e}")
        return None

#
# UPDATED get_price_from_mecacex()
#
def get_price_from_mecacex(tickers, mecacex_data):
    """
    Fetch the 'last_price' for each ticker from the Mecacex data.
    If a ticker is not found, return None.
    """
    for ticker in tickers:
        # Construct the expected key format in the Mecacex data
        pair_key = f"{ticker}_USDT"
        
        # Check if the pair exists in the Mecacex data
        if pair_key in mecacex_data:
            last_price_str = mecacex_data[pair_key].get('last_price', None)
            if last_price_str and validate_decimal(last_price_str):
                try:
                    last_price_decimal = Decimal(last_price_str)
                    # Round to the eighth decimal place
                    last_price_rounded = round_decimal(last_price_decimal, 10)
                    print(f"Fetched and rounded last_price for {ticker} from Mecacex ({pair_key}): {last_price_rounded}")
                    return last_price_rounded
                except (InvalidOperation, TypeError) as e:
                    print(f"Error parsing last_price for {ticker} in Mecacex ({pair_key}): {e}")
            else:
                print(f"last_price not found or invalid for {ticker} in Mecacex response ({pair_key}).")
        else:
            print(f"No market pair found in Mecacex data for ticker={ticker}")

    # If no valid price was found, return None
    print(f"No valid Mecacex price found for tickers: {tickers}")
    return None

@prices_bp.route('/prices', methods=['GET'])
def get_prices_route():
    global lastTimeUpdated

    # Check if prices need to be updated
    if lastTimeUpdated is None or (time.time() - lastTimeUpdated) > 900:  # 900 seconds = 15 minutes
        print("Prices are outdated or not fetched yet. Fetching new prices.")
        fetch_prices()
    else:
        print("Prices are up-to-date.")

    return jsonify(cached_prices)

class TestPriceFetching(unittest.TestCase):

    @patch('routes.prices.requests.get')
    def test_get_price_from_nonkyc_success(self, mock_get):
        # Mock successful API response
        mock_response = unittest.mock.Mock()
        expected_value = "0.000017388500"
        mock_response.json.return_value = {"usdValue": expected_value}
        mock_response.raise_for_status = unittest.mock.Mock()
        mock_get.return_value = mock_response

        result = get_price_from_nonkyc("SHIC")
        self.assertEqual(result, Decimal(expected_value))

    @patch('routes.prices.requests.get')
    def test_get_price_from_nonkyc_no_usdValue(self, mock_get):
        # Mock API response without usdValue
        mock_response = unittest.mock.Mock()
        mock_response.json.return_value = {}
        mock_response.raise_for_status = unittest.mock.Mock()
        mock_get.return_value = mock_response

        result = get_price_from_nonkyc("SHIC")
        self.assertIsNone(result)

    @patch('routes.prices.requests.get')
    def test_get_price_from_nonkyc_api_failure(self, mock_get):
        # Mock API failure
        mock_get.side_effect = requests.RequestException("API Error")

        result = get_price_from_nonkyc("SHIC")
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
