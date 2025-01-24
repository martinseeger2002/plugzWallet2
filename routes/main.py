from flask import Blueprint, render_template, send_from_directory

main_bp = Blueprint('main', __name__)

@main_bp.route('/endpoints', methods=['GET'])
def show_endpoints():
    return render_template('endpoints.html') 

@main_bp.route('/wallet')
def index():
    return render_template('wallet.html')

@main_bp.route('/')
def settings():
    return render_template('index.html')

@main_bp.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

@main_bp.route('/service-worker.js')
def service_worker():
    return send_from_directory('static/js', 'service-worker.js')