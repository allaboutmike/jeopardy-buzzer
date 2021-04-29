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

	function canJoinTeam(team) {
		return !isHost() &&
					 (!$state.gameStarted || $state.playerInfo[socket.id].team === undefined) &&
					 team.players.indexOf(socket.id) === -1
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

<style>
	.isAnswering {
		@apply border-purple-700 border-4;
	}

	.playerAnswering {
		@apply font-bold;
	}

</style>

<div id="playersList" class="mt-4">
	<div class="flex justify-between content-between">
		<h2 class="px-2 text-4xl text-gray-200">Teams</h2>
		{#if isHost() && !$state.gameStarted}
			<div id="createTeam">
				<input class="input mx-2" type="text" id="teamNameInput" autocomplete="off" bind:value={newTeamName}/>
				<button class="btn btn-purple my-2 mx-2 sm:my-0" type="button" on:click="{() => createNewTeam()}">Create Team</button>
			</div>
		{/if}
	</div>

	<div class="grid gap-8 mt-2 md:grid-cols-2 lg:grid-cols-3">
	{#each teamList as team }
		<div class="max-w-md py-4 px-8 bg-gray-700 rounded-lg" class:isAnswering="{isAnswering(team[0])}">
			<div class="flex justify-between content-end">
				<h3 class="flex-1 text-gray-200 text-3xl font-semibold">{team[0]}</h3>
				<h4 class="flex-1 text-gray-200 text-2xl">Points: {team[1].points}</h4>
			</div>
			<div class="mt-4">
				<p class="font-semibold">Players:</p>
				<ul role="list">
					{#each team[1].players as playerId }
						<li class="mx-4" class:playerAnswering="{playerAnswering(playerId)}">{getPlayerName(playerId)}
						</li>
					{/each}
				</ul>
			</div>
				{#if canJoinTeam(team[1])}
					<div class="flex justify-center mt-4">
						<button class="btn btn-purple" type="button" on:click={() => joinTeam(team[0])}>Join team</button>
					</div>
				{/if}
		</div>
	{/each}
	</div>
</div>
