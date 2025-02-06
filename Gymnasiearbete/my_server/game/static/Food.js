class Food {
    constructor() {

    }

    static draw(squareX, squareY) {
        const canvas = document.getElementById("gameSpace")
        const context = canvas.getContext("2d")

        // Food body
        context.fillStyle = "#FC7777"
        context.beginPath()
        context.arc(squareX * Board.getSquareSize() + Board.getSquareSize() / 2, squareY * Board.getSquareSize() + Board.getSquareSize() / 2, Board.getSquareSize() / 2, 0, 2 * Math.PI, false)
        context.fill()

        // Food tint
        context.beginPath()        
        context.fillStyle = "#FBA296"
        context.arc(squareX * Board.getSquareSize() + Board.getSquareSize() / 3, squareY * Board.getSquareSize() + Board.getSquareSize() / 3, Board.getSquareSize() / 4, 0, 2 * Math.PI, false)
        context.fill()
    }
}