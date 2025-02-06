class Config:
    SECRET_KEY = 'hemlignyckel'
    DB_PATH = 'database.db'

    UPLOAD_FOLDER = 'my_server/static/uploads/'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    #app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER