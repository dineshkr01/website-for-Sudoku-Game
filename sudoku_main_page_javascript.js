const OverLay = document.getElementById('overlay');
const Modal = document.getElementById('modal');
const NewGame = document.getElementById('NewGame');
const CloseOverlay = document.getElementById('closeOverlay');
const Continue = document.getElementById('Continue');
const levelContainer = document.getElementById('levelContainer');
const solveButton = document.getElementById("Surrender");
const restart = document.getElementById('Restart')
const submit = document.getElementById('SubmitBtn');
const alertdisplay = document.getElementById('alert');
const MistakesCount = document.getElementById('MistakesCount');
const numberstoselect = document.querySelectorAll('.numberOpt');
const maincontainer = document.getElementById('maincontainer');
const puzzleGrid = document.getElementById("puzzle-grid");
const difficultyelemnt = document.getElementById("difficultybox");
const info = document.getElementById('info');
const closeAlert = document.getElementById('closeAlert');
const alertMessage = document.getElementById('alertMessage');
const selectLevelFirst = document.getElementById('selectLevelFirst');



let selectedNUMBER = 0;
let seconds = 0;
let grid;
let to_be_row = 0, to_be_col = 0;
let difficulty01 = 'ABC';
let mistakes = 0;
let selected_row, selected_col;
let prev_selected_row = -1, prev_selected_col = -1;
let puzzleString = 'empty';
let empty_cells = 0;
let puzzlegame = 0;
let timer_select_level = 0;

document.getElementById('hamburger-menu').addEventListener('click', function () {
    document.getElementById('sidebar').style.width = '250px';
});

document.getElementById('closebtn').addEventListener('click', function () {
    document.getElementById('sidebar').style.width = '0';
});

NewGame.addEventListener('click', () => {
    document.getElementById('sidebar').style.width = '0';
    OverLay.style.display = 'block';
    Modal.style.top = '1%';
});

CloseOverlay.addEventListener('click', () => {
    OverLay.style.display = 'none';
    Modal.style.top = '-100%';
});

function blinkBorder() {
    if (timer_select_level == 4) return;
    if (timer_select_level % 2 == 0)
        selectLevelFirst.style.border = '2px solid orange';
    else selectLevelFirst.style.border = '2px solid white';
    timer_select_level++;
    setTimeout(() => {
        blinkBorder();
    }, 100);
}

Continue.addEventListener('click', () => {
    if (difficulty01 == 'ABC') {
        timer_select_level = 0;
        blinkBorder();
    }
    else {
        OverLay.style.display = 'none';
        Modal.style.top = '-100%';
        MainControlFunction(0);
    }
});


// restart.addEventListener('mouseover', () => {
//     if (!puzzlegame) {
//         restart.style.cursor = 'not-allowed';
//     } else {
//         restart.style.cursor = 'pointer';
//     }
// });


restart.addEventListener('click', () => {
    document.getElementById('sidebar').style.width = '0';
    if (!puzzlegame) {
        OverLay.style.display = 'block';
        alertdisplay.style.top = '1%';
        alertMessage.innerHTML = 'Please start a new game before attempting to solve.';
        closeAlert.innerHTML = 'Close';
    } else {
        MainControlFunction(1);
    }
});



submit.addEventListener('click', () => {

});



levelContainer.addEventListener('change', (event) => {
    if (event.target.name === 'difficulty') {
        console.log(`Selected level: ${event.target.value}`);
        difficulty01 = event.target.value;
    }
});

function MainControlFunction(reset) {
    selectedNUMBER = 0;
    puzzlegame = 1;
    numberstoselect.forEach((element) => {
        element.style.backgroundColor = 'white';
        element.style.color = 'black';
    });
    mistakes = 0;
    MistakesCount.innerText = 0;
    numberstoselect.forEach(number => {
        number.style.visibility = 'visible';
    });
    maincontainer.style.visibility = 'visible';
    info.style.display = 'block';
    difficultyelemnt.innerText = difficulty01;
    seconds = 0;
    if (puzzleGrid) {
        puzzleGrid.innerHTML = '';
    }
    if (!reset) {
        if (difficulty01 === "EASY") {
            puzzleString = sudoku.generate("easy", 1);
        } else if (difficulty01 === "MEDIUM") {
            puzzleString = sudoku.generate("hard", 1);
        } else if (difficulty01 === "HARD") {
            puzzleString = sudoku.generate("insane", 1);
        } else {
            puzzleString = sudoku.generate("inhuman", 1);
        }
    }

    grid = fillnumbersinGrid(puzzleString);
    fillcellsinSudokuGrid(puzzleGrid, grid);

    puzzleGrid.addEventListener('click', function (event) {
        handleInput(event, puzzleGrid);
    });
}



solveButton.addEventListener("click", () => {
    document.getElementById('sidebar').style.width = '0';
    if (!puzzlegame) {
        OverLay.style.display = 'block';
        alertdisplay.style.top = '1%';
        alertMessage.innerHTML = 'Please start a new game before attempting to restart.';
        closeAlert.innerHTML = 'Close';
    }
    else {
        info.style.display = 'none';
        numberstoselect.forEach(number => {
            number.style.visibility = 'hidden';
        });
        solveSudoku(grid);
        updateSudokuGrid(puzzleGrid, grid);
    }
});

function solveSudoku(grid) {
    return solveSudokuHelper(grid);
}

function solveSudokuHelper(grid) {
    const emptyCell = findEmptyCell(grid);
    if (!emptyCell) {
        return true;
    }
    const [row, col] = emptyCell;
    for (let num = 1; num <= 9; num++) {
        const numStr = num.toString();
        if (isSafe(grid, row, col, numStr)) {
            grid[row][col] = numStr;
            if (solveSudokuHelper(grid)) {
                return true;
            }
            grid[row][col] = '.';
        }
    }
    return false;
}

function findEmptyCell(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === '.') {
                return [row, col];
            }
        }
    }
    return null;
}

function isSafe(grid, row, col, num) {
    return (
        isRowSafe(grid, row, num) &&
        isColSafe(grid, col, num) &&
        isBoxSafe(grid, row - (row % 3), col - (col % 3), num)
    );
}

function isRowSafe(grid, row, num) {
    return !grid[row].includes(num);
}

function isColSafe(grid, col, num) {
    for (let row = 0; row < 9; row++) {
        if (grid[row][col] === num) {
            return false;
        }
    }
    return true;
}

function isBoxSafe(grid, startRow, startCol, num) {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (grid[row + startRow][col + startCol] === num) {
                return false;
            }
        }
    }
    return true;
}

function updateSudokuGrid(puzzleGrid, grid) {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            const input = puzzleGrid.rows[i].cells[j].querySelector("input");
            input.value = grid[i][j].toString();
            if (puzzleGrid.rows[i].cells[j].querySelector("input").style.backgroundColor == 'red') {
                puzzleGrid.rows[i].cells[j].querySelector("input").style.backgroundColor = 'skyblue';
            }
            if (puzzleGrid.rows[i].cells[j].querySelector("input").style.color == 'red') {
                puzzleGrid.rows[i].cells[j].querySelector("input").style.color = 'black';
            }
            if (puzzleGrid.rows[i].cells[j].querySelector("input").style.backgroundColor == 'rgba(128, 128, 128, 0.445)') {
                puzzleGrid.rows[i].cells[j].querySelector("input").style.backgroundColor = 'white';
            }
        }
    }
}

function fillcellsinSudokuGrid(puzzleGrid, grid) {
    for (let i = 0; i < 9; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            if (grid[i][j].toString() !== '.') {
                input.value = grid[i][j].toString();
                input.style.backgroundColor = "skyblue";
                input.readOnly = true;
                input.style.cursor = "not-allowed";
            } else {
                input.style.cursor = "pointer";
                input.readOnly = true;
            }
            cell.appendChild(input);
            row.appendChild(cell);
        }
        puzzleGrid.appendChild(row);
    }
}

function fillnumbersinGrid(puzzleString) {
    let puzzleArray = new Array(9).fill().map(() => new Array(9));
    let ind = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            puzzleArray[i][j] = puzzleString[ind];
            ind++;
        }
    }
    return puzzleArray;
}

function handleInput(event) {
    const input = event.target;
    const row = input.parentNode.parentNode.rowIndex;
    const col = input.parentNode.cellIndex;
    if (input.style.backgroundColor != 'skyblue') {
        selected_row = row;
        selected_col = col;
        if (prev_selected_col == -1 && prev_selected_row == -1) {
            input.style.backgroundColor = 'rgba(128, 128, 128, 0.445)';
            prev_selected_row = selected_row;
            prev_selected_col = selected_col;
        }
        else {
            puzzleGrid.rows[prev_selected_row].cells[prev_selected_col]
            .querySelector("input").style.backgroundColor = 'white';
            puzzleGrid.rows[selected_row].cells[selected_col]
            .querySelector("input").style.backgroundColor = 'rgba(128, 128, 128, 0.445)';
            prev_selected_row = selected_row;
            prev_selected_col = selected_col;
        }

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cellInput = puzzleGrid.rows[i].cells[j].querySelector("input");
                cellInput.style.color = 'black';
            }
        }
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                selectedNUMBER = puzzleGrid.rows[i].cells[j].querySelector("input").value;
                const cellInput = puzzleGrid.rows[i].cells[j].querySelector("input");
                if (cellInput.style.backgroundColor != 'skyblue') {
                    console.log("It is a white Cell!!! at : " + i + " " + j + 'of value : ' + selectedNUMBER);
                    colorsubGridandRowCol(selected_row, selected_col, 0, i, j);
                }
            }
        }
    }
}


closeAlert.addEventListener('click', () => {
    OverLay.style.display = 'none';
    alertdisplay.style.top = '-100%';
    numberstoselect.forEach(number => {
        number.style.visibility = 'hidden';
    });
    info.style.display = 'none';
});




const numberElements = Array.from(document.getElementsByClassName('numberOpt'));

function updateNumberStyles(selectednumber) {
    console.log("####" + 1);
    let indexed_to_change = -1;
    numberElements.forEach((element, index) => {
        if (selectednumber === index + 1) {
            indexed_to_change = index;
            element.style.backgroundColor = '#0d6dfd';
            element.style.color = 'white';
        } else {
            element.style.backgroundColor = 'white';
            element.style.color = 'black';
        }
    });
    console.log("####" + 2);
    if (selected_row > -1 && selected_col > - 1)
        puzzleGrid.rows[selected_row].cells[selected_col].querySelector("input").value = selectednumber;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cellInput = puzzleGrid.rows[i].cells[j].querySelector("input");
            cellInput.style.color = 'black';
        }
    }
    console.log("####" + 3);
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cellInput = puzzleGrid.rows[i].cells[j].querySelector("input");
            if (cellInput.style.backgroundColor != "skyblue") {
                selectedNUMBER = puzzleGrid.rows[i].cells[j].querySelector("input").value;
                console.log("It is a white Cell!!! in update Number function !!!");
                colorsubGridandRowCol(selected_row, selected_col, 1, i, j);
            }
        }
    }
    console.log("####" + 4);

    setTimeout(() => {
        numberElements[indexed_to_change].style.backgroundColor = 'white';
        numberElements[indexed_to_change].style.color = 'black';
    }, 100);
}


numberElements.forEach((element, index) => {
    element.addEventListener('click', () => {
        const selectednumber = index + 1;
        updateNumberStyles(selectednumber);
    });
});


function colorsubGridandRowCol(row, col, mistake_inc_flag, current_row, current_col) {
    console.log("I am Color Cell function !!!");
    empty_cells = 0;
    let resultRow = Math.floor(current_row / 3);
    let resultCol = Math.floor(current_col / 3);
    let isPresentinSub = false;
    let isPresentinRow = false;
    let isPresentinCol = false;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (puzzleGrid.rows[i].cells[j].querySelector("input").value == "")
                empty_cells++;
        }
    }


    for (let i = 3 * resultRow; i < 3 * resultRow + 3; i++) {
        for (let j = 3 * resultCol; j < 3 * resultCol + 3; j++) {
            if (i == current_row && j == current_col) continue;
            if (selectedNUMBER == puzzleGrid.rows[i].cells[j].querySelector("input").value
                && row == current_row && col == current_col) {
                puzzleGrid.rows[i].cells[j].querySelector("input").style.color = 'red';
            }
            if (selectedNUMBER == puzzleGrid.rows[i].cells[j].querySelector("input").value) {
                isPresentinSub = true;
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        if (i == current_col) continue;
        if (puzzleGrid.rows[current_row].cells[i].querySelector("input").value == selectedNUMBER
            && row == current_row && col == current_col) {
            puzzleGrid.rows[current_row].cells[i].querySelector("input").style.color = 'red';
        }
        if (puzzleGrid.rows[current_row].cells[i].querySelector("input").value == selectedNUMBER) {
            isPresentinRow = true;
        }
    }

    for (let i = 0; i < 9; i++) {
        if (i == current_row) continue;
        if (puzzleGrid.rows[i].cells[current_col].querySelector("input").value == selectedNUMBER
            && row == current_row && col == current_col) {
            puzzleGrid.rows[i].cells[current_col].querySelector("input").style.color = 'red';
        }
        if (puzzleGrid.rows[i].cells[current_col].querySelector("input").value == selectedNUMBER) {
            isPresentinCol = true;
        }
    }

    if (isPresentinSub || isPresentinRow || isPresentinCol) {
        puzzleGrid.rows[current_row].cells[current_col].querySelector("input").style.color = 'red';
        if (mistake_inc_flag && row == current_row && col == current_col)
            mistakes++;
    } else {
        console.log('Coloring the cell : black');
        puzzleGrid.rows[current_row].cells[current_col].querySelector("input").style.color = 'black';
    }
    MistakesCount.innerText = mistakes;
    if (mistakes == 3) {
        OverLay.style.display = 'block';
        alertdisplay.style.top = '1%';
        alertMessage.innerHTML = 'You have made 3 mistakes. You lose!';
        closeAlert.innerHTML = 'Close';
    }
    console.log("empty Cells : " + empty_cells);
    if (empty_cells == 0) {
        OverLay.style.display = 'block';
        alertdisplay.style.top = '1%';
        alertMessage.innerHTML = 'You have successfully completed the puzzle. You Won!';
        closeAlert.innerHTML = 'Close';
    }
}
