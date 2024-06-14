const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

canvas.width = 277;
canvas.height = 400;
context.scale(23, 20);

const arena = createMatrix(12, 20);
let dropInterval = 1000;
let level = 1;
let maxLevelReached = 1;
let dropCounter = 0;
const pointsPerLevel = 10;
let isPaused = false;
let gameOver = false;

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.shadowColor = 'rgba(255, 255, 255, 1)';
                context.shadowBlur = 30;

                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.shadowColor = 'transparent';
                context.shadowBlur = 0;
            }
        });
    });
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function draw() {
    const gradient = context.createLinearGradient(0, 0, 10, 10);
    gradient.addColorStop(0, '#FFE6E6');
    gradient.addColorStop(0.2, '#FFF5E6');
    gradient.addColorStop(0.4, '#FFFFE6');
    gradient.addColorStop(0.6, '#E6FFEB');
    gradient.addColorStop(0.8, '#E6F7FF');
    gradient.addColorStop(1, '#F0E6FF');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        checkLevel();
    }
    dropCounter = 0;
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        showGameOver();
        arena.forEach(row => row.fill(0));
        checkHighScore();
        player.score = 0;
        updateScore();
        gameOver = true;
    }
}

const colors = [
    null,
    '#B30047',
    '#0099CC',
    '#009933',
    '#B200E5',
    '#CC7000',
    '#CC9900',
    '#1A53FF',
];

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function checkLevel() {
    const newLevel = Math.floor(player.score / pointsPerLevel) + 1;
    if (newLevel !== level) {
        level = newLevel;
        maxLevelReached = Math.max(maxLevelReached, level);
        dropInterval *= 0.9;
        document.body.style.backgroundColor = getRandomColor();
        updateLevel();
    }
}

function updateLevel() {
    document.getElementById('level').innerText = `Level ${level}`;
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function showPauseMessage() {
    const pauseMessage = document.getElementById('pause-message');
    const pauseInfo = document.getElementById('pause-info');
    pauseInfo.innerHTML = `
        Nivel Actual: ${level}<br>
        Puntos Actuales: ${player.score}<br>
        Puntaje Máximo: ${localStorage.getItem('tetrisPoint') || 0}
    `;
    pauseMessage.classList.remove('hidden');
    document.getElementById('pause-button').classList.add('hidden');
}

function hidePauseMessage() {
    const pauseMessage = document.getElementById('pause-message');
    pauseMessage.classList.add('hidden');
    document.getElementById('pause-button').classList.remove('hidden');
}

function checkHighScore() {
    const highScore = localStorage.getItem('tetrisPoint') || 0;
    if (player.score > highScore) {
        localStorage.setItem('tetrisPoint', player.score);
        updateHighScore();
    }
}

function updateHighScore() {
    const highScore = localStorage.getItem('tetrisPoint') || 0;
    document.getElementById('high-score').innerText = `Max: ${highScore}`;
}

function showGameOver() {
    document.getElementById('game-over').classList.remove('hidden');
}

function hideGameOver() {
    document.getElementById('game-over').classList.add('hidden');
}

document.getElementById('resume-button').addEventListener('click', () => {
    isPaused = false;
    hidePauseMessage();
    update();
});

document.getElementById('pause-button').addEventListener('click', () => {
    isPaused = true;
    showPauseMessage();
});

document.getElementById('exit').addEventListener('click', () => {
    window.close();
});

document.getElementById('restart').addEventListener('click', () => {
    hideGameOver();
    playerReset();
    updateScore();
    updateLevel();
    dropInterval = 1000;
    level = 1;
    gameOver = false;
    document.body.style.backgroundColor = '#000';
    update();
});

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    } else if (event.keyCode === 32) {
        playerRotate(1);
    }
});


let lastTime = 0;
function update(time = 0) {

    if (isPaused || gameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

document.getElementById('left-button').addEventListener('click', () => {
    playerMove(-1);
});

document.getElementById('right-button').addEventListener('click', () => {
    playerMove(1);
});

document.getElementById('down-button').addEventListener('click', () => {
    playerDrop();
});

document.getElementById('rotate-button').addEventListener('click', () => {
    playerRotate(1);
});


playerReset();
updateScore();
updateLevel();
updateHighScore();
update();