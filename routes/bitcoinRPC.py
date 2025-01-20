import configparser
from flask import Blueprint, jsonify, request
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException

# Create a Blueprint for the Bitcoin RPC routes
bitcoin_rpc_bp = Blueprint('bitcoin_rpc', __name__)

# Read the RPC configuration file
config = configparser.ConfigParser()
config.read('config/rpc.conf')

def get_rpc_connection(ticker):
    """Get RPC connection for a given ticker."""
    if ticker not in config:
        raise ValueError(f"No configuration found for ticker: {ticker}")
    
    rpc_user = config[ticker]['rpcuser']
    rpc_password = config[ticker]['rpcpassword']
    rpc_host = config[ticker]['rpchost']
    rpc_port = config[ticker]['rpcport']
    rpc_url = f'http://{rpc_user}:{rpc_password}@{rpc_host}:{rpc_port}'
    
    return AuthServiceProxy(rpc_url)

@bitcoin_rpc_bp.route('/listunspent/<ticker>', methods=['GET'])
def list_unspent(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        unspent = rpc_connection.listunspent()
        return jsonify(unspent)
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

@bitcoin_rpc_bp.route('/getlasttransactions/<ticker>', methods=['GET'])
def get_last_transactions(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        # Fetch the last 10 transactions
        transactions = rpc_connection.listtransactions("*", 10)
        return jsonify(transactions)
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

@bitcoin_rpc_bp.route('/importaddress/<ticker>', methods=['POST'])
def import_address(ticker):
    try:
        rpc_connection = get_rpc_connection(ticker)
        address = request.json.get('address')
        label = request.json.get('label', '')  # Optional label
        rescan = request.json.get('rescan', True)  # Optional rescan, default to True

        # Import the address as watch-only
        rpc_connection.importaddress(address, label, rescan)

        return jsonify({'success': True, 'message': f'Address {address} imported as watch-only.'})
    except (JSONRPCException, ValueError) as e:
        return jsonify({'error': str(e)}), 500

# Add other routes as needed 