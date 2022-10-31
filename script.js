/**
 * Filename: script.js
 * Authors: Yoshi Fu
 * Project: LoL Guesser Game
 * Date: October 2022
 *
 * Summary:
 * - [TODO]
 */

var curIndex = 0;
var myVolume;
var myBoardSize;
var myBoard;
var myScore;
var mySpell;
var myState = "inactive";
var url = "http://ddragon.leagueoflegends.com/cdn/12.20.1/";

/**
 * @name startGame
 * @description Reset all global variables and start the game.
 */
function startGame() {
  toggleVisibility("restart", "none");
  toggleVisibility("game", "block");
  setDifficulty();
  setVolume();

  myBoard = document.getElementById("grid");
  myScore = 0;
  myState = "active";
  generateBoard();
}

/**
 * @name setVolume
 * @description Set the volume of sound effects.
 */
function setVolume() {
  myVolume = document.getElementById("volume").value / 100;
}

/**
 * @name setDifficulty
 * @description Set the difficulty of the game.
 */
function setDifficulty() {
  myBoardSize = document.getElementById("difficulty").value;
}

/**
 * @name playSound
 * @param {String} sound path to the audio file.
 * @description Play the specified sound.
 */
function playSound(sound) {
  let audio = new Audio(sound);
  audio.volume = myVolume;
  audio.play();
}

/**
 * @name index
 * @param {Number} newIndex index of the button on the navigation bar.
 * @description Change the current page and the active button on the navbar.
 */
function index(newIndex) {
  // Change active button.
  let navbar = document.getElementById("navbar");
  let buttons = navbar.getElementsByTagName("button");
  buttons[curIndex].classList.remove("active");
  buttons[newIndex].classList.add("active");

  // Change current page.
  let pages = ["help", "game", "settings"];
  curPage = pages[curIndex];
  newPage = pages[newIndex];
  document.getElementById(curPage).style.display = "none";
  document.getElementById(newPage).style.display = "block";

  if (newIndex == pages.indexOf("game")) {
    startGame();
  }
  curIndex = newIndex;
}

/**
 * @name toggleVisibility
 * @param {String} id id of the element to change the display of.
 * @param {String} visibility display setting to set it to.
 * @description Change the display setting of an element by id.
 */
function toggleVisibility(id, visibility = null) {
  var element = document.getElementById(id);
  if (visibility !== null) {
    element.style.display = visibility;
    return;
  }

  if (element.style.display == "block") {
    element.style.display = "none";
  } else {
    element.style.display = "block";
  }
}

/**
 * @name guess
 * @param {HTMLImageElement} cell cell in grid to add css classes to.
 * @param {spell} spell guessed spell of the player.
 * @description Compare the guess with the answer, change score accordingly.
 */
function guess(cell, spell) {
  if (spell == mySpell) {
    cell.classList.add("correct");

    // Generate next level.
    if (myState == "active") {
      generateBoard();
      myScore++;
    }
  } else {
    cell.classList.add("incorrect");

    // Toggle show 'restart' button.
    if (myState == "active") {
      toggleVisibility("restart", "block");
      myState = "inactive";
    }
  }
}

/**
 * @name generateBoard
 * @description Create the grid containing all ability icons.
 */
async function generateBoard() {
  let question = document.getElementById("question");
  let grid = document.getElementById("grid");
  let score = document.getElementById("score");

  // Generate random answer from chosen spells.
  let spells = await generateSpells();
  mySpell = spells[randint(spells.length)].name;

  // Create random spell text field.
  question.textContent = `What is the icon of \r\n'${mySpell}'?`;

  // Create image grid with random spells.
  grid.textContent = "";
  for (let i = 0; i < myBoardSize; i++) {
    let row = document.createElement("div");
    for (let j = 0; j < myBoardSize; j++) {
      let img = document.createElement("img");
      img.src = spells[i * myBoardSize + j].src;
      img.onmouseover = function () {
        playSound("sound/hover.mp3");
      };
      img.onclick = function () {
        playSound("sound/click.mp3");
        guess(img, spells[i * myBoardSize + j].name);
      };
      row.appendChild(img);
    }
    grid.appendChild(row);
  }

  // Create score counter.
  score.textContent = `Score: ${myScore}`;

  return grid;
}

/**
 * @name generateSpells
 * @return {Array} Array containing randomly generated spells.
 * @description Generate random spells (amount based on difficulty).
 */
async function generateSpells() {
  let data = await getData();
  data = data.data;

  // Generate list of all champions
  let champions = Object.keys(data);
  let choices = choice(champions, myBoardSize ** 2, false);

  // Create grid with spell objects.
  let spells = [];
  for (let i = 0; i < choices.length; i++) {
    spells.push(new spell(data[choices[i]]));
  }
  return spells;
}

/**
 * @name spell
 * @param {Array} data JSON containing champion specific data.
 * @description Choose a random ability and create spell object.
 *              an spell [Q, W, E, R, P]
 *              maps to  [0, 1, 2, 3, 4]
 */
function spell(data) {
  let spell = randint(0, 5);
  if (spell == 4) {
    prefix = url + "img/passive/";
    this.name = data["passive"]["name"];
    this.src = prefix + data["passive"]["image"]["full"];
  } else {
    prefix = url + "img/spell/";
    this.name = data["spells"][spell]["name"];
    this.src = prefix + data["spells"][spell]["image"]["full"];
  }
}

/**
 * @name getData
 * @description Return JSON containing data of all champions.
 */
async function getData() {
  let response = await fetch(url + "data/en_US/championFull.json");
  return await response.json();
}

/**
 * @name choice
 * @param {Array}   arr     1D array with elements to choose from.
 * @param {Number}  size    Amount of choices to make and to output.
 * @param {Boolean} replace Whether the sampling is with or without replacement.
 * @return {Array} Array containing size choices of arr.
 * @description Choose size random elements from arr and return them.
 */
function choice(arr, size = null, replace = true) {
  if (size == null) {
    size = 1;
  }

  let choices = [];
  while (choices.length < size) {
    let index = Math.floor(Math.random() * arr.length);
    if (!replace && choices.includes(arr[index])) {
      continue;
    }
    choices.push(arr[index]);
  }
  return choices;
}

/**
 * @name randint
 * @param {Number} low  Lower bound on random numbers.
 * @param {Number} high Upper bound on random numbers.
 * @param {Number} size Amount of choices to make and to output.
 * @return {Array} Array containing size integers in [low, high)
 * @description Choose size random integers in range [low, high).
 */
function randint(low, high = null, size = null) {
  if (high == null) {
    high = low;
    low = 0;
  }

  if (size == null) {
    size = 1;
  }

  let choices = [];
  while (choices.length < size) {
    let choice = Math.floor(Math.random() * (high - low)) + low;
    if (choice == high) {
      continue;
    }
    choices.push(choice);
  }
  return choices;
}
