class Game {
    constructor(socket) {
        this.socket = socket
        this.fps = 40
        this.board = new Board(21)
        this.loop = setInterval(this.timer, 1000 / this.fps)
        this.speed = this.fps / 2
        this.counter = this.speed

        this.oponentX = -1
        this.oponentY = 0
        this.timeFromStart = 0
    }

    setOponentDirections(x, y) {
        console.log('setting new directions ' + x + " " + y)
        this.oponentX = x
        this.oponentY = y

    }

    setNewFoodPos(newFood) {
        if (newFood != null) { // Speglar matens position
            this.board.squares[440 - newFood].food = true
        }
    }

    timer = () => {
        this.timeFromStart += 1
        if (this.timeFromStart % 40 == 0) {
            //uppdatera timern eftersom 1 sekund har gått
            let timeInSeconds = Number(this.timeFromStart / this.fps)
            $('#gameTime').html(timeInSeconds + 's')
        }

        if (this.counter == this.speed) { // Ormar kan bara byta riktning vid en ruta, 
            //detta ska sedan baseras på ormens hastighet, beroende av en rutas storlek

            this.board.snakeUser.createDirections()
            console.log('opponent directions ' + this.oponentX + " " + this.oponentY)
            this.board.snakeOponent.createOponentDirections(this.oponentX, this.oponentY)
            this.counter = 0


            this.board.collisionSnakes()
            this.board.moveSnakes()
            if (this.board.snakeUser.isAlive == false || this.board.snakeOponent.isAlive == false) {
                this.clearTimer()
                $('#game_results').modal('show')
                if (this.board.snakeUser.isAlive == false) {
                    socket.emit('snake_died', {})
                    $('#results').html(`Du förlorade spelet`)
                    $('#results').addClass('bg-danger')
                } else {
                    $('#results').html(`Du vann spelet`)
                    $('#results').addClass('bg-success')
                }
            } else {
                this.board.draw()
                this.board.drawFood()
                this.board.drawSnakes()

                 this.socket.emit('send_snake', {
                     snake_x: this.board.snakeUser.directionX,
                     snake_y: this.board.snakeUser.directionY,
                     newFoodPos: this.board.newFoodSquarePos
                })
            }

            $('#lengthUser').html(this.board.snakeUser.occupiedSquares.length - 3)
            $('#lengthOponent').html(this.board.snakeOponent.occupiedSquares.length - 3)
        } else {
            this.counter++
        }
    }
    clearTimer() {
        clearInterval(this.loop)
        this.fps = Infinity
    }
}

