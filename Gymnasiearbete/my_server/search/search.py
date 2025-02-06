from flask import Blueprint, render_template,request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import json
#from app import bcrypt

search_bp = Blueprint('search_bp', __name__, template_folder='templates', static_folder='static')


@search_bp.route('/search_users')
def search_users():
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    session['page'] = 'search_users'
    return render_template('search_users.html', active_page='search_users')


@search_bp.route('/search', methods=['POST'])
def search():
    search = request.get_json()
    formated_search = '%' + search + '%'

    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute(
        'SELECT id, username, description, profile_picture FROM users WHERE username LIKE ? AND id != ?', (formated_search,session['user']['id'] ))
    returning = cur.fetchall()
    return json.dumps(returning)