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
			return 'noone!';
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

<main>
	<h1>Jeopardy!</h1>
	{#if connected}
		<div id="connectionInfo">
			<p>Connected. ({latency}ms latency)
			{#if $state.gameStarted }
			- Game Started
			{:else}
			- In the waiting room
			{/if}
			</p>
		</div>
		{#if !joined}
		<div id="introContainer">
			<form>
				<label for="nameInput">Your name: </label>
				<input type="text" id="nameInput" autocomplete="off" bind:value={name} />
				<button type="button" disabled="{hostDisabled}" on:click="{() => joinAsHost()}">Join As Host</button>
				<button type="button" on:click="{() => joinAsPlayer()}">Join As Player</button>
			</form>
		</div>
		{/if}

		{#if joined}
			{#if isHost()}
				<!-- HOST PANEL -->
				<p>You are the host</p>
				<HostControls {socket}></HostControls>
			{:else}
				<p>Hosted by {getHostName()}</p>
				<!-- PLAYER PANEL - Hide the buzzer until the game starts-->
				{#if $state.gameStarted }
					<div id="buzzerContainer">
						<!-- buzzer at the top of the screen -->
						<Buzzer {socket}></Buzzer>
					</div>
				{/if}
			{/if}

			<TeamDetails {socket} {playersById} {teamsByName}></TeamDetails>
		{/if}
	{:else}
		<p>Not connected to server. Waiting to connect</p>
	{/if}
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
