

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

    $("#profile_link").click(function () {
        console.log("clicked profile link")
        window.location.href = "/profiles/" + $(this).data("profile_id")
    })

    // $("#win_rate").html(`<div class="progress bg-danger">
    // <div class="progress-bar bg-success" role="progressbar" style="width: ${$("#win_rate_stats").val()}%" aria-valuenow="0" aria-valuemin="50"
    //         aria-valuemax="100">
    //         </div>
    // </div>`)
    updateStatsBar(Number($('#win_rate_stats').val()), Number($('#draw_rate_stats').val()), Number($('#loss_rate_stats').val()))
})

function updateStatsBar(wins, draws, losses) {
    let total = wins + draws + losses;
    
    let barWins = document.getElementById('bar-wins');
    let barDraws = document.getElementById('bar-draws');
    let barLosses = document.getElementById('bar-losses');

    // Handle the edge case where the user has never played a game
    if (total === 0) {
        barWins.style.width = '0%';
        barLosses.style.width = '0%';
        barDraws.style.width = '100%';
        barDraws.className = 'progress-bar bg-secondary';
        barDraws.innerText = 'Inga matcher spelade';
        return;
    }

    // Calculate exact percentages
    let winPct = (wins / total) * 100;
    let drawPct = (draws / total) * 100;
    let lossPct = (losses / total) * 100;

    // Apply widths to the HTML elements
    barWins.style.width = winPct + '%';
    barDraws.style.width = drawPct + '%';
    barLosses.style.width = lossPct + '%';
}