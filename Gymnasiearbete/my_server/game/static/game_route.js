var game_timer_started = false
$(document).ready(() => {
    $("footer").hide();
//     let player_1_ready = false
//     let player_2_ready = false
//     let game
//     // $('#game_start').addClass('d-none')
//     //     x = 0
//     //     y = 0
//     //     game = new Game(socket)

//     $("#game_start").modal('show')
//     $("#game_results").modal('hide')
//     $("#gameHubButton").click(() => {
//         window.location.replace('game_hub')
//     })



//     $('#ready_up').click(() => {
//         // man är redo för att börja spela
//         // implementera timer för att dem ska starta också
//         player_1_ready = !player_1_ready
//         $('#player_1_ready').removeClass()
//         if (player_1_ready) {
//             game_timer_started = true
//             resetTimer(myCountDown);
//             start_game_timer()
//             $('#player_1_ready').addClass('bi bi-check-square-fill text-success')
//         } else {
//             game_timer_started = false
//             resetTimer(myCountDown);
//             $('#player_1_ready').addClass('bi bi-x-square-fill text-danger')
//         }
//         if (player_1_ready && player_2_ready) {
//             //båda redo börja spela
//             socket.emit('start_game', {})
//         } else {
//             socket.emit('ready_up', (player_1_ready))
//         }
//     })

//     socket.on('player_2_ready', (data) => {
//         player_2_ready = data
//         $('#player_2_ready').removeClass()
//         if (player_2_ready) {
//             resetTimer(myCountDown);
//             start_game_timer()
//             $('#player_2_ready').addClass('class="bi bi-check-square-fill text-success')
//         } else {
//             resetTimer(myCountDown);
//             $('#player_2_ready').addClass('class="bi bi-x-square-fill text-danger')
//         }
//         if (player_1_ready && player_2_ready) {
//             //båda redo börja spela
//             socket.emit('start_game', {})
//         }
//     })

//     socket.on('opponent_not_ready', (data) => {
//         player_1_ready = false
//         $('#player_1_ready').removeClass()
//         $('#player_1_ready').addClass(' bi bi-file-x-fill')

//     })

//     socket.on('game_aborted', (data) => {
//         // no game
//         aborted_game()
//     })

//     socket.on('start_game', (data) => {
//         game_timer_started = false
//         resetTimer(myCountDown);
//         console.log('game started')
//         $("#game_start").modal('hide')

//         game = new Game(socket)
//         let snake = new Snake(socket);
//     })

//     // socket.on('receive_snake', (data) => {
//     //     console.log(data)
//     //     let x = -data.snake_x
//     //     let y = -data.snake_y
//     //     game.setOponentDirections(x, y)
//     //     game.setNewFoodPos(data.newFoodPos)
//     // })

//     socket.on('snake_win', () => {
//         console.log('game won')
//         game.clearTimer()
//         $('#game_results').modal('show')
//         $('#results').html(`Du vann spelet`)
//         $('#results').addClass('bg-success')
//         //game.board.snakeOpponent.isAlive = false
//         socket.emit('snake_win', {})
//         //window.location('/game_hub')
//     })

    $('#rematch').click(() => {
        //skicka invite till samma spelare 
        opponent_id = $('#opponent_id').val()
        opponent_name = $('#opponent_name').val()
        console.log('returmatch mot : ' + window.opponent_id)
        challenge(Number(window.opponent_id), window.opponent_name)
    })

    // Automatically join the staging room when the page loads
    socket.emit('join_staging');
    $("#game_start").modal('show');
    $("#game_results").modal('hide');

    $("#gameHubButton").click(() => {
        window.location.replace('game_hub');

    });

    // 1. Send intent to server
    $('#ready_up').click(() => {
        socket.emit('toggle_ready');
        $('#player_1_ready').addClass('bi bi-check-square-fill text-success')
    });

    // 2. Listen for state updates (who is ready?)
    socket.on('staging_update', (state) => {
        let my_id = document.getElementById("my_id").value;
        let opponent_id = document.getElementById("opponent_id").value;
        // Update My UI
        $('#player_1_ready').removeClass()
        if (state[my_id]) {
            $('#player_1_ready').addClass('bi bi-check-square-fill text-success');
        } else {
            $('#player_1_ready').addClass('bi bi-x-square-fill text-danger');
        }

        // Update Opponent UI (check if they have joined and are ready)
        $('#player_2_ready').removeClass()
        if (state[opponent_id]) {
            $('#player_2_ready').addClass('bi bi-check-square-fill text-success');
        } else {
            $('#player_2_ready').addClass('bi bi-x-square-fill text-danger');
        }
    });

    // 3. Listen for the authoritative server timer
    socket.on('staging_timer', (data) => {
        $('#timer').html('Tid kvar att svara: ' + data.time_left + 's');
    });

    // 4. Handle aborts
    socket.on('game_aborted', (data) => {
        $('#game_start').modal('hide');
        $('#results').html(`Spel avbröts. ` + (data.reason || ''));
        $('#results').removeClass('bg-success bg-danger').addClass('bg-secondary');
        $('#game_results').modal('show');
    });

    // 5. Start the game (The start_game listener we set up earlier remains the same)
    socket.on('start_game', (data) => {
        console.log('Server initialized game');
        $("#game_start").modal('hide');
        
        // Initialize the renderer and input controller
        let game = new Game(socket);
        let controller = new Snake(socket);
    });
});

// var game_countdown;
// function start_game_timer() {
//     var start = Date.now()
//     time_to_answer = 10 //sek
//     start += time_to_answer * 1000;
//     $('#timer').html('Tid kvar att svara: ' + time_to_answer)
//     game_countdown = setInterval(function () {
//         console.log('Timer interval')
//         var now = Date.now()
//         var timeleft = Math.round((start - now) / 1000);
//         $('#timer').html('Tid kvar att svara: ' + timeleft)
//         if (timeleft <= 0) {
//             //timer klar
//             console.log('Timer finished')
//             clearInterval(game_countdown);
//             aborted_game()
//         }
//     }, 1000)
// }

// function resetTimer() {
//     clearInterval(game_countdown)
//     $('#timer').html('Tid kvar att svara: . . .')
// }

function aborted_game() {
    console.log('aborted game')
    $('#results').html(`Spel avbröts`)
    $('#results').addClass('bg-secondary')
    $('#game_results').modal('show')
    game_timer_started = false
    resetTimer(myCountDown);
    this.game.clearTimer()
    socket.emit('reset_game', {})
}