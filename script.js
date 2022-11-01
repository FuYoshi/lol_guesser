/**
 * Filename: script.js
 * Authors: Yoshi Fu
 * Project: LoL Guesser Game
 * Date: October 2022
 *
 * Summary:
 * - [TODO]
 */

var url = "https://ddragon.leagueoflegends.com/cdn/12.20.1/";
var myJSON;
var myDifficulty;
var myVolume;
var curIndex = 0;

var myState;
var mySpell;
var myScore;
var myMode;

// Dictionary to translate ability key to index.
var atoi = {
  Q: 0,
  W: 1,
  E: 2,
  R: 3,
  P: 4,
};

function startGame() {
  toggleVisibility("restart", "none");
  myState = "active";
  myScore = 0;
  setMode();
  generateLevel();
}

/**
 * @name initialize
 * @description Request the JSON data of all champions and user settings.
 */
async function initialize() {
  setDifficulty();
  setVolume();

  let response = await fetch(url + "data/en_US/championFull.json");
  let data = await response.json();
  myJSON = data.data;
}

/**
 * @name index
 * @param {Number} newIndex index of the button on the navigation bar.
 * @description Change the current page and the active button on the navbar.
 */
function index(newIndex) {
  playSound("sound/click.mp3");

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
  playSound("sound/click.mp3");

  if (spell.name == mySpell.name) {
    cell.classList.add("correct");

    // Generate next level.
    if (myState == "active") {
      myScore++;
      generateLevel();
    }
  } else {
    cell.classList.add("incorrect");

    // Toggle show 'restart' button.
    if (myState == "active") {
      myState = "inactive";
      toggleVisibility("restart", "block");
    }
  }
}

/**
 * @name generateLevel
 * @description Generate a level containing random spells and a question.
 */
function generateLevel() {
  let question = document.getElementById("question");
  let grid = document.getElementById("grid");
  let score = document.getElementById("score");

  // Generate random answer from chosen spells.
  let spells = generateSpells();

  // Create random spell text field.
  question.textContent = `What is the icon of '${mySpell.name}'?`;

  // Create image grid with random spells.
  grid.textContent = "";
  grid.style.maxWidth = 96 * myDifficulty + "px";
  spells.forEach((spell) => grid.append(spell2image(spell)));

  // Create score counter.
  score.textContent = `Score: ${myScore}`;
}

/**
 * @name spell2image
 * @param {Spell} spell spell to convert to image.
 * @description Convert a Spell objcect to an image.
 */
function spell2image(spell) {
  let img = document.createElement("img");
  img.src = spell.icon;
  img.onmouseover = function () {
    playSound("sound/hover.mp3");
  };
  img.onclick = function () {
    guess(img, spell);
  };
  return img;
}

/**
 * @name generateSpells
 * @description Generate random spells of random champions by selected mode.
 */
function generateSpells() {
  // Generate random champions and abilities.
  let allChampions = Object.keys(myJSON);
  let allAbilities = myMode;
  let randomChampions = choice(allChampions, myDifficulty ** 2, false);
  let randomAbilities = choice(allAbilities, myDifficulty ** 2, true);

  // Convert random champions and abilities to spells.
  let spells = [];
  for (let i = 0; i < randomChampions.length; i++) {
    let randomSpell = new Spell(randomChampions[i], randomAbilities[i]);
    spells.push(randomSpell);
  }

  // Choose a random spell to be the answer of a level.
  mySpell = spells[randint(spells.length)];

  return spells;
}

/**
 * A League of Legends spell is an ability [Q, W, E, R, P] of a champion.
 * The name and image of the icon will be stored in the class.
 */
class Spell {
  constructor(champion, ability) {
    this.name = this._getName(champion, atoi[ability]);
    this.icon = this._getIcon(champion, atoi[ability]);
  }

  // Get the name of the champion ability.
  _getName(champion, ability) {
    if (ability == 4) {
      return myJSON[champion]["passive"]["name"];
    } else {
      return myJSON[champion]["spells"][ability]["name"];
    }
  }

  // Get the icon of the champion ability.
  _getIcon(champion, ability) {
    if (ability == 4) {
      let prefix = url + "img/passive/";
      return prefix + myJSON[champion]["passive"]["image"]["full"];
    } else {
      let prefix = url + "img/spell/";
      return prefix + myJSON[champion]["spells"][ability]["image"]["full"];
    }
  }
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
  myDifficulty = document.getElementById("difficulty").value;
}

/**
 * @name setMode
 * @description Set the mode of the game.
 */
function setMode() {
  myMode = [];
  if (document.getElementById("p").checked) {
    myMode.push("P");
  }
  if (document.getElementById("q").checked) {
    myMode.push("Q");
  }
  if (document.getElementById("w").checked) {
    myMode.push("W");
  }
  if (document.getElementById("e").checked) {
    myMode.push("E");
  }
  if (document.getElementById("r").checked) {
    myMode.push("R");
  }
  if (myMode.length == 0) {
    myMode = ["P", "Q", "W", "E", "R"];
  }
}
