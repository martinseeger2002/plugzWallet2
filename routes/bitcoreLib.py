import subprocess
from flask import Blueprint, jsonify, request

# Create a Blueprint for the bitcore library routes
bitcore_lib_bp = Blueprint('bitcore_lib', __name__)

@bitcore_lib_bp.route('/generatekey/<ticker>', methods=['GET'])
def generate_key(ticker):
    try:
        # Construct the path to the Node.js script based on the ticker
        script_path = f'bitcore-libs/{ticker}/generateKey.js'
        
        # Call the Node.js script with the specified ticker
        result = subprocess.run(
            ['node', script_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the output from the Node.js script
        output_lines = result.stdout.splitlines()
        wif_key = output_lines[0].split(': ')[1]
        address = output_lines[1].split(': ')[1]

        return jsonify({'wif': wif_key, 'address': address})
    except subprocess.CalledProcessError as e:
        return jsonify({'error': 'Failed to generate key', 'details': e.stderr}), 500
    except IndexError:
        return jsonify({'error': 'Unexpected output format from generateKey.js'}), 500
    except FileNotFoundError:
        return jsonify({'error': f'Script not found for ticker: {ticker}'}), 404 