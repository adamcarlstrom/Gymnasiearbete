class Square {


    constructor(p) {
        // Skickar in pos, för att rutan ska veta var den är i arrayen. 
        this.pos = p
        this.food = false
        this.partOfSnake = null
    }

    getPos() {
        return this.pos
    }
}