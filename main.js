const gridWidthInput = document.getElementById("grid-width");
const gridHeightInput = document.getElementById("grid-height");
const gridSetBtn = document.getElementById("grid-set-btn");
const gridArea = document.getElementById("grid-area");
const wordListTextarea = document.getElementById("word-list-textarea");
const cellDialog = document.getElementById("cell-dialog");
const charInput = document.getElementById("char-input");
const charSetBtn = document.getElementById("char-set-btn");
const resetCellBtn = document.getElementById("reset-cell-btn");
const setStorageBtn = document.getElementById("set-storage-btn");
const loadStorageBtn = document.getElementById("load-storage-btn");
const clearStorageBtn = document.getElementById("clear-storage-btn");
const walkGridBtn = document.getElementById("solve-path-btn");
const showPathBtn = document.getElementById("show-path-btn");
const solveGridBtn = document.getElementById("solve-grid");

let startSetting = false;
let cellDialogKey = null;

const markedCells = new Map();

let walkedPath = null;

const drawGrid = () => {
  //   console.log("Drawing grid...");
  //   console.log(markedCells);
  const gridWidth = parseInt(gridWidthInput.value);
  const gridHeight = parseInt(gridHeightInput.value);
  cellDialog.style.display = "none";
  clearGrid();
  for (let y = 0; y < gridHeight; y++) {
    let newRow = document.createElement("div");
    newRow.classList.add("grid-row");
    gridArea.appendChild(newRow);
    for (let x = 0; x < gridWidth; x++) {
      const newCell = document.createElement("div");
      newCell.classList.add("grid-cell");
      const cellKey = `${x},${y}`;
      newCell.setAttribute("data-x", x);
      newCell.setAttribute("data-y", y);
      newRow.appendChild(newCell);
      if (markedCells.has(cellKey)) {
        newCell.classList.add("marked-cell");
        if (markedCells.get(cellKey)) {
          newCell.textContent = markedCells.get(cellKey);
          newCell.classList.add("char-cell");
        }
      }

      newCell.addEventListener("click", () => {
        cellDialogKey = cellKey;
        if (!markedCells.has(cellDialogKey)) {
          markCell(cellDialogKey);
        } else if (startSetting) {
          walkGrid(cellDialogKey);
          startSetting = false;
        } else {
          initiateDialog();
        }
      });
    }
  }
};

const initiateDialog = () => {
  cellDialog.style.display = "block";
  charInput.value = "";
  charInput.focus();
};

const markCell = (cellDialogKey) => {
  markedCells.set(cellDialogKey, null);
  drawGrid();
};

const clearGrid = () => {
  while (gridArea.firstChild) {
    gridArea.removeChild(gridArea.firstChild);
  }
};

const enableStartSetting = () => {
  startSetting = true;
  console.log("Mark a cell to start solving");
};

const walkGrid = (startCell) => {
  /*
    Walks through connected cells in markedCells
    Start cell is passed as parameter
    Start cell must have only one valid direction
    Current direction is set to the only valid direction
    Walk continues until current direction has no valid cells
    If current direction has no more valid cells, other directions in the current cell are checked
    There should be 2 valid cases:
    1. The only valid direction is opposite to the current direction
    This means that walk has concluded.
    2. There are two valid directions, one is opposite, and other to a side ( the next current direction)
    This means that walk continues
    Note: Three valid direction should never actually happen
    */
  console.log("Walking grid...", startCell);
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  const walkPath = [startCell];

  const getValidDirections = (cell) => {
    const [x, y] = cell.split(",").map(Number);
    const validDirections = [];
    directions.forEach(([dx, dy]) => {
      const newX = x + dx;
      const newY = y + dy;
      const newCell = `${newX},${newY}`;
      if (markedCells.has(newCell)) {
        validDirections.push([dx, dy]);
      }
    });
    return validDirections;
  };

  const getOppositeDirection = (direction) => {
    const [dx, dy] = direction;
    return [-dx, -dy];
  };

  const getCellInDirection = (oldCell, direction) => {
    const [x, y] = oldCell.split(",").map(Number);
    const [dx, dy] = direction;
    const newCellKey = `${x + dx},${y + dy}`;
    if (markedCells.has(newCellKey)) {
      return newCellKey;
    } else {
      return null;
    }
  };

  const walk = () => {
    let currentCell = startCell;
    let currentDirection = getValidDirections(currentCell);
    if (currentDirection.length !== 1) {
      throw new Error("Start cell must have only one valid direction");
    }
    currentDirection = currentDirection[0];

    while (true) {
      let nextPosibleCell = getCellInDirection(currentCell, currentDirection);
      if (nextPosibleCell) {
        walkPath.push(nextPosibleCell);
        currentCell = nextPosibleCell;
      } else {
        const validDirections = getValidDirections(currentCell);
        if (validDirections.length === 1) {
          // This is the case where the walk should end, given the one valid direction is opposite to the current direction
          break;
        } else if (validDirections.length === 2) {
          // This is a case where the current direction should change to the other (side, but not the opposite)
          // Get direction that is not the opposite
          const oppositeDirection = getOppositeDirection(currentDirection);
          const otherDirection = validDirections.find(
            ([dx, dy]) =>
              dx !== oppositeDirection[0] && dy !== oppositeDirection[1]
          );
          if (otherDirection) {
            currentDirection = otherDirection;
          }
        }
      }
    }
    return walkPath;
  };

  walkedPath = walk();
  console.log("Path:", walkedPath);
};

const showPath = () => {
  // Read cells in walkedPath and show it in grid one by one with a delay
  const [delayBetweenCells, delayBetweenPath] = [40, 120];
  if (walkedPath) {
    walkedPath.forEach((cell, index) => {
      setTimeout(() => {
        const [x, y] = cell.split(",").map(Number);
        const cellElement = document.querySelector(
          `[data-x="${x}"][data-y="${y}"]`
        );
        cellElement.classList.add("path-cell");
        // remove class after delay
        setTimeout(() => {
          cellElement.classList.remove("path-cell");
        }, delayBetweenPath);
      }, index * delayBetweenCells);
    });
  }
};

const getConnectionsMap = () => {
  // check if word list has any words
  const wordList = wordListTextarea.value.split("\n").filter((word) => word);
  if (wordList.length === 0) {
    alert("Word list is empty");
    return;
  }

  // check if path is already set check if it matches word list
  if (walkedPath) {
    const sumOfCharInWordList = wordList.reduce((sum, word) => {
      return sum + word.length;
    }, 0);
    const expectedPathLength = sumOfCharInWordList - wordList.length * 2 + 2;
    if (expectedPathLength !== walkedPath.length) {
      console.log(
        `Expected path length: ${expectedPathLength}, actual path length: ${walkedPath.length}`
      );
      alert("Path does not match word list");
      return;
    }
  } else {
    alert("Path is not set");
    return;
  }

  // check if all character in all words are part of a legal character set
  // also check if all words are at least 3 character long
  const lithuanianAlphabet = "AĄBCČDEĘĖFGHIĮYJKLMNOPRSŠTUŲŪVZŽ";
  const legalCharacters = new Set(lithuanianAlphabet.toUpperCase().split(""));
  wordList.forEach((word) => {
    if (word.length < 3) {
      alert("Word list contains words shorter than 3 characters");
      return;
    }
    const wordSet = new Set(word.toUpperCase().split(""));
    wordSet.forEach((char) => {
      if (!legalCharacters.has(char)) {
        alert("Word list contains illegal characters");
        return;
      }
    });
  });

  const wordConnections = new Map();

  const connectionCheck = (s1, s2) =>
    s1[s1.length - 2] === s2[0] && s1[s1.length - 1] === s2[1];

  wordList.forEach((word) => {
    wordConnections.set(word, []);
    wordList.forEach((otherWord) => {
      if (word !== otherWord) {
        if (connectionCheck(word, otherWord)) {
          wordConnections.get(word).push(otherWord);
        }
      }
    });
  });

  return wordConnections;
};

const getrestrictionList = () => {
  // markedCells and walkedPath must be set
  if (!markedCells || !walkedPath) {
    alert("Marked cells or path is not set");
    return;
  }

  const restrictionList = [];

  walkedPath.forEach((cell, index) => {
    const restCell = [index];
    // check if cell has dublicates in walkedPath
    walkedPath.forEach((otherCell, otherIndex) => {
      if (cell === otherCell && index !== otherIndex) {
        restCell.push(otherIndex);
      }
    });
    // check if dublicates were found
    if (restCell.length == 1) {
      restCell.push(null);
    }
    // check if cell has char in markedCells
    const charInCell = markedCells.get(cell); // char or null
    if (charInCell) {
      restCell.push(charInCell);
    } else {
      restCell.push(null);
    }
    restrictionList.push(restCell);
  });
  return restrictionList;
};

const solveGrid = () => {
  const wordConnections = getConnectionsMap();
  if (!wordConnections) {
    return;
  }
  const restrictionList = getrestrictionList();
  if (!restrictionList) {
    return;
  }

  const allWords = [...wordConnections.keys()];

  // TODO: implement algorithm

  // this algorithm tries to find a solution to the grid
  // words are connected to each other by 2 characters
  // e.g. "hello" connects to "lower" by "lo"
  // resulting string is hellower (chain string)
  // retrictionsList length equals the length of target chain string
  // each element is an array of 3 elements
  // first element is the index of the chain string (this element is always a number)
  // second element is the index of the chain string (this element is a number of null)
  // if second element is number, it means that the character in chain string should match at both indexes
  // if second element is null, it means there is no restriction
  // third element is the character in chain string (this element is a string (single char) or null)
  // if third element is string, it means that the character in chain string should match at both indexes
  // if third element is null, it means there is no restriction

  const restrictionCheck = (chainString) => {
    // Checks if chainString passes all restrictions
    console.log("Restriction check", chainString);

    restrictionList.forEach((restriction) => {
      const [index, connectionIndex, char] = restriction;
      if (char !== null && char !== chainString[index]) {
        return false;
      }
      if (
        connectionIndex !== null &&
        connectionIndex <= chainString.length &&
        chainString[index] !== chainString[connectionIndex]
      ) {
        return false;
      }
    });
    return true;
  };

  const chainWords = (usedWords, currentChain, solutionList, callDepth = 0) => {
    console.log(`chainWords call depth ${callDepth}`);
    console.log(usedWords, currentChain, solutionList);

    // usedWords is a set for faster lookup
    // currentChain is a string or raw connected words
    // solutionList is an array of words in order
    // example of valid arguments:
    // usedWords = new Set(["hello", "lower"])
    // currentChain = "hellower"
    // solutionList = ["hello", "lower"]

    // if there are no words in the solution - consider all words
    // if there are words in the solution - consider only words that are connected to the last word in the solution

    // base case
    if (currentChain.length === restrictionList.length) {
      console.log("Base case reached");

      return [currentChain, solutionList];
    }
    const nextConnections = currentChain
      ? wordConnections.get(solutionList[solutionList.length - 1])
      : allWords;

    if (nextConnections.legth === 0) {
      return null;
    }

    nextConnections
      .filter((word) => !usedWords.has(word))
      .forEach((nextWord) => {
        const nextChain =
          currentChain + (currentChain ? nextWord.substring(2) : nextWord);
        console.log(
          `Current chain: ${currentChain}, next word: ${nextWord}, next chain: ${nextChain}`
        );

        if (restrictionCheck(nextChain)) {
          console.log("Restriction check passed");
          const nextSolutionList = [...solutionList, nextWord];
          const solution = chainWords(
            new Set([...usedWords, nextWord]),
            nextChain,
            nextSolutionList,
            callDepth + 1
          );
          if (solution) {
            console.log(`Solution found at depth ${callDepth}`);
            console.log(solution);
            return solution;
          }
        }
      });
  };

  const solution = chainWords(new Set(), "", []);
  console.log(solution);
};
const loadFromStorage = () => {
  console.log("Loading from storage...");
  const storedDimensions = localStorage.getItem("Dimensions");
  if (storedDimensions) {
    const [width, height] = storedDimensions.split(",");
    gridWidthInput.value = width;
    gridHeightInput.value = height;
  }
  const storedMarkedCells = JSON.parse(localStorage.getItem("markedCells"));
  if (storedMarkedCells) {
    storedMarkedCells.forEach(([key, value]) => {
      markedCells.set(key, value);
    });
  }
  const storedWordList = localStorage.getItem("wordList");
  if (storedWordList) {
    wordListTextarea.value = storedWordList;
  }
};

showPathBtn.addEventListener("click", showPath);

walkGridBtn.addEventListener("click", enableStartSetting);

solveGridBtn.addEventListener("click", solveGrid);

gridSetBtn.addEventListener("click", () => {
  clearGrid();
  drawGrid();
});

charSetBtn.addEventListener("click", () => {
  console.log("Setting char...");
  const charValue = charInput.value.toUpperCase();
  if (charValue && charValue.length === 1) {
    markedCells.set(cellDialogKey, charValue);
    drawGrid();
  }
});

resetCellBtn.addEventListener("click", () => {
  markedCells.delete(cellDialogKey);
  drawGrid();
});

setStorageBtn.addEventListener("click", () => {
  localStorage.setItem("wordList", wordListTextarea.value);
  localStorage.setItem(
    "Dimensions",
    `${gridWidthInput.value},${gridHeightInput.value}`
  );
  localStorage.setItem(
    "markedCells",
    JSON.stringify(Array.from(markedCells.entries()))
  );
  alert("Marked cells saved to local storage");
});

loadStorageBtn.addEventListener("click", () => loadFromStorage);

clearStorageBtn.addEventListener("click", () => {
  localStorage.removeItem("wordList");
  localStorage.removeItem("Dimensions");
  localStorage.removeItem("markedCells");
  markedCells.clear();
  alert("Marked cells cleared from local storage");
  drawGrid();
});

wordListTextarea.addEventListener("input", () => {
  // uppercase input
  wordListTextarea.value = wordListTextarea.value.toUpperCase();
});

loadFromStorage();
drawGrid();
