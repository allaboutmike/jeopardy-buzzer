const crypto = require('crypto');
const socketIO = require('socket.io');

const {
  IP_SALT,
} = process.env;

module.exports = (server) => {
  const io = socketIO(server, {
		cors: {
			origin: ['http://localhost:5000', 'http://buzzer.pointofoblivion.ca'],
			methods: ["GET", "POST"]
		}
	});

  const byIPHash = {};
  const state = {
		playerInfo: {}, // Players by client id. values can be name, team, and id
		gameStarted: false,
		host: undefined,
		teamInfo: {}, // Teams by team name, contains players and points
		roundInfo: { // Info about the current round
			buzzersActive: false,
			answeringTeam: undefined,
			answeringPlayer: undefined,
			answeredTeams: [],
		}
	};

	let buzzerPressQueue = [];
  const connectedStart = {};
  const lastMessage = {};
  const errors = {};

  // eslint-disable-next-line
  async function onConnection(socket) {
    connectedStart[socket.id] = Date.now();
    const ip = socket.handshake.address;
		console.log(`IP: ${ip}`);
    const hashedIP = crypto.createHash('md5').update(IP_SALT + ip + IP_SALT).digest('hex');
    if (byIPHash[hashedIP]) {
      if (byIPHash[hashedIP] >= 5) {
        console.log(hashedIP, 'Maximum connection limit reached.');
        socket.emit('update-error', 'Maximum connection limit reached.');
        return socket.disconnect(true);
      }
      byIPHash[hashedIP] += 1;
    } else {
      byIPHash[hashedIP] = 1;
    }

		console.log('connected', socket.id);
    socket.emit('state', state);

		let clients = await io.allSockets(); // Set<Socket>
    console.log('Connected clients:', clients.size);
		console.log(byIPHash);

		/***********************
		 * COMMON EVENTS
		 ***********************/
		function setName(name) {
			state.playerInfo[socket.id] = state.playerInfo[socket.id] || {};
			state.playerInfo[socket.id].name = name;
			state.playerInfo[socket.id].id = socket.id;
			console.log(`${socket.id} name set to ${name}`);
		}

		// Test the speed of the connection
		function pingPong(timestamp, ack) {
			let latency = Date.now() - timestamp;
			lastMessage[socket.id] = Date.now();
			ack(latency);
		}

		/********************
		 * PLAYER EVENTS
		 ********************/
		function hitBuzzer() {
			// If the buzzers are active, create a queue of buzzer presses
			if (state.roundInfo.buzzersActive && state.host !== socket.id) {
				console.log(`Buzz recieved from ${socket.id}`);
				buzzerPressQueue.push(socket.id);
			}
		}

		function setTeam(team) {
			// can't switch teams once the game is started, unless they don't have one
			if (!state.gameStarted || state.playerInfo[socket.id].team === undefined) {
				// verify that the team exists
				if (state.teamInfo[team]) {
					// If they are currently in a team, remove them from it.
					const currentTeam = state.playerInfo[socket.id].team;
					if (state.teamInfo[currentTeam]) {
						const index = state.teamInfo[currentTeam].players.indexOf(socket.id);
						if (index > -1) {
							state.teamInfo[currentTeam].players.splice(index, 1);
						}
					}

					state.playerInfo[socket.id] = state.playerInfo[socket.id] || {};
					state.playerInfo[socket.id].team = team;
					state.teamInfo[team].players.push(socket.id);
					console.log(`${socket.id} joined ${team}`);
				}
			}
		}

		/**********************
		 * HOST EVENTS
		 **********************/
		function setHost(ack) {
			if (!state.host) {
        console.log(`Setting host to ${socket.id}`);
				state.host = socket.id;
        state.playerInfo[socket.id] = state.playerInfo[socket.id] || {};
				state.playerInfo[socket.id].isHost = true;
				ack(true);
			}
			ack(false);
		}

		function startGame() {
			if (state.host !== socket.id) return;
			state.gameStarted = true;
			state.roundInfo = getDefaultRoundInfo();
			buzzerPressQueue = [];

			// Clear the points for the teams (if this is a new game)
			Object.entries(state.teamInfo).forEach((teamEntry) => {
				teamEntry[1].points = 0;
			});
			console.log(`Game started`);
		}

		function endGame() {
			if (state.host !== socket.id) return;
			state.gameStarted = false;
			state.roundInfo = getDefaultRoundInfo();
			buzzerPressQueue = [];
			console.log(`Game finshed`);
		}

		function nextRound() {
			if (state.host !== socket.id) return;
			state.roundInfo = getDefaultRoundInfo();
			buzzerPressQueue = [];
			console.log(`Next Round Started`);
		}

		function activateBuzzers() {
			if (state.host === socket.id) {
				if (state.gameStarted) {
					state.roundInfo.answeringPlayer = undefined;
					state.roundInfo.answeringTeam = undefined;
					state.roundInfo.buzzersActive = true;
					console.log(`Buzzers Activated`);
				}
			}
		}

		function createTeam(team) {
			// Only the host creates teams, and it must be before the game.
			if (state.host === socket.id && !state.gameStarted && !state.teamInfo[team]) {
				state.teamInfo[team] = {}
				state.teamInfo[team].players = [];
				state.teamInfo[team].points = 0;
        console.log(`${team} created`);
			}
		}

		function assignPoints(team, points) {
			if (state.host === socket.id && state.teamInfo[team]) {
				state.teamInfo[team].points += points;
			}
			console.log(`Assgined ${team} ${points} points`);
		}

		function getDefaultRoundInfo() {
			return {
					buzzersActive: false,
					answeringTeam: undefined,
					answeringPlayer: undefined,
					answeredTeams: [],
			}
		}

		async function disconnected() {
      console.log('disconnected', socket.id);
      byIPHash[hashedIP] -= 1;

      if (byIPHash[hashedIP] === 0) {
        delete byIPHash[hashedIP];
      }

      if (state.host === socket.id) {
        // host has left
        state.host = undefined;
      }

			if (state.playerInfo[socket.id]) {
				let team = state.playerInfo[socket.id].team;
				if (state.teamInfo[team]) {
					const index = state.teamInfo[team].players.indexOf(socket.id);
					if (index > -1) {
						state.teamInfo[team].players.splice(index, 1);
					}
				}
			}

      delete state.playerInfo[socket.id];
      delete errors[socket.id];
      delete lastMessage[socket.id];
      delete connectedStart[socket.id];

      clients = await io.allSockets();
      console.log('Connected clients:', clients.size);
    }

    // eslint-disable-next-line
    socket.on('disconnect', disconnected);
		// Common events
		socket.on('set-name', setName);
		socket.on('ping', pingPong);

		// Player events
		socket.on('set-team', setTeam);
		socket.on('buzz', hitBuzzer);

		// Host events
		socket.on('set-host', setHost);
		socket.on('start-game', startGame);
		socket.on('end-game', endGame);
		socket.on('next-round', nextRound);
		socket.on('activate-buzzers', activateBuzzers);

		socket.on('create-team', createTeam);
		socket.on('assign-points', assignPoints);
  }

	function updateGameState() {
		// If buzzers are active in the round, determine the player that buzzed first
		if (state.roundInfo.buzzersActive) {
			console.log(`Checking for buzzer presses`);
			console.log(`Buzzer Queue has ${buzzerPressQueue.length} entries`);
			// Deactivate the buzzers for now
			state.roundInfo.buzzersActive = false;
			let winnerFound = false;
			while (buzzerPressQueue.length > 0 && !winnerFound) {
				let candidate = buzzerPressQueue.shift();
				if (state.playerInfo[candidate].team !== undefined &&
						state.roundInfo.answeredTeams.indexOf(state.playerInfo[candidate].team) === -1) {
					// player won the buzzer press
					state.roundInfo.answeringPlayer = candidate;
					state.roundInfo.answeringTeam = state.playerInfo[candidate].team;
					state.roundInfo.answeredTeams.push(state.playerInfo[candidate].team);
					winnerFound = true;
					console.log(`${candidate} on ${state.roundInfo.answeringTeam} hit the buzzer first`);
				} else if (state.playerInfo[candidate].team === undefined) {
					console.log(`${candidate} is not on a team`);
				} else {
					console.log(`${candidate}s team already answered this round`);
				}
			}

			if (!winnerFound) {
				console.log(`No buzzer presses this update`);
				state.roundInfo.buzzersActive = true;
			} else {
				// If we have a winner, clear the queue and keep the buzzers off.
				buzzerPressQueue = [];
			}
		}
	}

  io.on('connection', onConnection);

  async function sendUpdate() {
		// Update game state
		updateGameState();
		// Send the complete game state on each update
		io.volatile.emit('state', state);
    setTimeout(sendUpdate, 500);
  }

  setTimeout(sendUpdate, 500);
};
