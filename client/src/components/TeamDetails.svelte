<script>
	import { state } from '../scripts/stores.js';

	export let socket = undefined;
	export let playersById = {
		value: {},
	};
	export let teamsByName = {
		value: {},
	};

	let newTeamName = "";

	function isHost() {
		return socket && $state.host === socket.id
	}

	function createNewTeam() {
		if (isHost() && newTeamName !== '') {
			socket.emit('create-team', newTeamName);
			newTeamName = '';
		}
	}

	function joinTeam(team) {
		if (!isHost()) {
			socket.emit('set-team', team);
		}
	}

	function getPlayerName(playerId) {
		if (playerId === socket.id) {
			return 'You';
		} else {
			return playersById.value[playerId].name;
		}
	}

	function isAnswering(team) {
		if ($state.roundInfo && $state.roundInfo.answeringTeam) {
			return $state.roundInfo.answeringTeam === team;
		}
		return false;
	}

	function playerAnswering(playerId) {
		if ($state.roundInfo && $state.roundInfo.answeringPlayer) {
			return $state.roundInfo.answeringPlayer === playerId;
		}
		return false;
	}

//	$: playerList = Object.entries(playersById.value);
	$: teamList = Object.entries(teamsByName.value);
</script>

<style></style>

<div id="playersList">
	<h2>Teams</h2>
	{#each teamList as team }
		<h3>{team[0]}
			{#if isAnswering(team[0])}
			Buzzed in
			{/if}
		</h3>
		<h4>Points: {team[1].points}</h4>
		<p>Players:</p>
		<ul role="list">
			{#each team[1].players as playerId }
				<li>{getPlayerName(playerId)}
				{#if playerAnswering(playerId)}
				- You're up!
				{/if}
				</li>
			{/each}
		</ul>
		{#if !isHost() && !$state.gameStarted && team[1].players.indexOf(socket.id) === -1}
			<button type="button" on:click={() => joinTeam(team[0])}>Join team</button>
		{/if}
	{/each}
	{#if isHost() && !$state.gameStarted}
		<div id="createTeam">
			<input type="text" id="teamNameInput" autocomplete="off" bind:value={newTeamName}/>
			<button type="button" on:click="{() => createNewTeam()}">Create Team</button>
		</div>
	{/if}
</div>
