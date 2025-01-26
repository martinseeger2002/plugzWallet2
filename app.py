from flask import Flask, render_template
from routes.bitcoinRPC import bitcoin_rpc_bp
from routes.bitcoreLib import bitcore_lib_bp
from routes.main import main_bp
from routes.rc001 import rc001_bp

app = Flask(__name__, static_folder='static')

# Register the blueprints
app.register_blueprint(bitcoin_rpc_bp, url_prefix='/api')
app.register_blueprint(bitcore_lib_bp, url_prefix='/bitcore_lib')
app.register_blueprint(rc001_bp, url_prefix='/rc001')
app.register_blueprint(main_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
