<script>
import { state } from '../scripts/stores.js';

export let socket = undefined;

let teamSelected;
let pointsValue = 0;

function startGame() {
	if (socket) {
		socket.emit('start-game');
	}
}

function nextRound() {
	if (socket) {
		socket.emit('next-round');
	}
}

function activateBuzzers() {
	if (socket) {
		socket.emit('activate-buzzers');
	}
}

function endGame() {
	if (socket) {
		socket.emit('end-game');
	}
}

function givePoints() {
	if (socket) {
		socket.emit('assign-points', teamSelected, pointsValue);
	}
	pointsValue = 0;
}

</script>

<style>

</style>

<div class="bg-gray-800 rounded p-3">
	<div class="my-3">
		<p class="font-semibold text-xl text-gray-200">Game status:</p>
		{#if $state.roundInfo }
			<p class="mt-2">
				{#if $state.roundInfo.buzzersActive }
					Buzzers are active
				{:else}
					Buzzers are off
				{/if}
				{#if $state.roundInfo.answeringTeam }
					- Team {$state.roundInfo.answeringTeam} buzzed in first.
				{/if}
			</p>
		{/if}
	</div>

	<div id="hostControls" class="grid gap-8 my-2 sm:grid-cols-2 md:grid-cols-3">
		{#if !$state.gameStarted }
			<button class="btn btn-purple" type="button" on:click="{() => startGame()}">Start Game</button>
		{:else}
			<button class="btn btn-purple" type="button" on:click="{() => nextRound()}">Next Round</button>
			<button class="btn btn-purple" type="button" on:click="{() => activateBuzzers()}">Activate Buzzers</button>
			<button class="btn btn-purple" type="button" on:click="{() => endGame()}">End Game</button>
			<div id="points" class="col-span-3">
				<select class="text-black px-1" bind:value="{teamSelected}">
					{#each Object.entries($state.teamInfo) as team}
						<option value="{team[0]}">{team[0]}</option>
					{/each}
				</select>
				<input class="input" type="number" bind:value="{pointsValue}"/>
				<button class="btn btn-purple mt-2 sm:mt-0" type="button" on:click="{() => givePoints()}">Give points</button>
			</div>
		{/if}
	</div>
</div>
