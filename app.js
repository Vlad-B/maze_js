alert('To move the ball, use the keys W A S D');

const { Engine, Render, World, Runner, Bodies, Body, Events } = Matter;

const cellsHorizontal = 9;
const cellsVertical = 8;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element : document.body,
	engine  : engine,
	options : {
		wireframes : false,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

// Maze Generator
const shuffle = (arr) => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);
		counter--;
		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const rowStart = Math.floor(Math.random() * cellsVertical);
const colStart = Math.floor(Math.random() * cellsHorizontal);

const recursion = (row, column) => {
	// If I have visited cell at [row, column], then return
	if (grid[row][column]) return;

	// Mark this cell as being visited
	grid[row][column] = true;

	// Assembe randomly-generated list of neighbours
	const neighbours = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);

	//For each neighbour...
	for (let neighbour of neighbours) {
		const [ nextRow, nextColumn, direction ] = neighbour;

		// See if that neighbour is out of bounds
		if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) continue;

		// If we have visited that neigbour, continue to the next neighbour
		if (grid[nextRow][nextColumn]) continue;

		// Remove a wall from either horizontal or vertical
		if (direction === 'left') verticals[row][column - 1] = true;
		else if (direction === 'right') verticals[row][column] = true;
		else if (direction === 'up') horizontals[row - 1][column] = true;
		else if (direction === 'down') horizontals[row][column] = true;
		recursion(nextRow, nextColumn);
	}
	// Visit that next cell
};

recursion(rowStart, colStart);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			10,
			{
				label    : 'innerWall',
				isStatic : true,
				render   : {
					fillStyle : '#FF6A3F'
				}
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			10,
			unitLengthY,
			{
				label    : 'innerWall',
				isStatic : true,
				render   : {
					fillStyle : 'FF6A3F'
				}
			}
		);
		World.add(world, wall);
	});
});

// Goal
const squareGoal = Math.min(unitLengthX, unitLengthY) * 0.7;
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, squareGoal, squareGoal, {
	isStatic : true,
	label    : 'goal',
	render   : {
		fillStyle : '#F21818'
	}
});
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label  : 'ball',
	render : {
		fillStyle : '#0066FF'
	}
});
World.add(world, ball);

document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;
	if (event.key === 'w') {
		Body.setVelocity(ball, { x, y: -10 });
	}
	if (event.key === 'd') {
		Body.setVelocity(ball, { x: +10, y });
	}
	if (event.key === 's') {
		Body.setVelocity(ball, { x, y: 10 });
	}
	if (event.key === 'a') {
		Body.setVelocity(ball, { x: -10, y });
	}
});

// Win Condition
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];
		if (collision.bodyA.label.includes('goal') && collision.bodyB.label.includes('ball')) {
			{
				world.gravity.y = 1;
				document.querySelector('.winner').classList.remove('hidden');
				world.bodies.forEach((body) => {
					if (body.label.includes('innerWall')) {
						Body.setStatic(body, false);
					}
				});
			}
		}
	});
});
