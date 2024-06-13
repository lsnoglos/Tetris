const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

canvas.width = 300;
canvas.height = 600;
context.scale(20, 20);

function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

const arena = createMatrix(12, 20);
