(function (root) {
    var sudoku = root.sudoku = {};  // Global reference to the sudoku library

    sudoku.DIGITS = "123456789";    // Allowed sudoku.DIGITS
    var ROWS = "ABCDEFGHI";         // Row lables
    var COLS = sudoku.DIGITS;       // Column lables
    var SQUARES = null;             // Square IDs

    var UNITS = null;               // All units (row, column, or box)
    var SQUARE_UNITS_MAP = null;    // Squares -> units map
    var SQUARE_PEERS_MAP = null;    // Squares -> peers map

    var MIN_GIVENS = 17;            // Minimum number of givens 
    var NR_SQUARES = 81;            // Number of squares

    // Define difficulties by how many squares are given to the player in a new
    // puzzle.
    var DIFFICULTY = {
        "easy": 62,
        "medium": 53,
        "hard": 44,
        "very-hard": 35,
        "insane": 26,
        "inhuman": 17,
    };

    // Blank character and board representation
    sudoku.BLANK_CHAR = '.';
    sudoku.BLANK_BOARD = "...................................................." +
        ".............................";

    // Init
    // -------------------------------------------------------------------------
    function initialize() {
        /* Initialize the Sudoku library (invoked after library load)
        */
        SQUARES = sudoku._cross(ROWS, COLS);
        UNITS = sudoku._get_all_units(ROWS, COLS);
        SQUARE_UNITS_MAP = sudoku._get_square_units_map(SQUARES, UNITS);
        SQUARE_PEERS_MAP = sudoku._get_square_peers_map(SQUARES,
            SQUARE_UNITS_MAP);
    }

    // Generate
    // -------------------------------------------------------------------------
    sudoku.generate = function (difficulty, unique) {
        /* Generate a new Sudoku puzzle of a particular `difficulty`, e.g.,
        
            // Generate an "easy" sudoku puzzle
            sudoku.generate("easy");
            
        
        Difficulties are as follows, and represent the number of given squares:
        
                "easy":         61
                "medium":       52
                "hard":         43
                "very-hard":    34
                "insane":       25
                "inhuman":      17
            
            
        You may also enter a custom number of squares to be given, e.g.,
        
            // Generate a new Sudoku puzzle with 60 given squares
            sudoku.generate(60)
    
    
        `difficulty` must be a number between 17 and 81 inclusive. If it's
        outside of that range, `difficulty` will be set to the closest bound,
        e.g., 0 -> 17, and 100 -> 81.
        
        
        By default, the puzzles are unique, uless you set `unique` to false. 
        (Note: Puzzle uniqueness is not yet implemented, so puzzles are *not* 
        guaranteed to have unique solutions)
        
        TODO: Implement puzzle uniqueness
        */

        // If `difficulty` is a string or undefined, convert it to a number or
        // default it to "easy" if undefined.
        if (typeof difficulty === "string" || typeof difficulty === "undefined") {
            difficulty = DIFFICULTY[difficulty] || DIFFICULTY.easy;
        }

        // Force difficulty between 17 and 81 inclusive
        difficulty = sudoku._force_range(difficulty, NR_SQUARES + 1,
            MIN_GIVENS);

        // Default unique to true
        unique = unique || true;

        // Get a set of squares and all possible candidates for each square
        var blank_board = "";
        for (var i = 0; i < NR_SQUARES; ++i) {
            blank_board += '.';
        }
        var candidates = sudoku._get_candidates_map(blank_board);

        // For each item in a shuffled list of squares
        var shuffled_squares = sudoku._shuffle(SQUARES);
        for (var si in shuffled_squares) {
            var square = shuffled_squares[si];

            // If an assignment of a random chioce causes a contradictoin, give
            // up and try again
            var rand_candidate_idx =
                sudoku._rand_range(candidates[square].length);
            var rand_candidate = candidates[square][rand_candidate_idx];
            if (!sudoku._assign(candidates, square, rand_candidate)) {
                break;
            }

            // Make a list of all single candidates
            var single_candidates = [];
            for (var si in SQUARES) {
                var square = SQUARES[si];

                if (candidates[square].length == 1) {
                    single_candidates.push(candidates[square]);
                }
            }

            // If we have at least difficulty, and the unique candidate count is
            // at least 8, return the puzzle!
            if (single_candidates.length >= difficulty &&
                sudoku._strip_dups(single_candidates).length >= 8) {
                var board = "";
                var givens_idxs = [];
                for (var i in SQUARES) {
                    var square = SQUARES[i];
                    if (candidates[square].length == 1) {
                        board += candidates[square];
                        givens_idxs.push(i);
                    } else {
                        board += sudoku.BLANK_CHAR;
                    }
                }

                // If we have more than `difficulty` givens, remove some random
                // givens until we're down to exactly `difficulty`
                var nr_givens = givens_idxs.length;
                if (nr_givens > difficulty) {
                    givens_idxs = sudoku._shuffle(givens_idxs);
                    for (var i = 0; i < nr_givens - difficulty; ++i) {
                        var target = parseInt(givens_idxs[i]);
                        board = board.substr(0, target) + sudoku.BLANK_CHAR +
                            board.substr(target + 1);
                    }
                }

                // Double check board is solvable
                // TODO: Make a standalone board checker. Solve is expensive.
                if (sudoku.solve(board)) {
                    return board;
                }
            }
        }

        // Give up and try a new puzzle
        return sudoku.generate(difficulty);
    };

    // Solve
    // -------------------------------------------------------------------------
    sudoku.solve = function (board, reverse) {
        /* Solve a sudoku puzzle given a sudoku `board`, i.e., an 81-character 
        string of sudoku.DIGITS, 1-9, and spaces identified by '.', representing the
        squares. There must be a minimum of 17 givens. If the given board has no
        solutions, return false.
        
        Optionally set `reverse` to solve "backwards", i.e., rotate through the
        possibilities in reverse. Useful for checking if there is more than one
        solution.
        */

        // Assure a valid board
        var report = sudoku.validate_board(board);
        if (report !== true) {
            throw report;
        }

        // Check number of givens is at least MIN_GIVENS
        var nr_givens = 0;
        for (var i in board) {
            if (board[i] !== sudoku.BLANK_CHAR && sudoku._in(board[i], sudoku.DIGITS)) {
                ++nr_givens;
            }
        }
        if (nr_givens < MIN_GIVENS) {
            throw "Too few givens. Minimum givens is " + MIN_GIVENS;
        }

        // Default reverse to false
        reverse = reverse || false;

        var candidates = sudoku._get_candidates_map(board);
        var result = sudoku._search(candidates, reverse);

        if (result) {
            var solution = "";
            for (var square in result) {
                solution += result[square];
            }
            return solution;
        }
        return false;
    };

    sudoku.get_candidates = function (board) {
        /* Return all possible candidatees for each square as a grid of 
        candidates, returnning `false` if a contradiction is encountered.
        
        Really just a wrapper for sudoku._get_candidates_map for programmer
        consumption.
        */

        // Assure a valid board
        var report = sudoku.validate_board(board);
        if (report !== true) {
            throw report;
        }

        // Get a candidates map
        var candidates_map = sudoku._get_candidates_map(board);

        // If there's an error, return false
        if (!candidates_map) {
            return false;
        }

        // Transform candidates map into grid
        var rows = [];
        var cur_row = [];
        var i = 0;
        for (var square in candidates_map) {
            var candidates = candidates_map[square];
            cur_row.push(candidates);
            if (i % 9 == 8) {
                rows.push(cur_row);
                cur_row = [];
            }
            ++i;
        }
        return rows;
    }

    sudoku._get_candidates_map = function (board) {
        /* Get all possible candidates for each square as a map in the form
        {square: sudoku.DIGITS} using recursive constraint propagation. Return `false` 
        if a contradiction is encountered
        */

        // Assure a valid board
        var report = sudoku.validate_board(board);
        if (report !== true) {
            throw report;
        }

        var candidate_map = {};
        var squares_values_map = sudoku._get_square_vals_map(board);

        // Start by assigning every digit as a candidate to every square
        for (var si in SQUARES) {
            candidate_map[SQUARES[si]] = sudoku.DIGITS;
        }

        // For each non-blank square, assign its value in the candidate map and
        // propigate.
        for (var square in squares_values_map) {
            var val = squares_values_map[square];

            if (sudoku._in(val, sudoku.DIGITS)) {
                var new_candidates = sudoku._assign(candidate_map, square, val);

                // Fail if we can't assign val to square
                if (!new_candidates) {
                    return false;
                }
            }
        }

        return candidate_map;
    };

    sudoku._search = function (candidates, reverse) {
        /* Given a map of squares -> candiates, using depth-first search, 
        recursively try all possible values until a solution is found, or false
        if no solution exists. 
        */

        // Return if error in previous iteration
        if (!candidates) {
            return false;
        }

        // Default reverse to false
        reverse = reverse || false;

        // If only one candidate for every square, we've a solved puzzle!
        // Return the candidates map.
        var max_nr_candidates = 0;
        var max_candidates_square = null;
        for (var si in SQUARES) {
            var square = SQUARES[si];

            var nr_candidates = candidates[square].length;

            if (nr_candidates > max_nr_candidates) {
                max_nr_candidates = nr_candidates;
                max_candidates_square = square;
            }
        }
        if (max_nr_candidates === 1) {
            return candidates;
        }

        // Choose the blank square with the fewest possibilities > 1
        var min_nr_candidates = 10;
        var min_candidates_square = null;
        for (si in SQUARES) {
            var square = SQUARES[si];

            var nr_candidates = candidates[square].length;

            if (nr_candidates < min_nr_candidates && nr_candidates > 1) {
                min_nr_candidates = nr_candidates;
                min_candidates_square = square;
            }
        }

        // Recursively search through each of the candidates of the square 
        // starting with the one with fewest candidates.

        // Rotate through the candidates forwards
        var min_candidates = candidates[min_candidates_square];
        if (!reverse) {
            for (var vi in min_candidates) {
                var val = min_candidates[vi];

                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val)
                );

                if (candidates_next) {
                    return candidates_next;
                }
            }

            // Rotate through the candidates backwards
        } else {
            for (var vi = min_candidates.length - 1; vi >= 0; --vi) {
                var val = min_candidates[vi];

                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val),
                    reverse
                );

                if (candidates_next) {
                    return candidates_next;
                }
            }
        }

        // If we get through all combinations of the square with the fewest
        // candidates without finding an answer, there isn't one. Return false.
        return false;
    };

    sudoku._assign = function (candidates, square, val) {
        /* Eliminate all values, *except* for `val`, from `candidates` at 
        `square` (candidates[square]), and propagate. Return the candidates map
        when finished. If a contradiciton is found, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

        // Grab a list of canidates without 'val'
        var other_vals = candidates[square].replace(val, "");

        // Loop through all other values and eliminate them from the candidates 
        // at the current square, and propigate. If at any point we get a 
        // contradiction, return false.
        for (var ovi in other_vals) {
            var other_val = other_vals[ovi];

            var candidates_next =
                sudoku._eliminate(candidates, square, other_val);

            if (!candidates_next) {
                //console.log("Contradiction found by _eliminate.");
                return false;
            }
        }

        return candidates;
    };

    sudoku._eliminate = function (candidates, square, val) {
        /* Eliminate `val` from `candidates` at `square`, (candidates[square]),
        and propagate when values or places <= 2. Return updated candidates,
        unless a contradiction is detected, in which case, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

        // If `val` has already been eliminated from candidates[square], return
        // with candidates.
        if (!sudoku._in(val, candidates[square])) {
            return candidates;
        }

        // Remove `val` from candidates[square]
        candidates[square] = candidates[square].replace(val, '');

        // If the square has only candidate left, eliminate that value from its 
        // peers
        var nr_candidates = candidates[square].length;
        if (nr_candidates === 1) {
            var target_val = candidates[square];

            for (var pi in SQUARE_PEERS_MAP[square]) {
                var peer = SQUARE_PEERS_MAP[square][pi];

                var candidates_new =
                    sudoku._eliminate(candidates, peer, target_val);

                if (!candidates_new) {
                    return false;
                }
            }

            // Otherwise, if the square has no candidates, we have a contradiction.
            // Return false.
        } if (nr_candidates === 0) {
            return false;
        }

        // If a unit is reduced to only one place for a value, then assign it
        for (var ui in SQUARE_UNITS_MAP[square]) {
            var unit = SQUARE_UNITS_MAP[square][ui];

            var val_places = [];
            for (var si in unit) {
                var unit_square = unit[si];
                if (sudoku._in(val, candidates[unit_square])) {
                    val_places.push(unit_square);
                }
            }

            // If there's no place for this value, we have a contradition!
            // return false
            if (val_places.length === 0) {
                return false;

                // Otherwise the value can only be in one place. Assign it there.
            } else if (val_places.length === 1) {
                var candidates_new =
                    sudoku._assign(candidates, val_places[0], val);

                if (!candidates_new) {
                    return false;
                }
            }
        }

        return candidates;
    };


    // Square relationships
    // -------------------------------------------------------------------------
    // Squares, and their relationships with values, units, and peers.

    sudoku._get_square_vals_map = function (board) {
        /* Return a map of squares -> values
        */
        var squares_vals_map = {};

        // Make sure `board` is a string of length 81
        if (board.length != SQUARES.length) {
            throw "Board/squares length mismatch.";

        } else {
            for (var i in SQUARES) {
                squares_vals_map[SQUARES[i]] = board[i];
            }
        }

        return squares_vals_map;
    };

    sudoku._get_square_units_map = function (squares, units) {
        /* Return a map of `squares` and their associated units (row, col, box)
        */
        var square_unit_map = {};

        // For every square...
        for (var si in squares) {
            var cur_square = squares[si];

            // Maintain a list of the current square's units
            var cur_square_units = [];

            // Look through the units, and see if the current square is in it,
            // and if so, add it to the list of of the square's units.
            for (var ui in units) {
                var cur_unit = units[ui];

                if (cur_unit.indexOf(cur_square) !== -1) {
                    cur_square_units.push(cur_unit);
                }
            }

            // Save the current square and its units to the map
            square_unit_map[cur_square] = cur_square_units;
        }

        return square_unit_map;
    };

    sudoku._get_square_peers_map = function (squares, units_map) {
        /* Return a map of `squares` and their associated peers, i.e., a set of
        other squares in the square's unit.
        */
        var square_peers_map = {};

        // For every square...
        for (var si in squares) {
            var cur_square = squares[si];
            var cur_square_units = units_map[cur_square];

            // Maintain list of the current square's peers
            var cur_square_peers = [];

            // Look through the current square's units map...
            for (var sui in cur_square_units) {
                var cur_unit = cur_square_units[sui];

                for (var ui in cur_unit) {
                    var cur_unit_square = cur_unit[ui];

                    if (cur_square_peers.indexOf(cur_unit_square) === -1 &&
                        cur_unit_square !== cur_square) {
                        cur_square_peers.push(cur_unit_square);
                    }
                }
            }

            // Save the current square an its associated peers to the map
            square_peers_map[cur_square] = cur_square_peers;
        }

        return square_peers_map;
    };

    sudoku._get_all_units = function (rows, cols) {
        /* Return a list of all units (rows, cols, boxes)
        */
        var units = [];

        // Rows
        for (var ri in rows) {
            units.push(sudoku._cross(rows[ri], cols));
        }

        // Columns
        for (var ci in cols) {
            units.push(sudoku._cross(rows, cols[ci]));
        }

        // Boxes
        var row_squares = ["ABC", "DEF", "GHI"];
        var col_squares = ["123", "456", "789"];
        for (var rsi in row_squares) {
            for (var csi in col_squares) {
                units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
            }
        }

        return units;
    };


    // Conversions
    // -------------------------------------------------------------------------
    sudoku.board_string_to_grid = function (board_string) {
        /* Convert a board string to a two-dimensional array
        */
        var rows = [];
        var cur_row = [];
        for (var i in board_string) {
            cur_row.push(board_string[i]);
            if (i % 9 == 8) {
                rows.push(cur_row);
                cur_row = [];
            }
        }
        return rows;
    };

    sudoku.board_grid_to_string = function (board_grid) {
        /* Convert a board grid to a string
        */
        var board_string = "";
        for (var r = 0; r < 9; ++r) {
            for (var c = 0; c < 9; ++c) {
                board_string += board_grid[r][c];
            }
        }
        return board_string;
    };


    // Utility
    // -------------------------------------------------------------------------

    sudoku.print_board = function (board) {
        /* Print a sudoku `board` to the console.
        */

        // Assure a valid board
        var report = sudoku.validate_board(board);
        if (report !== true) {
            throw report;
        }

        var V_PADDING = " ";  // Insert after each square
        var H_PADDING = '\n'; // Insert after each row

        var V_BOX_PADDING = "  "; // Box vertical padding
        var H_BOX_PADDING = '\n'; // Box horizontal padding

        var display_string = "";

        for (var i in board) {
            var square = board[i];

            // Add the square and some padding
            display_string += square + V_PADDING;

            // Vertical edge of a box, insert v. box padding
            if (i % 3 === 2) {
                display_string += V_BOX_PADDING;
            }

            // End of a line, insert horiz. padding
            if (i % 9 === 8) {
                display_string += H_PADDING;
            }

            // Horizontal edge of a box, insert h. box padding
            if (i % 27 === 26) {
                display_string += H_BOX_PADDING;
            }
        }

        console.log(display_string);
    };

    sudoku.validate_board = function (board) {
        /* Return if the given `board` is valid or not. If it's valid, return
        true. If it's not, return a string of the reason why it's not.
        */

        // Check for empty board
        if (!board) {
            return "Empty board";
        }

        // Invalid board length
        if (board.length !== NR_SQUARES) {
            return "Invalid board size. Board must be exactly " + NR_SQUARES +
                " squares.";
        }

        // Check for invalid characters
        for (var i in board) {
            if (!sudoku._in(board[i], sudoku.DIGITS) && board[i] !== sudoku.BLANK_CHAR) {
                return "Invalid board character encountered at index " + i +
                    ": " + board[i];
            }
        }

        // Otherwise, we're good. Return true.
        return true;
    };

    sudoku._cross = function (a, b) {
        /* Cross product of all elements in `a` and `b`, e.g.,
        sudoku._cross("abc", "123") ->
        ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"]
        */
        var result = [];
        for (var ai in a) {
            for (var bi in b) {
                result.push(a[ai] + b[bi]);
            }
        }
        return result;
    };

    sudoku._in = function (v, seq) {
        /* Return if a value `v` is in sequence `seq`.
        */
        return seq.indexOf(v) !== -1;
    };

    sudoku._first_true = function (seq) {
        /* Return the first element in `seq` that is true. If no element is
        true, return false.
        */
        for (var i in seq) {
            if (seq[i]) {
                return seq[i];
            }
        }
        return false;
    };

    sudoku._shuffle = function (seq) {
        /* Return a shuffled version of `seq`
        */

        // Create an array of the same size as `seq` filled with false
        var shuffled = [];
        for (var i = 0; i < seq.length; ++i) {
            shuffled.push(false);
        }

        for (var i in seq) {
            var ti = sudoku._rand_range(seq.length);

            while (shuffled[ti]) {
                ti = (ti + 1) > (seq.length - 1) ? 0 : (ti + 1);
            }

            shuffled[ti] = seq[i];
        }

        return shuffled;
    };

    sudoku._rand_range = function (max, min) {
        /* Get a random integer in the range of `min` to `max` (non inclusive).
        If `min` not defined, default to 0. If `max` not defined, throw an 
        error.
        */
        min = min || 0;
        if (max) {
            return Math.floor(Math.random() * (max - min)) + min;
        } else {
            throw "Range undefined";
        }
    };

    sudoku._strip_dups = function (seq) {
        /* Strip duplicate values from `seq`
        */
        var seq_set = [];
        var dup_map = {};
        for (var i in seq) {
            var e = seq[i];
            if (!dup_map[e]) {
                seq_set.push(e);
                dup_map[e] = true;
            }
        }
        return seq_set;
    };

    sudoku._force_range = function (nr, max, min) {
        /* Force `nr` to be within the range from `min` to, but not including, 
        `max`. `min` is optional, and will default to 0. If `nr` is undefined,
        treat it as zero.
        */
        min = min || 0
        nr = nr || 0
        if (nr < min) {
            return min;
        }
        if (nr > max) {
            return max;
        }
        return nr
    }

    // Initialize library after load
    initialize();

    // Pass whatever the root object is, lsike 'window' in browsers
})(this);




document.addEventListener("DOMContentLoaded", function () {
    const puzzleGrid = document.getElementById("puzzle-grid");
    const solveButton = document.getElementById("solve-button");
    const submitButton = document.getElementById("submit-button");

    const urlParams = new URLSearchParams(window.location.search);
    const selectedOption = urlParams.get('selectedOption');
    const gotohomepage = document.getElementById("homepagebutton");

    const difficultyelemnt = document.getElementById("difficultybox");
    difficultyelemnt.innerText = "DIFFICULTY: " + selectedOption;

    var puzzleString;
    if (selectedOption == "EASY") {
        puzzleString = sudoku.generate("easy");

    } else if (selectedOption == "MEDIUM") {
        puzzleString = sudoku.generate("hard");
    } else {
        puzzleString = sudoku.generate("insane");
    }

    const grid = fillnumbersinGrid(puzzleString);



    fillcellsinSudokuGrid(puzzleGrid, grid);

    solveButton.addEventListener("click", function () {
        solveSudoku(grid);
        updateSudokuGrid(puzzleGrid, grid);
        hideallButton();
    });

    submitButton.addEventListener("click", function () {
        let emptyCellCount = 0;
        emptyCellCount = countEmptyCells();
        if (emptyCellCount !== 0) {
            alert("SUDOKU IS NOT COMPLETELY FILLED");
        }
        else {
            const isCorrect = checkingSolvedSudoku(puzzleGrid);

            if (isCorrect == true) {
                openModal("You Won!", "🎉");
            } else {
                openModal("You Lose !", "🎉");
            }
        }
    });

    gotohomepage.addEventListener("click", function () {
        window.location.href = `sudoku_start_page.html`;
    });

    puzzleGrid.addEventListener("input", function (event) {
        handleInput(event, grid);
    });

});

function fillcellsinSudokuGrid(puzzleGrid, grid) {
    console.log("Script is running");
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
            }
            cell.appendChild(input);
            row.appendChild(cell);
        }

        puzzleGrid.appendChild(row);
    }
}


function fillnumbersinGrid(puzzleString) {
    var puzzleArray = [];
    for (var i = 0; i < puzzleString.length; i += 9) {
        puzzleArray.push(puzzleString.slice(i, i + 9).split(''));
    }
    return puzzleArray;
}



function solveSudoku(grid) {
    if (solveSudokuHelper(grid)) {
        return true;
    }
    return false;
}

function solveSudokuHelper(grid) {
    const emptyCell = findEmptyCell(grid);

    // If there is no empty cell, the puzzle is solved
    if (!emptyCell) {
        return true;
    }

    const [row, col] = emptyCell;

    // Try filling the empty cell with digits 1 to 9
    for (let num = 1; num <= 9; num++) {
        const numStr = num.toString();
        if (isSafe(grid, row, col, numStr)) {
            grid[row][col] = numStr;

            // Recursively try to solve the rest of the puzzle
            if (solveSudokuHelper(grid)) {
                return true;
            }

            // If the current placement doesn't lead to a solution, backtrack
            grid[row][col] = '.';
        }
    }

    // No valid number found, backtrack
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
            input.value = grid[i][j] === "." ? "" : grid[i][j].toString();
        }

    }
}



function checkingSolvedSudoku(puzzleGrid) {
    const rows = puzzleGrid.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");

        for (let j = 0; j < cells.length; j++) {
            const input = cells[j].querySelector("input").value;

            let flagForSameElement = 0;

            // Check within the same row
            for (let cord1 = 0; cord1 < 9; cord1++) {
                const input2 = cells[cord1].querySelector("input").value;
                if (cord1 == j) {
                    continue;
                } else if (input == input2) {
                    flagForSameElement = 1;
                }
            }

            // Check within the same column
            for (let cord2 = 0; cord2 < 9; cord2++) {
                const input3 = rows[cord2].getElementsByTagName("td")[j].querySelector("input").value;
                if (cord2 == i) {
                    continue;
                } else if (input == input3) {
                    flagForSameElement = 1;
                }
            }

            if (flagForSameElement == 1) {
                return false;
            }
        }
    }

    const invalidInputs = puzzleGrid.querySelectorAll("input:invalid");
    if (invalidInputs.length > 0) {
        return false;
    }

    return true;
}




function openModal(texttodiplay, emoji) {
    // Display the modal
    document.getElementById('myModal').style.display = 'block';
    if (texttodiplay == "You Won!")
        document.getElementById('changabletext').innerText =
            emoji + " " + texttodiplay + " " + emoji;
    else {
        document.getElementById('changabletext').innerText =
            texttodiplay;
    }
}

function closeModal() {
    // Close the modal
    // console.log("Clicking on cross button");
    document.getElementById('myModal').style.display = 'none';
    window.location.href = `sudoku_start_page.html`;
}

// Close the modal if the user clicks outside of it
// window.onclick = function (event) {
//     var modal = document.getElementById('myModal');
//     if (event.target == modal) {
//         console.log("Clicking on cross button");
//         modal.style.display = 'none';
//     }
// }


function handleInput(event, grid) {
    const input = event.target;
    const row = input.parentNode.parentNode.rowIndex;
    const col = input.parentNode.cellIndex;

    const inputValue = input.value;

    // Check if the cell is not skyblue (not readOnly)
    if (!input.readOnly) {
        // Allow only numbers between 1 and 9
        if (/^[1-9]$/.test(inputValue)) {
            // Update the grid with the entered value
            grid[row][col] = inputValue;
        } else if (inputValue === "") {
            // For the Backspace key, clear the cell
            grid[row][col] = ".";
        } else {
            // If an invalid input is entered, clear the input
            alert("Inserting invalid character");
            input.value = "";
        }
    } else {
        // If the cell is skyblue (readOnly), prevent any changes
        input.value = "";
    }
}



let seconds = 0;

// Function to update the timer
function updateTimer() {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // Format the time as HH:MM:SS
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

    // Update the timer element
    document.getElementById('timer').innerText = formattedTime;

    // Increment the seconds
    seconds++;
}

// Update the timer every second (1000 milliseconds)
setInterval(updateTimer, 1000);




function hideallButton() {
    // Get the button element by its id
    var button1 = document.getElementById("solve-button");
    var button2 = document.getElementById("submit-button");
    var button3 = document.getElementById("timerbox");
    var button4 = document.getElementById("homepagebutton");
    var button5 = document.getElementById("difficultybox");

    // Check if the button1 element exists
    if (button1) {
        // Hide the button1 element
        button1.style.display = "none";
        button4.style.display = "block";



        // Hide the button1 element
        button2.style.display = "none";



        // Hide the button1 element
        button3.style.display = "none";

        button5.style.display = "none";
    }
}



function countEmptyCells() {
    // Get the puzzle grid table element
    const puzzleGrid = document.getElementById("puzzle-grid");

    // Initialize a variable to count empty cells
    let emptyCellCount = 0;

    // Iterate through rows
    for (let i = 0; i < puzzleGrid.rows.length; i++) {
        // Iterate through cells in each row
        for (let j = 0; j < puzzleGrid.rows[i].cells.length; j++) {
            // Get the input element in the current cell
            const input = puzzleGrid.rows[i].cells[j].querySelector("input");

            // Check if the input value is empty
            if (input.value.trim() === "") {
                emptyCellCount++;
            }
        }
    }

    // Return the count of empty cells
    return emptyCellCount;
}