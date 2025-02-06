from my_server import app, socketio

if __name__ == '__main__':
    #app.run('0.0.0.0', 5000, debug=True)
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)

#nu körs run på localhost:5000
#mdbootstrap.com