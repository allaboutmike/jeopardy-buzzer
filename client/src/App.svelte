<script>
	import io from 'socket.io-client';
	import Buzzer from './components/Buzzer.svelte';
	import HostControls from './components/HostControls.svelte';
	import TeamDetails from './components/TeamDetails.svelte';

	import { state } from './scripts/stores.js';

	// player status
	let joined = false;
	let name = '';

	let team = undefined;

	// Connection management
	let connected = false;
	let latency = 0;

	let playersById = {
		value: {},
	};
	let teamsByName = {
		value: {},
	};

	let socket = io(':3000');

	socket.on('update-error', (message) => {
    // eslint-disable-next-line
    console.error(message);
    if (message === 'Idle timeout.') {
			console.log('Idle');
		}
  });

	// Handle state updates from the server
	socket.on('state', (newState) => {
		if (newState) {
			state.update(() => newState);

			if (Object.entries(newState.playerInfo).length > 0) {
				playersById.value = Object.entries(newState.playerInfo).reduce((byId, [id, clientState]) => {
					// Check to ensure that we are part of the state
					if (socket.id === id) {
						joined = true;
					}

					const client = {
						id,
						name: clientState.name,
						team: clientState.team,
					}
					byId[id] = client;

					return byId;
				},
				{});
			}
			if (Object.entries(newState.teamInfo).length > 0) {
				teamsByName.value = Object.entries(newState.teamInfo).reduce((byName, [name, teamInfo]) => {
					const team = {
						name,
						players: teamInfo.players,
						points: teamInfo.points,
					}
					byName[name] = team;
					return byName;
				},
				{});
			}
		}
	});

	// Join the game as the host
	function joinAsHost() {
		if ($state.host === undefined) {
			socket.emit('set-host', (isHost) => {
					if (isHost) {
						socket.emit('set-name', name);
					}
				}
			);
		}
	}

	// Join the game as a player
	function joinAsPlayer() {
		socket.emit('set-name', name);
	}

	function isHost() {
		return ($state.host && $state.host === socket.id);
	}

	function getHostName() {
		if (!playersById.value[$state.host]) {
			return 'nobody (yet)';
		}
		return playersById.value[$state.host].name;
	}
	// Startup a heartbeat
	function pingPong() {
		// TODO setup a "missed" counter to see if the connection drops
		let timestamp = Date.now();
		socket.emit('ping', timestamp, (delay) => {
			connected = true;
			latency = delay;
		});
		setTimeout(pingPong, 2000);
	}

	setTimeout(pingPong, 2000);

	// Reactive response to name changes.
	$: active = () => {
		if ($state.roundInfo) {
			return $state.roundInfo.buzzersActive;
		}
		return false;
//		return $state.roundInfo ? $state.roundInfo.buzzersActive : false;
	}
	$: hostDisabled = $state.host !== undefined;
</script>

<main class="text-white max-w-7xl mx-auto bg-gray-900 min-h-screen">
	<!-- banner -->
	<div class="bg-gray-800 py-3 px-3 sm:px-6 lg:px-8 flex items-center border-gray-500 border-2 rounded">
		<div class="flex-1 text-center">
			<h1 class="text-4xl sm:text-6xl md:text-8xl uppercase">Jeopardy!</h1>
		</div>
	</div>
	<section id="content" class="px-3">
		{#if connected}
			<!-- Connection status header -->
			<div class="my-1 flex content-start space-between">
				<div id="connectionInfo" class="flex-1">
					<svg height="32" width="32">
						<circle cx="16" cy="16" r="8" fill="green" />
						<title>Connected. ({latency}ms latency)</title>
					</svg>
				</div>
				<div id="game-status" class="flex-1 text-center">
					<span class="font-semibold text-base">Game status:</span>
					{#if $state.gameStarted }
						Started
					{:else}
						In the waiting room
					{/if}
				</div>
			</div>

			{#if !joined}
				<div id="introContainer" class="py-3 md:py-6 bg-gray-700">
					<form class="flex flex-col content-center justify-center">
						<div class="flex-1 self-center w-1/2">
							<label for="nameInput">Your name: </label>
							<input class="input w-full text-lg" type="text" id="nameInput" autocomplete="off" bind:value={name} />
						</div>
						<div class="flex-1 my-3 flex justify-between self-center w-1/2">
							<button class="flex-1 btn btn-purple mx-2" type="button" disabled="{hostDisabled}" on:click="{() => joinAsHost()}">Join As Host</button>
							<button class="flex-1 btn btn-purple mx-2" type="button" on:click="{() => joinAsPlayer()}">Join As Player</button>
						</div>
					</form>
				</div>
			{/if}

			{#if joined}
				{#if isHost()}
					<!-- HOST PANEL -->
					<p class="my-2">You are the host</p>
					<HostControls {socket}></HostControls>
				{:else}
					<p class="my-2">Hosted by {getHostName()}</p>
					<!-- PLAYER PANEL - Hide the buzzer until the game starts-->
					{#if $state.gameStarted }
						<div id="buzzerContainer" class="my-4 w-full bg-gray-700 text-center">
							<!-- buzzer at the top of the screen -->
							<Buzzer {socket}></Buzzer>
						</div>
					{/if}
				{/if}

				<TeamDetails {socket} {playersById} {teamsByName}></TeamDetails>
			{/if}
		{:else}
			<p class="mt-2">Not connected to server. Waiting to connect</p>
		{/if}
	</section>
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	.btn {
		@apply font-semibold py-2 px-2 rounded;
	}

	.btn-purple {
		@apply border-purple-700 text-white border-2;
	}

	.btn-purple:hover {
    @apply bg-purple-900;
  }

	.input {
		@apply text-black px-1;
		min-width: 6rem;
	}
</style>
