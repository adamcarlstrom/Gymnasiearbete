
from flask import Flask
#behöver pip installa detta
from flask_session import Session
from my_server.config import Config
from flask_bcrypt import Bcrypt
#se till att venv har flask_socketio 
from flask_socketio import SocketIO

app = Flask(__name__)
socket_ids = {}
search_games = []
player_games={}

app.config.from_object(Config)
config = app.config
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
socketio = SocketIO(app, manage_session=False)

#importera alla blueprints här
# from blueprint.blueprint import blueprint_bp
from .errorhandler.errorhandler import error_bp
from .auth.auth import auth_bp
from .profiles.profiles import profiles_bp
from .search.search import search_bp
from .messages.messages import messages_bp
from .game.game import game_bp
from .socket.socket import socket_bp


#registrera alla blueprints här
# app.register_blueprint(blueprint_bp)
app.register_blueprint(error_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(profiles_bp)
app.register_blueprint(search_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(game_bp)
app.register_blueprint(socket_bp)

bcrypt = Bcrypt(app)
