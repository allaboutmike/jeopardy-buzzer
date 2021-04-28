<script>
import { state } from '../scripts/stores.js';

export let socket = undefined;

function hitBuzzer() {
	if ($state.roundInfo.buzzersActive) {
		console.log("BUZZ!");
		if (socket) {
			socket.emit('buzz');
		}
	}
}

$: activated = $state.roundInfo.buzzersActive;
</script>

<style>
.button {
  position:relative;
  display:inline-block;
  margin:20px;
}

.button a {
  color:white;
  font-family:Helvetica, sans-serif;
  font-weight:bold;
  font-size:36px;
  text-align: center;
  text-decoration:none;
  background-color:#FFA12B;
  display:block;
  position:relative;
  padding:20px 40px;

  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  text-shadow: 0px 1px 0px #000;
  filter: drop-shadow(0 1 2px #000);

  -webkit-box-shadow:inset 0 1px 0 #FFE5C4, 0 10px 0 #915100;
  -moz-box-shadow:inset 0 1px 0 #FFE5C4, 0 10px 0 #915100;
  box-shadow:inset 0 1px 0 #FFE5C4, 0 10px 0 #915100;

  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
}

.button a:active {
  top:10px;
  background-color:#F78900;

  -webkit-box-shadow:inset 0 1px 0 #FFE5C4, inset 0 -3px 0 #915100;
  -moz-box-shadow:inset 0 1px 0 #FFE5C4, inset 0 -3pxpx 0 #915100;
  box-shadow:inset 0 1px 0 #FFE5C4, inset 0 -3px 0 #915100;
}

.button:after {
  content:"";
  height:100%;
  width:100%;
  padding:4px;
  position: absolute;
  bottom:-15px;
  left:-4px;
  z-index:-1;
  background-color:#2B1800;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
}
</style>

<div on:touchstart="{() => hitBuzzer()}" on:click="{() => hitBuzzer()}">
  <div class="button">
    <a href="#">BUZZ!!</a>
  </div>
	{#if activated}
		<p>HIT THE BUZZER!!</p>
	{:else}
		<p>Buzzer disabled - Wait for it...</p>
	{/if}
</div>
