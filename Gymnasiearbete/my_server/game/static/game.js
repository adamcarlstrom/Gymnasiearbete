// Game previously ran in frontend but changed to ensure better synchronization between players.

class Game {
    constructor(socket) {
        this.socket = socket
        // this.fps = 40
        // this.board = new Board(21)
        // this.loop = setInterval(this.timer, 1000 / this.fps)
        // this.speed = this.fps / 2
        // this.counter = this.speed

        // this.oponentX = -1
        // this.oponentY = 0
        this.timeFromStart = 0
        this.canvas = document.getElementById("gameSpace");
        this.context = this.canvas.getContext("2d");
        this.gridSize = 21;
        this.resizeCanvas(); // Set initial size and squareSize based on current window size
        this.setupSocketListeners();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        this.colorsSet = false;
    }

    resizeCanvas() {
        // Calculate available space.
        // We leave 5% buffer on the width, and a 20% buffer on the height
        // to safely account for your top margin and any other UI elements.
        let availableWidth = window.innerWidth * 0.95;
        let availableHeight = window.innerHeight * 0.80; 

        // To keep the board a perfect square, take the smallest of the two safe dimensions.
        let displaySize = Math.min(availableWidth, availableHeight);
        
        // Ensure the size is evenly divisible by 21 to prevent blurry, sub-pixel rendering.
        displaySize = Math.floor(displaySize / this.gridSize) * this.gridSize;

        // Set the internal canvas resolution
        this.canvas.width = displaySize;
        this.canvas.height = displaySize;
        
        // Calculate the exact square size based on the precise canvas size
        this.squareSize = this.canvas.width / this.gridSize;
    }

    setupSocketListeners() {
        // This completely replaces old setInterval(this.timer) loop
        this.socket.on('game_state_update', (state) => {
            this.render(state);
        });

        // The server will now decide when the game is over
        this.socket.on('game_over', (data) => {
            $('#game_results').modal('show');
            
            let my_id = Number(document.getElementById("my_id").value);
            
            // Clear previous color classes to prevent mixing
            $('#results').removeClass('bg-success bg-danger bg-warning bg-secondary');

            if (data.winner_id === null) {
                // It's a tie
                $('#results').html(`Oavgjort! (Lika)`);
                $('#results').addClass('bg-secondary');
            } else if (data.winner_id === my_id) {
                // You won
                $('#results').html(`Du vann spelet`);
                $('#results').addClass('bg-success');
            } else {
                // You lost
                $('#results').html(`Du förlorade spelet`);
                $('#results').addClass('bg-danger');
            }
        });
    }
    render(state) {
        // 1. Wipe the canvas clean for the new frame
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Draw the checkered background grid
        this.drawBoard();

        // 3. Draw Player 1 (Blue)
        // state.p1.body is expected to be an array of coordinates: [[x, y], [x, y], ...]
        if (state.p1 && state.p1.body) {
            state.p1.body.forEach((segment, index) => {
                if(index == 0) {    
                    this.drawSquare(segment[0], segment[1], "#65A5FC");
                } else {
                    // Alternating colors based on index, just like your old logic
                    let color = index % 2 === 0 ? "#84cdee" : "#b9e2f5";
                    this.drawSquare(segment[0], segment[1], color);
                }
            });
        }

        // 4. Draw Player 2 (Yellow)
        if (state.p2 && state.p2.body) {
            state.p2.body.forEach((segment, index) => {
                if(index == 0) {
                    this.drawSquare(segment[0], segment[1], "#FFE751");
                } else {
                    // Alternating colors based on index, just like your old logic
                    let color = index % 2 === 0 ? "#ffe37a" : "#fff49b";
                    this.drawSquare(segment[0], segment[1], color);
                }
            });
        }

        // 5. Draw the Food
        if (state.food && Array.isArray(state.food)) {
            state.food.forEach(fruit => {
                // fruit is a coordinate pair like [x, y]
                this.drawFood(fruit[0], fruit[1]);
            });
        }

        // 6. Update the Scoreboard HTML
        // Subtracting 3 assumes the starting length of the snake is 3
        if (state.p1 && state.p2) {
            let my_id = Number(document.getElementById("my_id").value);

            if (state.p1.id === my_id) {
                // I am Player 1. My score is p1, opponent is p2.
                $('#lengthUser').html(state.p1.body.length - 3);
                $('#lengthOponent').html(state.p2.body.length - 3);
            } else {
                // I am Player 2. My score is p2, opponent is p1.
                $('#lengthUser').html(state.p2.body.length - 3);
                $('#lengthOponent').html(state.p1.body.length - 3);
            }
        }
        

        if (state.time !== undefined) {
            $('#gameTime').html(state.time + 's');
        }
        if (!this.colorsSet) {
            console.log("This happens only once to set player colors based on who is p1 and p2");
            let my_id = Number(document.getElementById("my_id").value);
            let opponent_id = Number(document.getElementById("opponent_id").value);
            if (state.p1.id === my_id) {
                console.log("I am player 1, setting my color to blue and opponent to yellow")
                document.getElementById("ui_my_name").style.backgroundColor = "#65A5FC";
                document.getElementById("lengthUser").style.backgroundColor = "#65A5FC";
                document.getElementById("ui_opponent_name").style.backgroundColor = "#FFE751";
                document.getElementById("lengthOponent").style.backgroundColor = "#FFE751";
            } else if (state.p2.id === my_id) {
                console.log("I am player 2, setting my color to yellow and opponent to blue")
                document.getElementById("ui_my_name").style.backgroundColor = "#FFE751";
                document.getElementById("lengthUser").style.backgroundColor = "#FFE751";
                document.getElementById("ui_opponent_name").style.backgroundColor = "#65A5FC";
                document.getElementById("lengthOponent").style.backgroundColor = "#65A5FC";
            }
            this.colorsSet = true; // Ensure we only set colors once
        }
    }

    drawBoard() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                let c = j % 2 === 0 ? "#9BFF7C" : "#8BE670";
                if (i % 2 === 0) {
                    c = j % 2 !== 0 ? "#9BFF7C" : "#8BE670";
                }
                this.context.fillStyle = c;
                this.context.fillRect(j * this.squareSize, i * this.squareSize, this.squareSize, this.squareSize);
            }
        }
    }

    drawSquare(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
    }

    drawFood(x, y) {
        let centerX = x * this.squareSize + this.squareSize / 2;
        let centerY = y * this.squareSize + this.squareSize / 2;

        // Food main body
        this.context.fillStyle = "#FC7777";
        this.context.beginPath();
        this.context.arc(centerX, centerY, this.squareSize / 2, 0, 2 * Math.PI, false);
        this.context.fill();

        // Food highlight/tint
        this.context.fillStyle = "#FBA296";
        this.context.beginPath();
        this.context.arc(x * this.squareSize + this.squareSize / 3, y * this.squareSize + this.squareSize / 3, this.squareSize / 4, 0, 2 * Math.PI, false);
        this.context.fill();
    }


    // setOponentDirections(x, y) {
    //     console.log('setting new directions ' + x + " " + y)
    //     this.oponentX = x
    //     this.oponentY = y

    // }

    // setNewFoodPos(newFood) {
    //     if (newFood != null) { // Speglar matens position
    //         this.board.squares[440 - newFood].food = true
    //     }
    // }

    // timer = () => {
    //     this.timeFromStart += 1
    //     if (this.timeFromStart % 40 == 0) {
    //         //uppdatera timern eftersom 1 sekund har gått
    //         let timeInSeconds = Number(this.timeFromStart / this.fps)
    //         $('#gameTime').html(timeInSeconds + 's')
    //     }

    //     if (this.counter == this.speed) { // Ormar kan bara byta riktning vid en ruta, 
    //         //detta ska sedan baseras på ormens hastighet, beroende av en rutas storlek

    //         this.board.snakeUser.createDirections()
    //         console.log('opponent directions ' + this.oponentX + " " + this.oponentY)
    //         this.board.snakeOponent.createOponentDirections(this.oponentX, this.oponentY)
    //         this.counter = 0


    //         this.board.collisionSnakes()
    //         this.board.moveSnakes()
    //         if (this.board.snakeUser.isAlive == false || this.board.snakeOponent.isAlive == false) {
    //             this.clearTimer()
    //             $('#game_results').modal('show')
    //             if (this.board.snakeUser.isAlive == false) {
    //                 socket.emit('snake_died', {})
    //                 $('#results').html(`Du förlorade spelet`)
    //                 $('#results').addClass('bg-danger')
    //             } else {
    //                 $('#results').html(`Du vann spelet`)
    //                 $('#results').addClass('bg-success')
    //             }
    //         } else {
    //             this.board.draw()
    //             this.board.drawFood()
    //             this.board.drawSnakes()

    //              this.socket.emit('send_snake', {
    //                  snake_x: this.board.snakeUser.directionX,
    //                  snake_y: this.board.snakeUser.directionY,
    //                  newFoodPos: this.board.newFoodSquarePos
    //             })
    //         }

    //         $('#lengthUser').html(this.board.snakeUser.occupiedSquares.length - 3)
    //         $('#lengthOponent').html(this.board.snakeOponent.occupiedSquares.length - 3)
    //     } else {
    //         this.counter++
    //     }
    // }
    // clearTimer() {
    //     clearInterval(this.loop)
    //     this.fps = Infinity
    // }
}

