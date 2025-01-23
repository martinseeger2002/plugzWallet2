import configparser
from flask import Blueprint, jsonify, request
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import logging

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
    # print(f"Connecting to RPC server at: {rpc_url}")

    return AuthServiceProxy(rpc_url)

@bitcoin_rpc_bp.route('/listunspent/<ticker>/<address>', methods=['GET'])
def get_unspent_txs(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        utxos = rpc_connection.listunspent(0, 9999999, [address])
        return jsonify({
            "status": "success",
            "data": {
                "network": ticker,
                "address": address,
                "txs": [
                    {
                        "txid": utxo['txid'],
                        "vout": utxo['vout'],
                        "script_hex": utxo['scriptPubKey'],
                        "value": utxo['amount'],
                        "confirmations": utxo['confirmations']
                    } for utxo in utxos
                ]
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

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
        
        # Use listtransactions to get the last transactions for the address
        transactions = rpc_connection.listtransactions("*", 10, 0, True)
        
        # Filter transactions for the specific address
        filtered_transactions = [
            tx for tx in transactions if tx.get('address') == address
        ]

        # Debugging: Log the filtered transaction data
        for tx in filtered_transactions:
            logging.debug(f"Filtered Transaction data: {tx}")

        # Format the transactions
        formatted_transactions = [
            {
                "txid": tx['txid'],
                "amount": f"{tx['amount']:.8f}",  # Format the amount
                "confirmations": tx['confirmations'],
                "time": tx.get('time', 'N/A'),  # 'time' might not be available
                "address": tx.get('address', 'N/A')
            }
            for tx in filtered_transactions
        ]

        return jsonify({
            "status": "success",
            "data": {
                "network": ticker,
                "address": address,
                "transactions": formatted_transactions
            }
        })
    except (JSONRPCException, ValueError) as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bitcoin_rpc_bp.route('/importaddress/<ticker>', methods=['POST'])
def import_address(ticker):
    rpc_connection = get_rpc_connection(ticker)
    data = request.json

    # Log the incoming request data
    logging.info(f"Received import address request: {data}")

    # Extract address from the request
    address = data.get('address')

    if not address or not isinstance(address, str) or address.strip() == '':
        return jsonify({"status": "error", "message": "A single valid address is required."}), 400

    try:
        # Import the address without rescan using positional arguments
        rpc_connection.importaddress(address, "", False)
        return jsonify({
            "status": "success",
            "imported_address": address
        }), 200
    except JSONRPCException as e:
        logging.error(f"Error importing address: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bitcoin_rpc_bp.route('/gettransaction/<ticker>/<txid>', methods=['GET'])
def get_transaction_details(ticker, txid):
    try:
        rpc_connection = get_rpc_connection(ticker)
        # Get detailed transaction info with verbose=True (1)
        tx_details = rpc_connection.getrawtransaction(txid, 1)
        
        # Format the response
        formatted_tx = {
            "txid": tx_details['txid'],
            "size": tx_details['size'],
            "vsize": tx_details.get('vsize', tx_details['size']),  # fallback for older versions
            "version": tx_details['version'],
            "locktime": tx_details['locktime'],
            "vin": [{
                "txid": vin.get('txid', ''),
                "vout": vin.get('vout', ''),
                "sequence": vin.get('sequence', 0)
            } for vin in tx_details['vin']],
            "vout": [{
                "value": vout['value'],
                "n": vout['n'],
                "scriptPubKey": {
                    "asm": vout['scriptPubKey'].get('asm', ''),
                    "hex": vout['scriptPubKey'].get('hex', ''),
                    "type": vout['scriptPubKey'].get('type', ''),
                    "addresses": vout['scriptPubKey'].get('addresses', [])
                }
            } for vout in tx_details['vout']],
            "confirmations": tx_details.get('confirmations', 0),
            "time": tx_details.get('time', 0),
            "blocktime": tx_details.get('blocktime', 0),
            "blockhash": tx_details.get('blockhash', '')
        }

        return jsonify({
            "status": "success",
            "data": formatted_tx
        })
    except JSONRPCException as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

# Add other routes as needed 