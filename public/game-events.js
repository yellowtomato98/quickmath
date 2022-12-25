// client side javascript that handles all game stuff with events

console.log(problems)

// as soon as the screen is loaded, start game
myGame = new Game(JSON.parse(problems), 120)
myGame.main();

const userinput = document.getElementById("user-input");
const leaderboard = document.getElementById("leaderboard")
const finalLeaderboard = document.getElementById("final-leaderboard")

userinput.addEventListener('input', function() {
    myGame.check_answer()
})

socket.on('render-leaderboard', new_ldr => {
    console.log("rendering leaderboard!")
    console.log(new_ldr)
    leaderboard.innerHTML = "";
    new_ldr.sort((a,b) => {return b[0]-a[0]}) // sort descending by score
    console.log(new_ldr)
    for (var i = 0; i < new_ldr.length; i++){
        const newRank = document.createElement('div')
        newRank.innerText = String(i+1) + '. ' + String(new_ldr[i][1]) + ' (' + String(new_ldr[i][0]) + ')'
        leaderboard.append(newRank)
    }
})

socket.on('final', finalRanks => {
    finalRanks.sort((a,b) => {return b[0]-a[0]})
    for (var i = 0; i < finalRanks.length; i++){
        const player = document.createElement('div')
        player.innerText = String(i+1) + '. ' + String(finalRanks[i][1]) + ' (' + String(finalRanks[i][0]) + ')'
        finalLeaderboard.append(player)
    }
})