from flask import Blueprint, render_template,request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import datetime
from flask_bcrypt import Bcrypt
from my_server import socket_ids, player_games
bcrypt = Bcrypt()

auth_bp = Blueprint('auth_bp', __name__, template_folder='templates', static_folder='static')

@auth_bp.route('/')
@auth_bp.route('/index')
def index():
    if not ('logged_in' in session and session['logged_in'] == True):
        session['logged_in'] = False
    session['page'] = 'index'
    return render_template('index.html', active_page='index')


@auth_bp.route('/log_in')
def log_in():
    # aldrig inloggad vid detta
    session['logged_in'] = False
    session.pop('user', None)
    session['page'] = 'login'
    return render_template('log_in.html', active_page='login')


@auth_bp.route('/log_in', methods=['POST'])
def log_in_post():
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    username = request.form['username']
    password = request.form['password']
    print(username, password)
    cur.execute(
        'SELECT id,username,password FROM users WHERE username = ?', (username,))
    userInfo = cur.fetchone()
    print(userInfo)
    if userInfo:
        id = userInfo[0]
        real_password = userInfo[2]
        if (bcrypt.check_password_hash(real_password, password)):
            cur.execute(
                'SELECT profile_picture FROM users WHERE username = ?', (username,))
            profile_picture = cur.fetchone()[0]
            session['user'] = {
                'id': id,
                'username': username,
                'profile_picture': profile_picture
            }
            session['logged_in'] = True
            flash(f'Inloggning lyckad', 'info')
            cur.execute('SELECT status FROM messages WHERE receiver_id = ?', (session['user']['id'],))
            message_notifications = cur.fetchall()
            #Dem ser typ ut såhär: [(1,)(1,)(0,)]. Man når dem som en dubbel array genom list[0][0] typ vilket ger 1 i detta fall
            print(message_notifications)
            session['message_notification'] = False
            for message in message_notifications:
                if(message[0] == 0):
                    session['message_notification'] = True
                    break
            conn.close()
            return redirect(url_for('auth_bp.index'))
        else:
            flash('Fel användarnamn eller lösenord', 'warning')
            conn.close()
            return redirect(url_for('auth_bp.log_in'))

    else:
        flash('Fel användarnamn eller lösenord', 'warning')
        conn.close()
        return redirect(url_for('auth_bp.log_in'))


@auth_bp.route('/logout')
def logout():
    #sätta användarens socket_id till inget
    socket_ids[session['user']['id']] = None
    player_games[session['user']['id']] = None
    
    session['logged_in'] = False
    session['message_notification'] = False
    session.pop('user', None)
    session.pop('page', None)
    flash('Du har loggats ut', 'info')
    return redirect(url_for('auth_bp.index'))


@auth_bp.route('/new_user')
def new_user():
    session['logged_in'] = False
    session.pop('user', None)
    session['page'] = 'new_user'
    return render_template('new_user.html', active_page='new_user')


@auth_bp.route('/new-user', methods=['POST'])
def new_user_post():
    username = request.form['username']
    password = request.form['password']
    password_repeat = request.form['password_repeat']
    if (password == ''):
        flash('Lösenord kan inte vara tomt', 'danger')
        return redirect(url_for('auth_bp.new_user'))
    elif not (password == password_repeat):
        flash('Lösenorden upprepades fel', 'warning')
        return redirect(url_for('auth_bp.new_user'))

    password_hash = bcrypt.generate_password_hash(password)
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    # kolla ifall användarnamn redan finns
    cur.execute(
        'SELECT username FROM users WHERE username = ?', (username, ))
    user = cur.fetchone()

    if user:
        flash('Användare med detta användarnamn finns redan', 'danger')
        return redirect(url_for('auth_bp.new_user'))



     # Fixa automatisk bild vid skapning av konto


    profile_picture = 'default_profile.png'

    cur.execute('INSERT INTO users (username, password, description, creation_date, profile_picture) VALUES (?,?,?,?,?)',
                (username, password_hash, 'Ingen beskrivning. ', datetime.datetime.now(), profile_picture)) 
    conn.commit()

    flash('Ny användare skapad', 'info')
    cur.execute('SELECT id FROM users WHERE username = ?', (username, ))
    id = cur.fetchone()[0]
    session['user'] = {
        'id': id,
        'username': username,
        'profile_picture': profile_picture
    }
    session.modified = True
    print(profile_picture)
    print(session['user']['profile_picture'])
    session['logged_in'] = True
    conn.close()
    return redirect(url_for('auth_bp.index'))