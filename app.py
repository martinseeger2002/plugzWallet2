from flask import Flask, render_template
from flask_cors import CORS  # Import Flask-CORS
from routes.bitcoinRPC import bitcoin_rpc_bp
from routes.bitcoreLib import bitcore_lib_bp
from routes.main import main_bp
from routes.rc001 import rc001_bp
from routes.prices import prices_bp
from routes.task import start_scheduler

app = Flask(__name__, static_folder='static')

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Register the blueprints
app.register_blueprint(bitcoin_rpc_bp, url_prefix='/api')
app.register_blueprint(bitcore_lib_bp, url_prefix='/bitcore_lib')
app.register_blueprint(rc001_bp, url_prefix='/rc001')
app.register_blueprint(prices_bp, url_prefix='/prices')
app.register_blueprint(main_bp)

# Start the scheduler
scheduler = start_scheduler()

# Shut down the scheduler when exiting the app
@app.teardown_appcontext
def shutdown_scheduler(exception=None):
    if scheduler.running:
        scheduler.shutdown()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5679, debug=True)
