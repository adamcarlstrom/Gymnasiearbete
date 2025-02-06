class Snake {
    constructor(color1, color2) {
        // this.socket = socket

        this.occupiedSquares = []

        this.preDirectionX = 0
        this.preDirectionY = 0
        this.directionY = 0
        this.directionX = 0
        this.isAlive = true

        this.color1 = color1
        this.color2 = color2

        this.playSound = true

        this.registerInput()
    }

    occupySquare(square) {
        this.occupiedSquares.push(square)
        square.partOfSnake = this
    }

    registerInput() {
        document.addEventListener('keydown', (event) => {
            var name = event.key

            // Om man åker åt håll x, skall man inte kunna åka i motsat riktning. 
            if (name == 'a' && this.directionX != 1) {
                this.preDirectionY = 0;
                this.preDirectionX = -1;
            } else if (name == 'd' && this.directionX != -1) {
                this.preDirectionY = 0;
                this.preDirectionX = 1;

            } else if (name == 'w' && this.directionY != 1) {
                this.preDirectionX = 0;
                this.preDirectionY = -1;

            } else if (name == 's' && this.directionY != -1) {
                this.preDirectionX = 0;
                this.preDirectionY = 1;
            }
            // if (this.socket != null){
            // //emit direction här
            //     console.log('Send snake')
            //     this.socket.emit('send_snake', {
            //         snake_x: this.directionX,
            //         snake_y: this.directionY
            //         //     newFoodPos: this.board.newFoodSquarePos
            //     })
            // }
        }, false)
    }

    createOponentDirections(x, y) {
        this.preDirectionX = x
        this.preDirectionY = y
        this.createDirections()
    }

    createDirections() {
        this.directionX = this.preDirectionX
        this.directionY = this.preDirectionY
    }

    static draw(squareX, squareY, color) {
        const canvas = document.getElementById("gameSpace")
        const context = canvas.getContext("2d")

        context.fillStyle = color
        context.fillRect(squareX * Board.getSquareSize(), squareY * Board.getSquareSize(), Board.getSquareSize(), Board.getSquareSize())
    }

    move() {
        let lastSquare = this.occupiedSquares.shift()
        lastSquare.partOfSnake = null
    }

    getHeadSquare() {
        return this.occupiedSquares[this.occupiedSquares.length - 1]
    }

    getLength() {
        return this.occupiedSquares.length
    }

    getLastSquare() {
        return this.occupiedSquares[0]
    }

    eatFood() {
        this.occupiedSquares.splice(0, 0, this.getLastSquare())
    }

    selfCollision() {
        for (let i = 0; i < this.occupiedSquares.length - 1; i++) {
            if (this.getHeadSquare() == this.occupiedSquares[i]) {
                this.die()
            }
        }
    }

    collision(snake) {
        for (let i = 0; i < snake.occupiedSquares.length; i++) {
            for (let j = 0; j < this.occupiedSquares.length; j++) {
                if (this.getHeadSquare() == snake.occupiedSquares[i]) {
                    this.die()
                }
            }
        }
    }

    die() {
        if (this.playSound == true) {
            this.playSound = false
            let audio = new Audio("../static/sounds/Minecraft Death.mp3")
            audio.play()
        }


        console.log('Denna orm har blivit slaktad. ')
        this.isAlive = false
        //måste lösa att detta inte sker 21 gånger
    }

    getOccupiedSquares() {
        return this.occupiedSquares
    }
}