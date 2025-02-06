class Board {

    constructor(size) {
        this.size = size
        this.squares = []

        this.create()
        // Alternate används för att ändra färg på ormen när den rör sig. 
        this.alternate = true

        this.snakeUser = new Snake("#84cdee", "#b9e2f5")
        this.generateSnake(this.snakeUser, 39, 1) // Orm, position, direktion

        this.snakeOponent = new Snake("#ffe37a", "#fff49b")
        this.generateSnake(this.snakeOponent, 401, -1)

        this.newFoodSquarePos = null
    }

    // Används för att göra brädet responsivt till skärmen. 
    static getSquareSize() { // Tar gånger 0.79 eftersom nav-baren är 21% bred. 
        return window.innerWidth * 0.79 > window.innerHeight ? Math.round(window.innerHeight / 22.5) : Math.round(window.innerWidth * 0.79 / 21)
    }

    getSquare(s) {
        return this.squares[s]
    }

    create() { // Skapar brädet med rutor. 
        for (let i = 0; i < this.size * this.size; i++) {
            let s = new Square(i)
            if (i == 8 + this.size * 8 || i == 12 + this.size * 8 || i == 10 + this.size * 10 || i == 8 + this.size * 12 || i == 12 + this.size * 12) {
                s.food = true
            }
            this.squares.push(s)
        }
    }

    draw() { // Ritar ut brädet. 
        const canvas = document.getElementById("gameSpace")
        const context = canvas.getContext("2d")

        // När man kallar denna draw för board() så resettas hela canvas. 
        context.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let c = j % 2 == 0 ? "#9BFF7C" : "#8BE670"
                // Den ändrar vilken färg som skall vara först, för att alternera. 
                if (i % 2 == 0) {
                    c = j % 2 != 0 ? "#9BFF7C" : "#8BE670"
                }
                context.fillStyle = c
                context.fillRect(j * Board.getSquareSize(), i * Board.getSquareSize(), Board.getSquareSize(), Board.getSquareSize())
            }
        }
    }

    drawSnakes() {
        const canvas = document.getElementById("gameSpace")
        const context = canvas.getContext("2d")
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.squares[i * this.size + j].partOfSnake != null) {
                    let currentSnake = this.squares[i * this.size + j].partOfSnake

                    let c = j % 2 == 0 ? currentSnake.color1 : currentSnake.color2
                    // Den ändrar vilken färg som skall vara först, för att alternera. 
                    if (i % 2 == 0) {
                        c = j % 2 != 0 ? currentSnake.color1 : currentSnake.color2
                    }

                    if (this.alternate == true) {
                        if (c == currentSnake.color1) {
                            c = currentSnake.color2
                        } else if (c == currentSnake.color2) {
                            c = currentSnake.color1
                        }
                    }

                    Snake.draw(i, j, c)
                }
            }
        }
        this.alternate = !this.alternate
    }

    moveSnake(snake) {
        if(snake.isAlive){
            let direction = snake.directionY

            if (snake.directionX != 0) {
                direction = this.size * snake.directionX
            }

            if (direction != 0) {
                snake.occupySquare(this.getSquare(snake.getHeadSquare().getPos() + direction))
                snake.move()
            }
        }
    }

    generateSnake(snake, i, direction) {
        snake.occupySquare(this.getSquare(i))
        snake.occupySquare(this.getSquare(i + direction * 21))
        snake.occupySquare(this.getSquare(i + direction * 42))

        snake.preDirectionX = direction
    }

    moveSnakes() {
        this.moveSnake(this.snakeUser)
        this.moveSnake(this.snakeOponent)
    }

    drawFood() {
        const canvas = document.getElementById("gameSpace")
        const context = canvas.getContext("2d")
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.squares[i * this.size + j].food == true) {
                    Food.draw(i, j)
                }
            }
        }
    }

    foodCollision(snake) {
        for (let i = 0; i < this.squares.length; i++) {
            if (this.squares[i].food == true && this.squares[i].partOfSnake == snake) {
                snake.eatFood()
                this.squares[i].food = false

                if (snake == this.snakeUser) {
                    this.newFoodSquarePos = this.generateFood(1)
                }

                let audio = new Audio("../static/sounds/Minecraft Eating.mp3")
                audio.play()
            }
        }
    }

    collisionSnakes() {
        this.newFoodSquarePos = null
        this.collision(this.snakeUser)
        this.snakeUser.collision(this.snakeOponent)
        this.snakeUser.selfCollision()
        this.foodCollision(this.snakeUser)

        this.collision(this.snakeOponent)
        this.snakeOponent.collision(this.snakeUser)
        this.snakeOponent.selfCollision()
        this.foodCollision(this.snakeOponent)
    }

    generateFood(a) {
        for (let i = 0; i < a; i++) {
            do {
                var randomSquare = this.squares[Math.round(Math.random() * this.squares.length)]
            } while (randomSquare.food == true || randomSquare.partOfSnake != null)
            randomSquare.food = true
            return randomSquare.getPos()
        }
        return null
    }

    collision(snake) {
        if(snake.isAlive){
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    let direction = snake.directionY

                    if (snake.directionX != 0) {
                        direction = this.size * snake.directionX
                    }
                    if (snake.getHeadSquare().getPos() + direction < 0 || snake.getHeadSquare().getPos() + direction > this.squares.length) {
                        snake.die()
                        return
                    } // Gör return för att avbryta metoden. 

                    // + 1 för att kollision med top ska fungera rätt, utan den hade man kolliderat med kanten en ruta för tidigt. 
                    let pos = snake.getHeadSquare().getPos() + 1
                    while (pos > this.size) {
                        pos -= this.size
                    }

                    //Detta kollar kollision med y axel på brädet. 
                    //pos + direction == this.size + 1, det finns + ett för att kompensera för den tillagda ettan ovan. 
                    if (pos + direction == this.size + 1 || pos + direction == 0) {
                        snake.die()
                        return
                    }
                }
            }
        }
    }


}