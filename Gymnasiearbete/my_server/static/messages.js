var receiver_id;
var reciever_username;
$(document).ready(() => {
    //tror denna metod är oanvänd
    socket.on('message_to_user', (data) => {
        console.log('Message emmitting to users')
        content = data['content']
        sender_id = data['sender_id']
        console.log(data)
        //För att testa detta behövs det att man använder 2 olika webbläsare eftersom sessions fortsätter över olika flikar
        if (sender_id == window.receiver_id) {
            //innebär att den man pratar med har skickat meddelandet och inte man själv
            console.log('De skickade')
            new_message = `<div class="chat-receiver">${formatting(content)}</div>`

        } else {
            //man själv skickade meddelandet
            console.log('Du skickade')
            new_message = `<div class="chat-sender">${formatting(content)}</div>`
        }
        $("#messageLog").append(new_message)
    })

    $("#messageSend").click(() => {
        console.log('send')
        message_content = $('#messageContent').val()
        $("#messageContent").val("")
        //bör inte skicka eller göra något ifall meddelandet är tomt
        if(message_content != ''){
            new_message = `<div class="chat-sender">${formatting(message_content)}</div>`
            $("#messageLog").append(new_message)

            $.ajax({
                type: "POST",
                url: "/send_message",
                data: JSON.stringify({
                    id: window.receiver_id,
                    content: message_content
                }),
                headers: { 'Content-Type': 'application/json' },
                dataType: "json",
                contentType: "application/json",
                success: () => {
                }
            })
        }
    })

    $("#challenge").click(function () {
        challenge(window.receiver_id, window.reciever_username);
    })

    $("#goBackButton").click(hideChat)

    socket.on('receive_message', (data) => {
        console.log('Receiving message')
        let changeSessionNotification = false;
        if($('#active_page').val() == "messages" || $('#active_page').val() == "view_profile"){
            if(window.isChatOpen && receiver_id == data.from_id){
                console.log('receive message in chat with person')
                new_message = `<div class="chat-receiver">${formatting(data.content)}</div>`
                $("#messageLog").append(new_message)
            }else{
                $(`#last_message_from_${data['from_id']}`).html(formatting(data.content))
                $(`#${data['from_id']}`).addClass('border-unread')
                $('.message_icon').addClass('icons-unread')
                changeSessionNotification = true;
            }
        }else{
            $('.message_icon').addClass('icons-unread')
            changeSessionNotification = true;
        }
        console.log(changeSessionNotification)
        if(changeSessionNotification){
            $.ajax({
                type: "POST",
                url: "/changeSessionNotification",
                data: JSON.stringify(),
                headers: { 'Content-Type': 'application/json' },
                dataType: "json",
                contentType: "application/json",
                success: (data) => {
                }
            })
        }else{
            $.ajax({
                type: "POST",
                url: "/changeRead",
                data: JSON.stringify({id:window.receiver_id}),
                headers: { 'Content-Type': 'application/json' },
                dataType: "json",
                contentType: "application/json",
                success: (data) => {
                    $(`#${window.receiver_id}`).removeClass('border-unread')
                }
            })
            $(`#last_message_from_${window.receiver_id}`).html(formatting(data.content))
        }

    })
})

function hideChat() {
    window.isChatOpen = false;
    $("#chat").hide()
    $("#chat").removeClass("show-chat")
    $("#content1").show()
    $("#content2").show()
    $("#footer").show()

    window.scrollTo(0, 0)
    console.log($('#active_page').val())
    if( $('#active_page').val() == "messages") {
        $('#title_header').html('Meddelanden')
    } else if ($('#active_page').val() == "view_profile") {
        namn = $('#profile_username').val()
        console.log(namn)
        $('#title_header').html(namn+"s Profil")
    }
}

//tar id från andra js filen så att id finns här
//definerar room här
function connecting_chat(id) {
    //hitta andra användares socketID och göra emits endast till dem
    console.log('Connecting to chat')
    $.ajax({
        type: "POST",
        url: "/connecting_to_chat",
        data: JSON.stringify(id),
        headers: { 'Content-Type': 'application/json' },
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            //info = JSON.parse(data)
            info = data
            $('#title_header').html('Meddelanden - ' + formatting(info['user_connected_to']))
            window.reciever_username = info['user_connected_to']
            window.receiver_id = info['id'];
            window.reciever_username = info['user_connected_to']
            if(!info['message_notification']){
                console.log('All messages read')
                $('.message_icon').removeClass('icons-unread')
            }
            $(`#${window.receiver_id}`).removeClass('border-unread')
        }
    })
}