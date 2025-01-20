import configparser
from flask import Blueprint, jsonify, request
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException

# Create a Blueprint for the Bitcoin RPC routes
bitcoin_rpc_bp = Blueprint('bitcoin_rpc', __name__)

# Read the RPC configuration file
config = configparser.ConfigParser()
config.read('./config/rpc.conf')

def get_rpc_connection(ticker):
    """Get RPC connection for a given ticker."""
    if ticker not in config:
        raise ValueError(f"No configuration found for ticker: {ticker}")
    
    rpc_user = config[ticker]['rpcuser']
    rpc_password = config[ticker]['rpcpassword']
    rpc_host = config[ticker]['rpchost']
    rpc_port = config[ticker]['rpcport']
    rpc_url = f'http://{rpc_user}:{rpc_password}@{rpc_host}:{rpc_port}'
    
    # Debugging: Print the RPC URL
    print(f"Connecting to RPC server at: {rpc_url}")

    return AuthServiceProxy(rpc_url)

@bitcoin_rpc_bp.route('/listunspent/<ticker>/<address>', methods=['GET'])
def list_unspent(ticker, address):
    try:
        rpc_connection = get_rpc_connection(ticker)
        # Fetch unspent transactions for the specific address
        unspent = rpc_connection.listunspent()
        # Filter unspent transactions by address
        filtered_unspent = [utxo for utxo in unspent if 'address' in utxo and utxo['address'] == address]
        return jsonify(filtered_unspent)
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/sendrawtransaction/<ticker>', methods=['POST'])
def send_raw_transaction(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        raw_tx = request.json.get('raw_tx')
        txid = rpc_connection.sendrawtransaction(raw_tx)
        return jsonify({'txid': txid})
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/getblockchaininfo/<ticker>', methods=['GET'])
def get_blockchain_info(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        info = rpc_connection.getblockchaininfo()
        return jsonify(info)
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/estimatesmartfee/<ticker>/<conf_target>', methods=['GET'])
def estimate_smart_fee(ticker, conf_target):
    try:
        rpc_connection = get_rpc_connection(ticker)
        fee_estimate = rpc_connection.estimatesmartfee(conf_target)
        return jsonify(fee_estimate)
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/getlasttransactions/<ticker>/<address>', methods=['GET'])
def get_last_transactions(ticker, address):
    try:
        rpc_connection = get_rpc_connection(ticker)
        # Fetch a larger number of transactions for the specific address
        transactions = rpc_connection.listtransactions("*", 10000)  # Increase the count to 100
        # Filter transactions by address and include both incoming and outgoing
        filtered_transactions = [
            tx for tx in transactions 
            if 'address' in tx and tx['address'] == address and tx['category'] in ['receive', 'send']
        ]
        return jsonify(filtered_transactions)
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/importaddress/<ticker>', methods=['POST'])
def import_address(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        data = request.json

        # Log the incoming request data
        print(f"Received import address request: {data}")

        # Extract address from the request
        address = data.get('address')
        label = data.get('label', '')  # Optional label
        rescan = data.get('rescan', False)  # Default to False

        if not address or not isinstance(address, str) or address.strip() == '':
            return jsonify({"status": "error", "message": "A single valid address is required."}), 400

        # Import the address without rescan
        rpc_connection.importaddress(address, label, rescan)

        print(f"Address {address} imported successfully as watch-only.")

        return jsonify({
            "status": "success",
            "imported_address": address
        }), 200
    except (JSONRPCException, ValueError) as e:
        print(f"Error importing address: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Add other routes as needed 