import subprocess
import logging
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