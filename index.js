let blessed = require('blessed');

let screen = blessed.screen({
    smartCSR: true
});

screen.title = "Terminal Tetris";

const gridWidth = 10; // Width of the Tetris board
const gridHeight = 20;

const Tetromino = {
    square: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: 'blue'
    },
    I: {
        shape: [
            [1, 1, 1, 1]
        ],
        color: 'cyan'
    },
    L: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: 'yellow'
    },
    J: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: 'magenta'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: 'green'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: 'red'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: 'white'
    }
};

const randomProp = obj => Object.keys(obj)[(Math.random() * Object.keys(obj).length) | 0];

const getRandomTetromino = () => {
    let randomTetrominoKey = randomProp(Tetromino);
    return {
        shape: Tetromino[randomTetrominoKey].shape,
        color: Tetromino[randomTetrominoKey].color,
        x: Math.floor(gridWidth / 2) - Math.floor(Tetromino[randomTetrominoKey].shape[0].length / 2),
        y: 0
    };
};

let currentTetromino = getRandomTetromino();


let gameState = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0));


let mainGameFrame = blessed.box({
    top: 'center',
    left: 'center',
    width: gridWidth * 2 + 2,
    height: gridHeight + 2,
    label: 'Tetris',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        border: {
            fg: '#f0f0f0'
        },
    }
});

screen.append(mainGameFrame);

const canMoveDown = () => {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
                let newY = currentTetromino.y + y + 1;
                if (newY >= gridHeight - 1 || gameState[newY][currentTetromino.x-1]) {
                    return false;
                }
            }
        }
    }
    return true;
};



const gameLoop = () => {
    if (canMoveDown()) {
        currentTetromino.y++;
    } else {
        mergeTetromino();
        resetTetromino();
    }

    renderGameState();
};



const mergeTetromino = () => {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
                gameState[currentTetromino.y + y][currentTetromino.x + x] = currentTetromino.color;
            }
        }
    }
};

const resetTetromino = () => {
    currentTetromino = getRandomTetromino();
};

setInterval(gameLoop, 1000);

const renderGameState = () => {
    mainGameFrame.setContent('');

    for (let y = 0; y < gridHeight; y++) {
        let line = '';
        for (let x = 0; x < gridWidth; x++) {
            let cell = gameState[y][x];
            let isTetrominoCell = false;

            for (let ty = 0; ty < currentTetromino.shape.length; ty++) {
                for (let tx = 0; tx < currentTetromino.shape[ty].length; tx++) {
                    if (currentTetromino.shape[ty][tx] &&
                        ty + currentTetromino.y === y &&
                        tx + currentTetromino.x === x) {
                        isTetrominoCell = true;
                    }
                }
            }

            if (isTetrominoCell) {
                line += `{${currentTetromino.color}-fg}[]{/}`;
            } else if (cell) {
                line += `{${cell}-fg}[]{/}`;
            } else {
                line += '  ';
            }
        }
        mainGameFrame.insertBottom(line);
    }

    screen.render();
};

const rotateTetromino = (tetromino) => {
    const type = Object.keys(Tetromino).find(key => Tetromino[key].shape.toString() === tetromino.shape.toString());
    if(type == 'square') return;

    let rotatedShape = tetromino.shape[0].map((val, index) => 
        tetromino.shape.map(row => row[index]).reverse()
    );

    if(type == 'I') {
        rotatedShape = rotatedShape.length === 1 ? [[1], [1], [1], [1]] : [[1, 1, 1, 1]];
    } else if (['S', 'Z'].includes(type)) {
        rotatedShape = rotatedShape.length === 2 ? rotatedShape[0].map((val, index) =>
            rotatedShape.map(row => row[index])
        ) : rotatedShape;
    }

    let newX = tetromino.x;
    let newY = tetromino.y;
    if(newX + rotatedShape[0].length > gridWidth) {
        newX = gridWidth - rotatedShape[0].length;
    }
    if(newY + rotatedShape.length > gridHeight) {
        newY = gridHeight - rotatedShape.length;
    }

    tetromino.shape = rotatedShape;
    tetromino.x = newX;
    tetromino.y = newY;
};

screen.key(['left', 'right', 'down', 'up', 'escape', 'q', 'C-c'], (ch, key) => {
    switch (key.name) {
        case 'left':
            currentTetromino.x = Math.max(currentTetromino.x - 1, 0);
            break;
        case 'right':
            currentTetromino.x = Math.min(currentTetromino.x + 1, gridWidth - currentTetromino.shape[0].length);
            break;
        case 'down':
            if (canMoveDown()) {
                currentTetromino.y++;
            } else {
                mergeTetromino();
                resetTetromino();
            }
            break;
        case 'up':
            rotateTetromino(currentTetromino);
            break;
        case 'escape':
        case 'q':
        case 'C-c':
            return process.exit(0);
    }
    renderGameState();
});

mainGameFrame.focus();

let savedForLater = blessed.box({
    top: 'left',
    left: '5%',
    width: '15%',
    height: '25%',
    label: 'Saved',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: 'white'
        }
    }
});

let upNext = blessed.box({
    top: 'right',
    left: '80%',
    width: '15%',
    height: '25%',
    label: 'Next',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: 'white'
        }
    }
});

let scoreBox = blessed.box({
    top: '80%',
    left: '5%',
    width: '15%',
    height: '15%',
    label: 'Score',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: 'white'
        }
    }
});

screen.append(mainGameFrame);
screen.append(savedForLater);
screen.append(upNext);
screen.append(scoreBox);


screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
});

mainGameFrame.focus();

screen.render();