from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/endpoints', methods=['GET'])
def show_endpoints():
    return render_template('endpoints.html') 