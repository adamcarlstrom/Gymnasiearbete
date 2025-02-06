from flask import Blueprint, render_template, request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import datetime
import json
from my_server import socketio, socket_ids
from flask_socketio import SocketIO, emit, join_room, leave_room

messages_bp = Blueprint('messages_bp', __name__,
                        template_folder='templates', static_folder='static', static_url_path='/messages/static')


@messages_bp.route('/messages')
def messages():
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    cur.execute('SELECT id, username, description, profile_picture FROM users')
    session['page'] = 'messages'
    return render_template('messages.html', active_page='messages')


@messages_bp.route('/search_contacts', methods=['POST'])
def search_contacts():
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    users = request.get_json()

    cur.execute('SELECT sender_id, receiver_id FROM messages')
    messages = cur.fetchall()

    list_of_contacts = []

    for user in users:
        for message in messages:
            if user[0] == message[0] and session['user']['id'] == message[1]:
                list_of_contacts.append(user)
                break
            elif user[0] == message[1] and session['user']['id'] == message[0]:
                list_of_contacts.append(user)
                break
    print(session['message_notification'])
    return json.dumps(list_of_contacts)


@messages_bp.route('/get_chat_history', methods=['POST'])
def get_chat_history():
    # ajax request
    id = request.get_json()

    # tror inte den här behövs längre för
    # jag definierar detta på ett annorlunda sätt längre ner
    session['current_chat_id'] = id

    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    # Skapa limit för hur många meddelanden som man ser i början, skapa automatisk fler meddelanden när man scrollar upp.

    cur.execute('SELECT * FROM messages WHERE sender_id = ? AND receiver_id = ? OR sender_id = ? AND receiver_id = ? ORDER BY date',
                (id, session['user']['id'], session['user']['id'], id))
    msgs = cur.fetchall()

    messages = {
        "messages": msgs,
        "own_id": session['user']['id']
    }

    # ska man göra någon json grej eller?
    return messages


# Denna fungerar inte än, det är något fel med keyerror med current_chat_id, den man chattar mot.
# men martin, metoden används ju inte
@messages_bp.route('/get_participant_info', methods=['POST'])
def get_participant_info():
    print('asd jksd fjklasdf jklöasdf jlökasdf löjkasdf klöjasdf jlök')

    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    print(session['current_chat_id'] + '\n\n\n\n\n\n\n')  # Varför ples

    cur.execute('SELECT username, profile_picture FROM users WHERE id = ?',
                (session['user']['id'], ))
    own_data = cur.fetchone()

    cur.execute('SELECT username, profile_picture FROM users WHERE id = ?',
                (session['current_chat_id'], ))
    other_data = cur.fetchone()

    participants = {
        "one": own_data,
        "two": other_data,
        "one_id": session['user']['id'],
        "two_id": session['current_chat_id']
    }

    print(participants + '\n\n\n\n\n')

    return participants


@messages_bp.route('/send_message', methods=['POST'])
def send_message():
    print('################################## sending message')
    data = request.get_json()
    print(data)
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()

    cur.execute('INSERT INTO messages (content, date, status, sender_id, receiver_id) VALUES (?, ?, ?, ?, ?)',
                (data['content'], datetime.datetime.now(), 0, session['user']['id'], data['id']))
    conn.commit()

    try:
        receiver_socket_id = socket_ids[data['id']]
        if (receiver_socket_id != None): 
            receiver_logged_in = True
            print('De är inloggade')
    except:
        receiver_logged_in = False
        print('De är inte inloggade')

    if (receiver_logged_in):
        print(socket_ids)
        print(receiver_socket_id)
        socketio.emit('receive_message', {
            'content': data['content'],
            'from_id':  session['user']['id']
        }, to=receiver_socket_id)
    return "None"


@messages_bp.route('/connecting_to_chat', methods=['POST'])
def connecting_to_chat():
    chatter_id = int(request.get_json())
    print('################################### connecting to chat')
    # detta är id för dem som man vill meddela
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('SELECT username FROM users WHERE id = ?', (chatter_id,))
    username = cur.fetchone()[0]

    cur.execute('UPDATE messages SET status = ? WHERE (receiver_id == ? AND sender_id == ?)',
                (1, session['user']['id'], chatter_id))
    conn.commit()
    cur.execute('SELECT status FROM messages WHERE receiver_id = ?',
                (session['user']['id'],))
    message_notifications = cur.fetchall()
    session['message_notification'] = False
    for message in message_notifications:
        if (message[0] == 0):
            session['message_notification'] = True
            break
    conn.close()

    room_info = {
        'user_connected_to': username,
        'id': chatter_id,
        'message_notification': session['message_notification']
    }
    print(room_info)
    # on_join(room_info)

    return json.dumps(room_info)


@messages_bp.route('/get_last_message', methods=['POST'])
def get_last_message():
    users = request.get_json()
    messages = []
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    for user in users:
        id = user[0]
        cur.execute('SELECT content, status FROM messages WHERE (sender_id = ? and receiver_id = ?)',
                    (id, session['user']['id']))
        m = cur.fetchall()
        if (len(m) == 0):
            last_message = ''
        else:
            last_message = m[len(m)-1]
        messages.append(last_message)

    print(messages)
    return json.dumps(messages)


@messages_bp.route('/changeSessionNotification', methods=['POST'])
def changeSessionNotification():
    session['message_notification'] = True
    session.modified = True
    return "None"


@messages_bp.route('/changeRead', methods=['POST'])
def changeRead():
    json = request.get_json()
    id = json['id']
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('UPDATE messages SET status = 1 WHERE sender_id = ? AND receiver_id = ?',
                (id, session['user']['id']))
    conn.commit()
    return "None"
