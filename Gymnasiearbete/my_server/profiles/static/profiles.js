

$(document).ready(function () {
    $("#challengeBtn").click(function () {
        console.log("challange sent " + $('#profile_id').val() + $('#profile_username').val())
        challenge(Number($('#profile_id').val()), $('#profile_username').val());

    })
    $("#get_to_messages").click(function () {
        window.isChatOpen = true
        console.log("Se messages för  " + $('#profile_id').val() + $('#profile_username').val())
        currentChatId = Number($('#profile_id').val())
        //console.log(currentChatId)
        getChatHistory(Number($('#profile_id').val()))
        connecting_chat(Number($('#profile_id').val()))
        showChat()
    })

    $("#win_rate").html(`<div class="progress bg-danger">
    <div class="progress-bar bg-success" role="progressbar" style="width: ${$("#win_rate_stats").val()}%" aria-valuenow="0" aria-valuemin="50"
            aria-valuemax="100">
            </div>
    </div>`)
})

