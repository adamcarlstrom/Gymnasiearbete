from flask import Blueprint, render_template, request, flash, url_for, redirect, session, abort, current_app
from my_server.databasehandler import create_connection
import datetime
import json
from my_server import socketio, socket_ids, player_games
from flask_socketio import SocketIO, emit, join_room, leave_room

socket_bp = Blueprint('socket_bp', __name__,
                        template_folder='templates', static_folder='static', static_url_path='/socket/static')

# Om meddelandet ska skickas till samtliga rum byts "to=room" ut mot "broadcast=True"

@socketio.on('connect')
def on_connect():
    if 'logged_in' in session and session['logged_in'] == True:
        print('#####################################')
        print('Client connected')
        currentSocketId = request.sid
        print(session['user']['username'] + ' ' + currentSocketId)
        socket_ids[session['user']['id']] = currentSocketId
            #koppla användare som är inloggade till specifika rum med deras socketID som rum namn

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected or connected to other page or reloaded')
    try:
        print(session['user']['username'])
        socket_ids[session['user']['id']] = None
    except:
        print('User logged out but i dont know what to do about it')
    if(session['page'] != 'game'):
        print('user not in game')
        
    #     player_games[session['user']['id']] = None


@socketio.on('join')
def on_join(data):
    if 'logged_in' in session and session['logged_in'] == True:
        join_room(socket_ids[session['user']['id']])


@socketio.on('leave')
def on_leave(data):
    session.pop('room', None)
    print('Lämnar rummet')
    leave_room(data['room'])
    
@socketio.on('challenge')
def challenge(data):
    print(session['user']['username'] + '######################## challenge')
    userLoggedIn = True
    print(data)
    try:
        print(socket_ids[data['id']])
        if(socket_ids[data['id']] == None):
            print('userNotLoggedIn')
            userLoggedIn = False
    except:
        print('userNotLoggedIn')
        userLoggedIn = False
    if(userLoggedIn):
        socketio.emit('challenge_user', {
            'sender_id': session['user']['id'],
            'sender_username': session['user']['username'],
            'receiver_id': data['id']
        },to=socket_ids[data['id']])

@socketio.on('challengeDeny')
def challenge_deny(data):
    print('challenge denied')
    print(data)
    emit('challenge_denied', {
    'none' : None
    }, to=socket_ids[data['id']])

@socketio.on('challengeAccepted')
def challenge_accepted(data):
    print(session['user']['username'] + '################################ challenge accepted')
    print(session['user']['username'] +'################################ define game')
    player_games[session['user']['id']] = {
        'opponent_id': data['id']
    }
    #berättar till andra användaren att man accepterat deras request
    emit('challenge_accepted', {
        'sender_id' : session['user']['id']
    }, to=socket_ids[data['id']])
    #går till game
    emit('goto_game', {
    }, to=socket_ids[session['user']['id']])

@socketio.on('yourChallengeAccepted')
def your_challenge_accepted(data):
    print(data)
    print(session['user']['username'] +'yourChallengeAccepted no Ajax define game')
    player_games[session['user']['id']] = {
        'opponent_id': data['id']
    }
    emit('goto_game', {
    }, to=socket_ids[session['user']['id']])