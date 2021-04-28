<script>
import { state } from '../scripts/stores.js';

export let socket = undefined;

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

</script>

<style>

</style>

<div id="hostControls">
	{#if !$state.gameStarted }
		<button type="button" on:click="{() => startGame()}">Start Game</button>
	{:else}
		<button type="button" on:click="{() => nextRound()}">Next Round</button>
		<button type="button" on:click="{() => activateBuzzers()}">Activate Buzzers</button>
		<button type="button" on:click="{() => endGame()}">End Game</button>
	{/if}
</div>

<div>
	<p>Game status</p>
	{#if $state.roundInfo }
		{#if $state.roundInfo.buzzersActive }
		<p>Buzzers are active</p>
		{:else}
		<p>Buzzers are off</p>
		{/if}
		{#if $state.roundInfo.answeringTeam }
			Team {$state.roundInfo.answeringTeam} is guessing the question.
		{/if}
	{/if}
</div>
