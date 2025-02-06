//https://flask-socketio.readthedocs.io/en/latest/getting_started.html
let socket;
$(document).ready(function () {
    //initierar socket connection, id samt rum kopplat till socked id
    socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.emit('join', {})

    //kan användas för att hitta socketID också, men måste bli klar med socket connect först
    //console.log(socket.id); 

    //io.to('socket#id').emit('hey')
    socket.on('challenge_user', (data) => {
        console.log('challenge has been sent to you')
        console.log(data)
        $("#alerts").removeClass("d-none")
        $('#alerts_html').html(`
            <p>${formatting(data.sender_username)} skickade en utmaning till dig</p>
            <h6 id="timer">Tid kvar: 30</h6>
            <input type='hidden' value='${data.sender_id}' id='challenge_user_id'>
            <button class="button button-small mx-3" id="challenge_accept" onclick="challengeAccept()"><i class="bi bi-check-circle"></i></button>
            <button class="button button-small mx-3" id="challenge_deny"  onclick="challengeDeny()"><i class="bi bi-x-circle icon"></i></button>
        `)
        // Scrollar ned chatten. 
        //$("#messagesHolder").animate({ scrollTop: $('#messagesHolder').prop("scrollHeight") }, 1000)


        //något html för att visa en challenge med knapp för att antingen tacka ja eller nej
        //kan vara fint att visa ifall den andra tackade ja eller inte
        //bör vara smart att ha någon typ av timer som stänger av challenge efter viss stund samt gör så att man ej kan trycka på challenge knapp under denna tid
        setUpCountDown()
    })

    socket.on('challenge_denied', (data) => {
        //challenge you sent was denied
        console.log('challenge you sent was denied')
        timer_reset()
        $("#alerts").addClass("d-none")
    })

    socket.on('challenge_accepted', (data) => {
        //challenge you sent was accepted
        console.log('challenge you sent was accepted')
        clearInterval(myCountDown);
        $("#alerts").addClass("d-none")

        socket.emit('yourChallengeAccepted', {
            id : data.sender_id
        })

    })

    socket.on('goto_game',(data) => {
        window.location.replace("/game")
    })

    socket.on('search_challenge', (data) => {
        console.log(data)
        // socket.emit('yourChallengeAccepted', {
        //     id: data['sender_id']
        // })
        socket.emit('yourChallengeAccepted', {
            id : data.sender_id
        })

    })

})
function challengeAccept() {
    console.log('accepted')
    $("#alerts").addClass("d-none")
    clearInterval(myCountDown);
    challenge_user_id = parseInt($('#challenge_user_id').val())
    socket.emit('challengeAccepted', {
        id: challenge_user_id
    })
}
function challengeDeny() {
    //challenge denied    
    console.log('denied')
    $("#alerts").addClass("d-none")
    clearInterval(myCountDown);
    challenge_user_id = parseInt($('#challenge_user_id').val())
    console.log(challenge_user_id)
    socket.emit('challengeDeny', {
        id: challenge_user_id
    })
}

function challenge(receiver_id, reciever_username) {
    if(!timerStarted){
    console.log('challenge sent to : ' + reciever_username + " " + receiver_id)
    $("#alerts").removeClass("d-none")
    $('#alerts_html').html(`
            <p>Utmaningen har skickats till ${formatting(reciever_username)}</p>
            <h6 id="timer">Tid kvar: 30</h6>
            <input type='hidden' value='${receiver_id}' id='challenge_user_id'>
        `)
    //skickar challenge till användare med receiver_id som är den du chattar med
    socket.emit('challenge', {
        id: receiver_id
    })
    setUpCountDown()
    }else{
        console.log('ERROR Start new timer when timer already started')
        $('#alerts_error').html('Kan inte skicka, vänta tills timern är klar')
    }
}
