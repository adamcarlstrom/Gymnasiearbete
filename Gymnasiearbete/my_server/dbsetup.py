from databasehandler import create_connection
import sqlite3
from my_server import config

## ehm typ funkar inte efter att sockets har imlementerats
# byt bara config och ta bort import from my server problem solved
conn = create_connection(config['DB_PATH'])
cur = conn.cursor()

cur.execute('DROP TABLE IF EXISTS users')
cur.execute('DROP TABLE IF EXISTS games_history')
cur.execute('DROP TABLE IF EXISTS messages')
cur.execute('DROP TABLE IF EXISTS sockets')

cur.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    description TEXT,
    profile_picture TEXT, 
    creation_date TEXT
)''')

#ehm är status typ som read_by_reciever??

cur.execute('''
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER,
    content TEXT NOT NULL,  
    date TEXT, 
    status INTEGER, 
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id), 
    PRIMARY KEY("id" AUTOINCREMENT)
)''')

cur.execute('''
CREATE TABLE IF NOT EXISTS games_history (
    id INTEGER PRIMARY KEY,
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    winner_id REFERENCES users(id)
)''')

cur.execute('''
CREATE TABLE IF NOT EXISTS sockets (
    id INTEGER PRIMARY KEY,
    socket_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id)
)
''')

print('Success')
conn.commit()
