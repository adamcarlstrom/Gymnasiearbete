from flask import Blueprint, render_template, request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import datetime, json
from my_server import socketio, socket_ids, search_games, player_games
from flask_socketio import SocketIO, emit, join_room, leave_room

game_bp = Blueprint('game_bp', __name__,
                        template_folder='templates', static_folder='static', static_url_path='/game/static')

@game_bp.route('/game_hub')
def game_hub():
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    session['page'] = 'game_hub'
    return render_template('game_hub.html', active_page='game_hub')

@game_bp.route('/game')
def game():
    if 'logged_in' not in session or session['logged_in'] == False:
        abort(401)
    print('####################################### Game start' + session['user']['username'])
    try:
        print(player_games[session['user']['id']])
        if(player_games[session['user']['id']] == None):
            print('Goto game hub instead 1')
            return redirect(url_for('game_bp.game_hub'))
    except:
        print('Goto game hub instead 2')
        return redirect(url_for('game_bp.game_hub'))
    
    print(player_games[session['user']['id']])
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('SELECT username FROM users WHERE id = ?', (player_games[session['user']['id']]['opponent_id'],))
    opponent = cur.fetchone()[0]
    session['page'] = 'game'
    return render_template('game.html', active_page='game', username=session['user']['username'],opponent = opponent, opponent_id = player_games[session['user']['id']]['opponent_id'])

@game_bp.route('/searchGame', methods=['POST'])
def search_game():
    try:
        print(search_games)
        opponent_id = search_games[0]
        print('not empty')
        print(opponent_id)
        if(opponent_id != session['user']['id']):
            try:
                socket_id = socket_ids[opponent_id]
                if (socket_id != None): 
                    del search_games[0]
                    print('sending to their socket')
                    socketio.emit('search_challenge', {
                        'sender_id': session['user']['id']
                    },to=socket_id)
                    player_games[session['user']['id']] = {
                        'opponent_id': opponent_id
                    }
                    session.modified = True
                    print('returning true')
                    return {'status':True}
            except:
                print('opponent not logged in ??')
                print('adding self instead and removing opponent')
                del search_games[0]
                search_games.append(session['user']['id'])
    except:
        print('empty, adding self')
        search_games.append(session['user']['id'])
    print('returning false')
    return {'status':False}

@game_bp.route('/your_challenge_accepted', methods=['POST'])
def your_challenge_accepted():
    print(session['user']['username'] +'yourChallengeAccepted define game ajax!!!!')
    data = request.get_json()
    player_games[session['user']['id']] = {
        'opponent_id': data['id']
    }
    session.modified = True
    print('try to return')
    return "Something"

@socketio.on('send_snake')
def send_snake(data):
    #skickar all snake info till den andra användarn
    socket_id=0
    try:
        print(session['user']['id'])
        print(player_games)
        print(player_games[session['user']['id']])
        print(player_games[session['user']['id']]['opponent_id'])
        print(socket_ids)
        print(socket_ids[player_games[session['user']['id']]['opponent_id']])
        socket_id = socket_ids[player_games[session['user']['id']]['opponent_id']]
    except:
        print(session['user']['username'] +'################################################ error med session game')
        emit('game_aborted',{})
    if (socket_id != None or socket_id != 0): 
        print(session['user']['username'] +'################################################ sending snake data')
        emit('receive_snake',
            data, to=socket_id)

@socketio.on('snake_died')
def snake_died(data):
    #användare som skickar detta förlora
    print(session['user']['username'] +'############################################### snake dog')
    #skickar till motståndaren
    print('scokets')
    print(socket_ids)
    print('games')
    print(player_games)
    try:
        emit('snake_win',{},to=socket_ids[player_games[session['user']['id']]['opponent_id']])
    except:
        print('could not reach opponent too bad')
    conn = create_connection(current_app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('INSERT INTO games_history (sender_id,receiver_id,winner_id, date) VALUES (?,?,?,?) ', (session['user']['id'],player_games[session['user']['id']]['opponent_id'],player_games[session['user']['id']]['opponent_id'],datetime.datetime.now()))
    conn.commit()
    player_games[session['user']['id']] = None

@socketio.on('snake_win')
def snake_win(data):
    #användare som skickar detta vann
    print(session['user']['username'] +'############################################### snake vann')
    player_games[session['user']['id']] = None
    
@socketio.on('ready_up')
def ready_up(data):
    print('ready up ' + str(data))
    info = data
    try:
        emit('player_2_ready', (info), to=socket_ids[player_games[session['user']['id']]['opponent_id']])
    except:
        #andra personen inte inne i hemsidan än så chilla typ
        print('chill')
        flash('Opponent not loaded in yet' , 'warning')
        emit('opponent_not_ready',{})
        
@socketio.on('start_game')
def start_game(data):
    print('game ready to start for both')
    #båda redo att börja spela
    try:
        emit('start_game', {}, to=socket_ids[player_games[session['user']['id']]['opponent_id']])
        emit('start_game', {})
    except:
        emit('game_aborted', {})

@socketio.on('reset_game')
def reset_game():
    player_games[session['user']['id']] = None
    