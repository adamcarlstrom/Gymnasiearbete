from flask import Blueprint, render_template, request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import datetime, json, random, time
from my_server import socketio, socket_ids, search_games, player_games
from flask_socketio import SocketIO, emit, join_room, leave_room

game_bp = Blueprint('game_bp', __name__,
                        template_folder='templates', static_folder='static', static_url_path='/game/static')

# Global dictionary to hold the state of ongoing games
active_game_states = {}

def create_initial_state(p1_id, p2_id):
    """Generates the starting board for two players."""
    return {
        'p1': {
            'id': p1_id,
            'body': [[3, 1], [2, 1], [1, 1]], # Head is at index 0
            'dir': [1, 0],  # Moving right
            'last_moved_dir': [1, 0],  # Track physical direction
            'alive': True
        },
        'p2': {
            'id': p2_id,
            'body': [[17, 19], [18, 19], [19, 19]], 
            'dir': [-1, 0], # Moving left
            'last_moved_dir': [-1, 0],  # Track physical direction
            'alive': True
        },
        'food': [[10,10], [10,13],[13,10],[10,7],[7,10]], # Pre-place some food to start
        'grid_size': 21,
        'start_time': time.time()
    }
    
def game_loop(room_id, db_path):
    # The authoritative server physics loop
    game = active_game_states.get(room_id)
    grid_size = game['grid_size']

    # Run the loop as long as the game exists and both players are alive
    while game and game['p1']['alive'] and game['p2']['alive']:
        
        # 1. Move both snakes
        for player_key in ['p1', 'p2']:
            player = game[player_key]
            head = player['body'][0]
            direction = player['dir']

            # Calculate new head position
            new_head = [head[0] + direction[0], head[1] + direction[1]]

            # Check Wall Collisions
            if (new_head[0] < 0 or new_head[0] >= grid_size or
                new_head[1] < 0 or new_head[1] >= grid_size):
                player['alive'] = False
                continue

            # Move snake (insert new head)
            player['body'].insert(0, new_head)
            player['last_moved_dir'] = direction

            # Check Food Collision
            if new_head in game['food']:
                game['food'].remove(new_head)
                # Generate new food that isn't inside any snake
                while True:
                    new_food = [random.randint(0, grid_size - 1), random.randint(0, grid_size - 1)]
                    if new_food not in game['p1']['body'] and new_food not in game['p2']['body'] and new_food not in game['food']:
                        game['food'].append(new_food)
                        break
            else:
                # Pop the tail if no food eaten
                player['body'].pop()

        # 2. Check Snake-to-Snake and Self Collisions
        p1_head = game['p1']['body'][0]
        p2_head = game['p2']['body'][0]

        # Self collision
        if p1_head in game['p1']['body'][1:]: game['p1']['alive'] = False
        if p2_head in game['p2']['body'][1:]: game['p2']['alive'] = False

        # Opponent collision
        if p1_head in game['p2']['body']: game['p1']['alive'] = False
        if p2_head in game['p1']['body']: game['p2']['alive'] = False

        # 3. Broadcast State or Game Over
        if game['p1']['alive'] and game['p2']['alive']:
            # Send exactly what game.js needs to render
            socketio.emit('game_state_update', {
                'p1': {'body': game['p1']['body'], 'id': game['p1']['id']},
                'p2': {'body': game['p2']['body'], 'id': game['p2']['id']},
                'food': game['food'],
                'time': int(time.time() - game['start_time'])
            }, to=room_id)
        else:
            if not game['p1']['alive'] and not game['p2']['alive']:
                # Both died on the same tick - it's a tie
                winner_id = None
            else: # Game over logic
                winner_id = game['p2']['id'] if not game['p1']['alive'] else game['p1']['id']
                
                
            duration = int(time.time() - game['start_time'])
            p1_score = len(game['p1']['body']) - 3
            p2_score = len(game['p2']['body']) - 3
                
            # Send both the winner and the current user's ID to the room
            socketio.emit('game_over', {
                'winner_id': winner_id
            }, to=room_id)
            
            try:
                conn = create_connection(db_path)
                cur = conn.cursor()
                cur.execute(
                    '''INSERT INTO games_history 
                       (player1_id, player2_id, winner_id, date, duration, score_player1, score_player2) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                    (game['p1']['id'], game['p2']['id'], winner_id, datetime.datetime.now(), duration, p1_score, p2_score)
                )
                conn.commit()
                conn.close()
                print(f"Game saved successfully. Score: {p1_score}-{p2_score}, Duration: {duration}s")
            except Exception as e:
                print(f"Failed to save game to database: {e}")
            finally:
                if conn:
                    conn.close()
            # Clean up the game state from memory
            del active_game_states[room_id]
            break

        # Tick rate: 2.5 FPS (0.5 seconds per frame)
        socketio.sleep(0.5)



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
    # print('try to return')
    # return "Something"

# @socketio.on('send_snake')
# def send_snake(data):
#     #skickar all snake info till den andra användarn
#     socket_id=0
#     try:
#         print(session['user']['id'])
#         print(player_games)
#         print(player_games[session['user']['id']])
#         print(player_games[session['user']['id']]['opponent_id'])
#         print(socket_ids)
#         print(socket_ids[player_games[session['user']['id']]['opponent_id']])
#         socket_id = socket_ids[player_games[session['user']['id']]['opponent_id']]
#     except:
#         print(session['user']['username'] +'################################################ error med session game')
#         emit('game_aborted',{})
#     if (socket_id != None or socket_id != 0): 
#         print(session['user']['username'] +'################################################ sending snake data')
#         emit('receive_snake',
#             data, to=socket_id)

# @socketio.on('snake_died')
# def snake_died(data):
#     #användare som skickar detta förlora
#     print(session['user']['username'] +'############################################### snake dog')
#     #skickar till motståndaren
#     print('scokets')
#     print(socket_ids)
#     print('games')
#     print(player_games)
#     try:
#         emit('snake_win',{},to=socket_ids[player_games[session['user']['id']]['opponent_id']])
#     except:
#         print('could not reach opponent too bad')
#     conn = create_connection(current_app.config['DB_PATH'])
#     cur = conn.cursor()
#     cur.execute('INSERT INTO games_history (sender_id,receiver_id,winner_id, date) VALUES (?,?,?,?) ', (session['user']['id'],player_games[session['user']['id']]['opponent_id'],player_games[session['user']['id']]['opponent_id'],datetime.datetime.now()))
#     conn.commit()
#     player_games[session['user']['id']] = None

# @socketio.on('snake_win')
# def snake_win(data):
#     #användare som skickar detta vann
#     print(session['user']['username'] +'############################################### snake vann')
#     player_games[session['user']['id']] = None
    
@socketio.on('ready_up')
def ready_up(data):
    print('ready up ' + str(data))
    info = data
    try:
        emit('player_2_ready', (info), to=socket_ids[player_games[session['user']['id']]['opponent_id']])
    except:
        #andra personen inte inne i hemsidan än så chilla typ
        # print('chill')
        flash('Opponent not loaded in yet' , 'warning')
        emit('opponent_not_ready',{})
        
# @socketio.on('start_game')
# def start_game(data):
#     # print('game ready to start for both')
#     #båda redo att börja spela
#     try:
#         emit('start_game', {}, to=socket_ids[player_games[session['user']['id']]['opponent_id']])
#         emit('start_game', {})
#     except:
#         emit('game_aborted', {})

# @socketio.on('reset_game')
# def reset_game():
#     player_games[session['user']['id']] = None
    
@socketio.on('start_game')
def start_game(data):
    """Triggered when both players are ready."""
    user_id = session['user']['id']
    opponent_id = player_games[user_id]['opponent_id']
    
    # Create a consistent room ID regardless of who emits first
    # e.g., "game_4_12" where 4 and 12 are the user IDs
    room_id = f"game_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}"
    
    join_room(room_id)

    # Only initialize the state and the loop ONCE per room
    if room_id not in active_game_states:
        active_game_states[room_id] = create_initial_state(user_id, opponent_id)
        
        # Tell the clients to initialize their renderers
        socketio.emit('start_game', {}, to=room_id)
        # GRAB THE DB PATH HERE before losing the Flask application context
        db_path = current_app.config['DB_PATH']
        # Start the background physics loop
        socketio.start_background_task(game_loop, room_id,db_path)
    
@socketio.on('change_direction')
def handle_direction(data):
    """Receives inputs from SnakeController.js"""
    user_id = session['user']['id']
    opponent_id = player_games[user_id]['opponent_id']
    room_id = f"game_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}"
    
    new_dir = data['dir']
    
    if room_id in active_game_states:
        game = active_game_states[room_id]
        # Identify which player sent the input
        player_key = 'p1' if game['p1']['id'] == user_id else 'p2'
        current_dir = game[player_key]['last_moved_dir']  # Use last moved direction for accurate reversing logic
        
        # Prevent 180-degree reversing into own body
        # (Cannot send horizontal input if currently moving horizontally)
        moving_horizontally = current_dir[0] != 0
        wants_horizontal = new_dir[0] != 0
        
        if moving_horizontally != wants_horizontal:
            game[player_key]['dir'] = new_dir
            

# Tracks rooms in the pre-game "Ready Up" phase
staging_rooms = {}

def staging_loop(room_id,db_path):
    """Server-authoritative countdown for the staging phase."""
    room = staging_rooms.get(room_id)
    
    while room and room['time_left'] > 0:
        socketio.sleep(1)
        room['time_left'] -= 1
        
        # Broadcast the exact time left to both players
        socketio.emit('staging_timer', {'time_left': room['time_left']}, to=room_id)

        # Check if both players are ready
        players = list(room['players'].values())
        if len(players) == 2 and all(p['ready'] for p in players):
            # Both are ready! Transition to the actual game
            user_ids = list(room['players'].keys())
            
            # Initialize the physics game state
            if room_id not in active_game_states: # safety if game already exists
                active_game_states[room_id] = create_initial_state(user_ids[0], user_ids[1])
            
                # Tell clients to hide the modal and render the game
                socketio.emit('start_game', {}, to=room_id)
                # Start the physics loop and clean up staging
                socketio.start_background_task(game_loop, room_id,db_path)
            del staging_rooms[room_id]
            return

    # If the loop finishes and we haven't returned, someone didn't ready up in time
    if room_id in staging_rooms:
        socketio.emit('game_aborted', {'reason': 'Tiden gick ut.'}, to=room_id)
        del staging_rooms[room_id]

@socketio.on('join_staging')
def join_staging():
    """Triggered as soon as the /game page loads for a user."""
    user_id = session['user']['id']
    opponent_id = player_games[user_id]['opponent_id']
    room_id = f"game_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}"
    
    join_room(room_id)

    # Initialize the staging room if it doesn't exist
    if room_id not in staging_rooms:
        staging_rooms[room_id] = {
            'players': {},
            'time_left': 11 # 10 second countdown
        }
        db_path = current_app.config['DB_PATH']

        # Start the countdown task
        socketio.start_background_task(staging_loop, room_id, db_path)
        
    # Add this player to the staging room
    staging_rooms[room_id]['players'][user_id] = {'ready': False}
    
    # Broadcast current state so UI updates
    broadcast_staging_state(room_id)

@socketio.on('toggle_ready')
def toggle_ready():
    """Triggered when a user clicks the 'Spela' button."""
    user_id = session['user']['id']
    opponent_id = player_games[user_id]['opponent_id']
    room_id = f"game_{min(user_id, opponent_id)}_{max(user_id, opponent_id)}"
    
    if room_id in staging_rooms and user_id in staging_rooms[room_id]['players']:
        current_state = staging_rooms[room_id]['players'][user_id]['ready']
        staging_rooms[room_id]['players'][user_id]['ready'] = not current_state
        
        broadcast_staging_state(room_id)

def broadcast_staging_state(room_id):
    """Helper to send the ready status of all players to the room."""
    if room_id in staging_rooms:
        state = {str(uid): data['ready'] for uid, data in staging_rooms[room_id]['players'].items()}
        print(state)
        socketio.emit('staging_update', state, to=room_id)