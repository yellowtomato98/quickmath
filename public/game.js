// client side javascript that handles all game stuff

// const socket = io('http://localhost:3000', { transports: ['websocket', 'polling', 'flashsocket'] });

class Game {
  constructor(problems, time = 120) {
    this.amt_time = time;
    this.time = this.amt_time;
    this.endtime = 10;
    this.start_time = new Date().getTime();
    this.problems = problems;
    this.idx = 0;
  }
}

Game.prototype.generate_problem = function () {
  let problem = this.problems[this.idx];
  this.ans = problem[2];
  console.log(problem);
  console.log(problem[3]);
  document.getElementById("num1").innerHTML = problem[0];
  document.getElementById("num2").innerHTML = problem[1];
  let op = document.getElementById("op");
  if (problem[3] === 0) {
    op.innerHTML = "&plus;";
  } else if (problem[3] === 1) {
    op.innerHTML = "&minus;";
  } else if (problem[3] === 2) {
    op.innerHTML = "&times;";
  } else {
    op.innerHTML = "&divide;";
  }
  // document.getElementById("score").innerHTML = "Score: " + String(this.score);
};

Game.prototype.check_answer = function () {
  let input = document.getElementById("user-input").value;
  if (input == this.ans) {
    // this.score+=1;
    console.log("updating score now");
    console.log(this.idx);
    this.idx += 1;
    socket.emit("update-score", roomName);
    document.getElementById("user-input").value = "";
    this.generate_problem();
    // document.getElementById("check").style.visibility = "hidden"
  }
};

// let timerInterval = null;
Game.prototype.timer = function () {
  const now = new Date().getTime();
  this.time = this.amt_time + Math.round((this.start_time - now) / 1000);
  document.getElementById("timer").innerHTML = "Time: " + String(this.time);
  // if (this.time==15){
  //     timerIntervalFast = setInterval(() => this.timerfast(), 10)
  // }
  if (this.time == 0) {
    this.end();
  }
};

// let timerIntervalFast=null;
// Game.prototype.timerfast = function(){
//     const now = new Date().getTime()
//     this.time = (this.amt_time+Math.floor((this.start_time-now)/10)/100).toFixed(2)
//     document.getElementById("timer").innerHTML = "Time: " + this.time;
//     this.time = parseFloat(this.time)
//     let fraction = (15-this.time)/15
//     let r = Math.round(255*fraction)
//     document.getElementById("timer").style.color = "rgb("+r+", 0, 0)"
//     if (this.time==0){
//         clearInterval(timerIntervalFast)
//         this.end()
//     }
// }

Game.prototype.main = function () {
  document.getElementById("timer").innerHTML = "Time: " + String(this.time);
  socket.emit("update-score", roomName);
  this.generate_problem();
  timerInterval = setInterval(() => this.timer(), 1000);
};

Game.prototype.endtimer = function () {
  this.endtime -= 1;
  if (this.endtime < 0) this.endtime = 0;
  document.getElementById("final-countdown").innerText =
    "Redirecting to room in " + String(this.endtime);
};

Game.prototype.end = function () {
  document.getElementById("game-screen").style.visibility = "hidden";
  document.getElementById("end-screen").style.visibility = "visible";
  socket.emit("render-final-ranks", roomName);

  document.getElementById("final-countdown").innerText =
    "Redirecting to lobby in " + String(this.endtime);
  endtimerInterval = setInterval(() => this.endtimer(), 1000);
  setTimeout(function () {
    socket.emit("end-game", roomName);
    window.location.href = "/room/" + roomName;
  }, 15000);
};
