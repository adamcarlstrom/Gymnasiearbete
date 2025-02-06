import sqlite3
from flask import current_app
from my_server import config
def create_connection(db_file = config['DB_PATH']):
#lös detta så att man kan komma åt namn på databasen genom config
#def create_connection(db_file = current_app.config['DB_PATH']):
#def create_connection(db_file = 'database.db'):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except sqlite3.Error as e:
        print(e)

    return conn
