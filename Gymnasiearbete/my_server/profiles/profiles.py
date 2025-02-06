from flask import Blueprint, render_template, request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
#from app import bcrypt
from werkzeug.utils import secure_filename
import os
import uuid
from flask_bcrypt import Bcrypt
bcrypt = Bcrypt()

profiles_bp = Blueprint('profiles_bp', __name__, template_folder='templates',
                        static_folder='static', static_url_path='/profiles/static')


@profiles_bp.route('/own_profile')
def own_profile():
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = ?', (session['user']['id'],))
    user_info = cur.fetchone()
    session['page'] = 'own_profile'
    return render_template('own_profile.html', active_page='own_profile', user_info=user_info)


@profiles_bp.route('/change_password', methods=['POST'])
def change_password():
    password = request.form['password']
    password_repeat = request.form['password_repeat']
    if (password == ''):
        flash('Lösenord kan ej vara tomt', 'danger')
        return redirect(url_for('profiles_bp.own_profile'))
    print(password, password_repeat)
    if not (password == password_repeat):
        flash('Lösenorden stämmer ej med varandra', 'warning')
        return redirect(url_for('profiles_bp.own_profile'))
    password_hash = bcrypt.generate_password_hash(password)
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    current_user_id = session['user']['id']
    print(password_hash, current_user_id)
    cur.execute('UPDATE users SET password = ? WHERE id = ?',
                (password_hash, current_user_id))
    conn.commit()
    conn.close()
    flash('Uppdaterade nytt lösenord', 'info')
    return redirect(url_for('profiles_bp.own_profile'))


@profiles_bp.route('/delete_account', methods=['POST'])
def delete_account():
    password = request.form['password']
    password_repeat = request.form['password_repeat']
    if (password == ''):
        flash('Lösenord kan ej vara tomt', 'danger')
        return redirect(url_for('profiles_bp.own_profile'))
    print(password, password_repeat)
    if not (password == password_repeat):
        flash('Lösenorden stämmer ej med varandra', 'warning')
        return redirect(url_for('profiles_bp.own_profile'))
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('SELECT password FROM users WHERE id = ?',
                (session['user']['id'],))
    real_password = cur.fetchone()[0]
    print('aaaaaaaaaa')
    print(real_password)
    if (bcrypt.check_password_hash(real_password, password)):
        # delete account allowed
        cur.execute('DELETE FROM messages WHERE id = ?',
                    (session['user']['id'], ))
        cur.execute('DELETE FROM games_history WHERE receiver_id = ? OR sender_id = ?',
                    (session['user']['id'], session['user']['id']))
        cur.execute('DELETE FROM users WHERE id = ?', (session['user']['id'],))
        conn.commit()
        flash('Raderade konto', 'success')
        return redirect(url_for('auth_bp.logout'))
    flash('Fel lösenord', 'danger')
    return redirect(url_for('profiles_bp.own_profile'))


@profiles_bp.route('/update_user_info', methods=['POST'])
def update_user_info():
    username = request.form['username']
    if (username == ''):
        flash('Användarnamn kan inte vara tomt', 'danger')
        return redirect(url_for('profiles_bp.own_profile'))
    description = request.form['description']
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    cur.execute('SELECT username FROM users where id = ? ',
                (session['user']['id'],))
    original_username = cur.fetchone()[0]
    print(original_username)
    if not original_username == username:
        # kolla ifall användarnamn redan finns
        cur.execute(
            'SELECT id,username,password FROM users WHERE username = ?', (username,))
        userInfo = cur.fetchone()
        print(userInfo)
        if userInfo:
            flash('Användare med detta användarnamn finns redan', 'danger')
            return redirect(url_for('profiles_bp.own_profile'))

    cur.execute('UPDATE users SET username = ?, description = ? WHERE id = ?',
                (username, description, session['user']['id'],))
    conn.commit()
    session['user']['username'] = username
    flash('Användarinformation uppdaterad', 'info')
    return redirect(url_for('profiles_bp.own_profile'))


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


@profiles_bp.route('/upload_file', methods=['GET', 'POST'])
def upload_file():
    print('attempt to upload')
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('Ingen vald fil', 'warning')
            print(request.url)
            return redirect(request.url)
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('Ingen vald fil', 'warning')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            unique_filename = str(uuid.uuid4())
            file_ext = os.path.splitext(file.filename)[1]
            # vet inte om raden under behövs eftersom vi redan änder på filnamnet ovan
            filename = secure_filename(file.filename)
            print('file does exist ', file.filename,
                  ' new name', unique_filename)
            file.save(os.path.join(
                current_app.config['UPLOAD_FOLDER'], unique_filename + file_ext))
            conn = create_connection(current_app.config['DB_PATH'])
            cur = conn.cursor()
            cur.execute('UPDATE users SET profile_picture = ? WHERE id = ?',
                        (unique_filename + file_ext, session['user']['id']))
            conn.commit()

            session['user']['profile_picture'] = unique_filename + file_ext
            session.modified = True
    return redirect(url_for('profiles_bp.own_profile'))


# https://flask.palletsprojects.com/en/2.2.x/patterns/fileuploads/

@profiles_bp.route('/view_profile/<id>')
def view_profile(id=None):
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)

    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    cur.execute('SELECT * FROM users WHERE id = ?', (id, ))
    viewed_user = cur.fetchone()
    cur.execute(
        'SELECT * FROM games_history WHERE sender_id = ? OR receiver_id = ? ORDER BY date DESC', (id, id))
    games = cur.fetchall()
    usernames = []
    for game in games:
        if (int(game[2]) == int(id)):
            cur.execute(
                'SELECT id,username FROM users WHERE id == ?', (game[1],))
        elif (int(game[1]) == int(id)):
            cur.execute(
                'SELECT id,username FROM users WHERE id == ?', (game[2],))
        name = cur.fetchone()
        usernames.append(name)
    print(usernames)
    i = 0
    j = 0
    size = len(usernames)
    while (size > i):
        j = i+1
        while (size > j):
            if (not (j == i) and usernames[i] == usernames[j]):
                del usernames[j]
                size -= 1
                j -= 1
            j += 1
        i += 1
    session['page'] = 'view_profile'

    win = 0
    nr_of_games = 0

    for game in games:
        if game[3] == int(id):
            win += 1
        nr_of_games += 1

    if nr_of_games != 0:
        win_rate = int((win / nr_of_games + 0.0005) * 1000)
        win_rate = win_rate / 10
    else:
        win_rate = 0

    print(usernames)
    return render_template('view_profile.html', active_page='view_profile', viewed_user=viewed_user, games=games, username=usernames, win_rate=win_rate)
