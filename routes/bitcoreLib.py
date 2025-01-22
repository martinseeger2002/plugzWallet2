import subprocess
import logging
import json
from flask import Blueprint, jsonify, request

# Create a Blueprint for the bitcore library routes
bitcore_lib_bp = Blueprint('bitcore_lib', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@bitcore_lib_bp.route('/generatekey/<ticker>', methods=['GET'])
def generate_key(ticker):
    try:
        # Construct the absolute path to the Node.js script based on the ticker
        script_path = f'/root/plugzWallet2/bitcore-libs/{ticker.lower()}/generateKey.js'
        logging.debug(f"Script path: {script_path}")
        
        # Call the Node.js script with the specified ticker
        result = subprocess.run(
            ['node', script_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Log the output
        logging.debug(f"Script output: {result.stdout}")
        
        # Parse the output from the Node.js script
        output_lines = result.stdout.splitlines()
        wif_key = output_lines[0].split(': ')[1]
        address = output_lines[1].split(': ')[1]

        return jsonify({'wif': wif_key, 'address': address})
    except subprocess.CalledProcessError as e:
        logging.error(f"Subprocess error: {e.stderr}")
        return jsonify({'error': 'Failed to generate key', 'details': e.stderr}), 500
    except IndexError:
        logging.error("Unexpected output format from generateKey.js")
        return jsonify({'error': 'Unexpected output format from generateKey.js'}), 500
    except FileNotFoundError:
        logging.error(f"Script not found for ticker: {ticker}")
        return jsonify({'error': f'Script not found for ticker: {ticker}'}), 404 

@bitcore_lib_bp.route('/generate-tx', methods=['POST'])
def generate_tx():
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['walletData', 'receivingAddress', 'amount', 'fee']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400

        # Extract data
        wallet_data = data['walletData']
        receiving_address = data['receivingAddress']
        amount = data['amount']  # Should be in satoshis
        fee = data['fee']  # Should be in satoshis
        ticker = wallet_data.get('ticker', '').lower()

        # Validate wallet data structure
        required_wallet_fields = ['label', 'ticker', 'address', 'privkey', 'balance', 'utxos']
        for field in required_wallet_fields:
            if field not in wallet_data:
                return jsonify({
                    'error': f'Missing required wallet field: {field}'
                }), 400

        # Construct the absolute path to the Node.js script
        script_path = f'/root/plugzWallet2/bitcore-libs/{ticker}/generateTxHexWrapper.js'
        logging.debug(f"Script path: {script_path}")

        # Prepare the input data for the Node.js script
        input_data = json.dumps({
            'walletData': wallet_data,
            'receivingAddress': receiving_address,
            'amount': amount,
            'fee': fee
        })

        # Call the Node.js script
        process = subprocess.Popen(
            ['node', script_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Send input data and get output
        stdout, stderr = process.communicate(input=input_data)
        
        if process.returncode != 0:
            logging.error(f"Node.js script error: {stderr}")
            return jsonify({
                'error': 'Failed to generate transaction',
                'details': stderr
            }), 500

        # Parse the output
        try:
            result = json.loads(stdout)
            return jsonify({
                'success': True,
                'txHex': result['txHex']
            })
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse script output: {stdout}")
            return jsonify({
                'error': 'Invalid script output format',
                'details': str(e)
            }), 500

    except FileNotFoundError:
        logging.error(f"Script not found for ticker: {ticker}")
        return jsonify({
            'error': f'Script not found for ticker: {ticker}'
        }), 404
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500 

@bitcore_lib_bp.route('/generate_ord_hexs/<ticker>', methods=['POST'])
def generate_ord_hexs(ticker):
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'receiving_address', 'meme_type', 'hex_data', 
            'sending_address', 'privkey', 'utxo', 
            'vout', 'script_hex', 'utxo_amount'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400

        # Extract parameters
        receiving_address = data['receiving_address']
        meme_type = data['meme_type']
        hex_data = data['hex_data']
        sending_address = data['sending_address']
        privkey = data['privkey']
        utxo = data['utxo']
        vout = str(data['vout'])  # Convert to string
        script_hex = data['script_hex']
        
        # Convert utxo_amount to satoshis
        try:
            utxo_amount_float = float(data['utxo_amount'])
            utxo_amount_satoshis = str(int(utxo_amount_float * 100000000))
        except ValueError:
            return jsonify({
                'error': f'Invalid utxo_amount: {data["utxo_amount"]}'
            }), 400

        # Construct the absolute path to the Node.js script
        script_path = f'/root/plugzWallet2/bitcore-libs/{ticker.lower()}/generateOrd.js'
        logging.debug(f"Script path: {script_path}")

        # Prepare the command
        command = [
            'node', script_path, 'mint',
            receiving_address, meme_type, hex_data,
            sending_address, privkey, utxo, vout,
            script_hex, utxo_amount_satoshis
        ]

        # Log the command for debugging (mask private key)
        safe_command = command.copy()
        safe_command[7] = '***PRIVATE_KEY***'  # Mask private key
        logging.debug(f"Executing command: {safe_command}")

        # Execute the command
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )

        # Log the output
        logging.debug(f"Script output: {result.stdout}")

        # Parse the output
        try:
            output_data = json.loads(result.stdout)
            return jsonify(output_data)
        except json.JSONDecodeError:
            return jsonify({
                'txid': result.stdout.strip()  # Fallback if not JSON
            })

    except subprocess.CalledProcessError as e:
        logging.error(f"Script error: {e.stderr}")
        return jsonify({
            'error': 'Failed to inscribe',
            'details': e.stderr
        }), 500
    except FileNotFoundError:
        logging.error(f"Script not found for ticker: {ticker}")
        return jsonify({
            'error': f'Script not found for ticker: {ticker}'
        }), 404
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500 