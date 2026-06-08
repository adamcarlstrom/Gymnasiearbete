// File that is no longer used anymore, but I want to keep it for reference. The game logic is now handled in the backend for better synchronization between players.


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