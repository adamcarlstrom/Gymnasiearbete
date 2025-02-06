let currentChatId;
let isChatOpen = false;

$(document).ready(function () {
    //socket connect grej
    $("#chat").hide()
    // $("#messageSend").click(() => {
    //     sendMessage()
    //     $("#messageContent").val('')
    //     console.log('Send: ' + currentChatId)
    //     for (let i = 0; i < 10; i++) { // Körs 10 gånger för att det skall uppdateras
    //         getChatHistory(currentChatId)
    //     }

    //     $("#messagesHolder").animate({ scrollTop: $('#messagesHolder').prop("scrollHeight") }, 1000)
    // })

    if ($('#active_page').val() == 'messages') {
        //skriv ut alla kontakter
        //skapa länk till deras chatter som ska vara en ajax
        search_messages()
    }

    if ($('#active_page').val() == 'search_users' || $('#active_page').val() == 'game_hub') {
        search_users()
    }


    //$("#searchContacts").keyup(searchContacts)
    $("#searchUsersBox").keyup(search_users)
    $('#searchContactsBox').keyup(search_messages)
    $('#searchGame').click(searchGame)

    $('#navButton').click(() => {
        const element = document.querySelector('#sidebar-navigation')

        if (element.style.display == 'inline') {
            element.style.display = 'none'
        } else {
            element.style.display = 'inline'
        }
    })
})
function searchGame() {
    $.ajax({
        type: "POST",
        url: "/searchGame",
        data: JSON.stringify(),
        headers: { 'Content-Type': 'application/json' },
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            if (data.status) {
                //typ börja game
                window.location.replace("/game")
            }
        }
    })
}
function search_messages() {
    search($('#searchContactsBox').val())
}

function showChat() {
    $("#chat").show()
    $("#chat").addClass("show-chat")
    $("#content1").hide()
    $("#content2").hide()
    $("#footer").hide()

    window.scrollTo(0, 0)
}

function writeOutContacts(contacts, messages) {
    len = contacts.length
    let print = ''
    for (let i = 0; i < len; i++) {
        let message;
        let notification = ""
        if (!messages[i][0]) {
            message = ""
        } else {
            message = messages[i][0]
            if (messages[i][1] == 0) {
                //unread message
                notification = " border-unread"
            }
        }
        print += `
        <div class="message-person gray-box d-flex flex-row contactOpenChat ${notification}" id="${contacts[i][0]}" value="${contacts[i][0]}" onclick="openChatFunction()">
        <img src="../static/uploads/${contacts[i][3]}" alt="Profile"
             class="display-horizontal profile-image center-vertical">
           <div class="center-vertical">
             <div class="center-vertical" style="margin-left: 0.3rem">
               <h6><b>${formatting(contacts[i][1])}</b></h6>
               <div id="last_message_from_${contacts[i][0]}">${formatting(message)}</div>
             </div>
           </div>
         </div>`
    }
    $('.contactsBox').html(print)
}
function openChatFunction() {
    window.isChatOpen = true;
    //console.log($(this).val())
    //öppnar chatt man tryckt på
    //console.log(event.currentTarget.id)
    currentChatId = event.currentTarget.id
    //console.log(currentChatId)
    getChatHistory(event.currentTarget.id)
    connecting_chat(event.currentTarget.id);
    showChat()
}


function search(search) {
    $.ajax({
        type: "POST",
        url: "/search",
        data: JSON.stringify(search),
        headers: { 'Content-Type': 'application/json' },
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            //ok men hur parsar man
            //users = JSON.parse(data)
            users = data
            //return till andra funktioner för att skriva ut beroende på hemsida
            if ($('#active_page').val() == 'search_users') {
                showUsers(users)
            } else if ($('#active_page').val() == 'game_hub') {
                showPlayers(users)
            }
            else if ($('#active_page').val() == 'messages') {
                let contacts
                $.ajax({
                    type: "POST",
                    url: "/search_contacts",
                    data: JSON.stringify(users),
                    headers: { 'Content-Type': 'application/json' },
                    dataType: "json",
                    contentType: "application/json",
                    success: (c) => {
                        contacts = c
                    }
                })

                $.ajax({
                    type: "POST",
                    url: "/get_last_message",
                    data: JSON.stringify(users),
                    headers: { 'Content-Type': 'application/json' },
                    dataType: "json",
                    contentType: "application/json",
                    success: (messages) => {
                        writeOutContacts(contacts, messages)
                    }
                })



            }
        }
    })
}

function search_users() {
    console.log('search_users')
    console.log($('#searchUsersBox').val())
    search($('#searchUsersBox').val())
}

function getChatHistory(id) {
    $.ajax({
        type: "POST",
        url: "/get_chat_history",
        data: JSON.stringify(id),
        headers: { 'Content-Type': 'application/json' },
        dataType: "json",
        contentType: "application/json",
        success: (messages) => {
            createChat(messages)
        }
    })
}

//okej martin men hur har du stavat så fel, fan det ksk var jag... hoppas inte det
function createChat(messageses) {

    messages = messageses.messages
    own_id = messageses.own_id

    let chatHistory = ''

    for (let i = 0; i < messages.length; i++) {
        if (messages[i][5] == own_id) {
            chatHistory += `<div class="chat-receiver">${formatting(messages[i][1])}</div>`
        } else {
            chatHistory += `<div class="chat-sender">${formatting(messages[i][1])}</div>`
        }
    }
    $("#messageLog").html(chatHistory)
}

function showUsers(users) {
    //search.html
    console.log('show users')
    let l = users.length
    let listOfUsers = ''

    for (let i = 0; i < l; i++) {
        let user_id = users[i][0]
        let username = users[i][1]
        let description = users[i][2]
        let profilePicture = users[i][3]

        listOfUsers += `
        <a href = "/view_profile/${user_id}" style = "text-decoration: none;">
            <div class="message-person gray-box d-flex flex-row">`
        listOfUsers += `<img src="../static/uploads/${profilePicture}" class="display-horizontal profile-image center-vertical">`
        listOfUsers += `
                    <div class="center-vertical">
                        <div class="center-vertical" style="margin-left: 0.3rem">
                            <h6>${formatting(username)}</h6>
                            <div>${formatting(description)}</div>
                        </div>
                    </div>
            </div>
        </a > `
    }
    $("#displayUsers").html(listOfUsers);
}
function showPlayers(users) {
    console.log('showPlayers')
    let l = users.length
    let listOfUsers = ''
    for (let i = 0; i < l; i++) {
        listOfUsers += `
        <div class="gray-box col-sm p-2 " id="${users[i][0]}" onclick="challengePlayerFunction()">
            <input type="hidden" id="username_${users[i][0]}" value="${formatting(users[i][1])}">
            <div class="row">
                <div class="col"><img src="../static/uploads/${users[i][3]}" class="display-horizontal profile-image center-vertical"></div>
                <div class="col"><h6 class="mt-4">${formatting(users[i][1])}</h6></div>
            </div>
        </div>`
    }
    $("#displayUsers").html(listOfUsers);
}

function challengePlayerFunction() {
    console.log('try to challenge')
    challengeId = Number(event.currentTarget.id)
    challengeUsername = $(`#username_${challengeId}`).val()
    
    challenge(challengeId, challengeUsername)   
}

function formatting(input) {
    let output = String(input).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;')
    return output;
}

function get_chatter_socket_id(id) {
    console.log(id)
    $.ajax({
        type: "POST",
        url: "/get_socket_id",
        data: JSON.stringify(id),
        headers: { 'Content-Type': 'application/json' },
        dataType: "json",
        contentType: "application/json",
        success: (socket_id) => {
            console.log(socket_id)
            return socket_id
        }, error: (data) => {
            alert('Something went wrong')
        }

    })

}
var myCountDown;
var timerStarted = false;
function setUpCountDown() {
    if(!timerStarted){
        console.log('new timer')
        // error ska inte kunna skicka flera utmaningar för att starta flera timers samtdigt
        var start = Date.now()
        start += 30000;
        timerStarted = true;
        myCountDown = setInterval(function () {
            var now = Date.now()
            var timeleft = Math.round((start - now) / 1000);
            $('#timer').html('Tid kvar: ' + timeleft)
            if (timeleft <= 0) {
                //timer klar
                console.log('Timer finished')
                timer_reset()
            }
        }, 1000)
    }
}

function timer_reset(){
    clearInterval(myCountDown);
    timerStarted = false
    $("#alerts").addClass("d-none")
    $("#alerts_html").html("")
    $("#alerts_error").html("")
    $('#problem').hide()
}