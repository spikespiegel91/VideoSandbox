<script>
import {onMount} from "svelte";

let videoFeed = $state(null);
let loading = $state(true);

//const video = document.querySelector("video");

const constraints = {
  audio: false,
  video: true,
};

const LaunchFeed = async () => {

    navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {

        const videoTracks = stream.getVideoTracks();

        console.log("Tengo transmisión con las restricciones:", constraints);
        console.log(`Usando el dispositivo de vídeo: ${videoTracks[0].label}`);

        stream.onremovetrack = () => {
        console.log("Transmisión finalizada");
        };

        videoFeed.srcObject = stream;
        videoFeed.play();
        loading = false;
    
    })
    .catch((error) => {
        if (error.name === "OverconstrainedError") {
        console.error(
            `La resolución ${constraints.video.width.exact}x${constraints.video.height.exact} px no es compatible con su dispositivo.`,
        );
        } else if (error.name === "NotAllowedError") {
        console.error(
            "Debe otorgar permiso a esta página para acceder a su cámara y micrófono.",
        );
        } else {
        console.error(`getUserMedia error: ${error.name}`, error);
        }
    });

}


async function stopStream() {
  if (videoFeed && videoFeed.srcObject) {
    videoFeed.srcObject.getTracks().forEach(track => track.stop());
    videoFeed.srcObject = null;
  }
}

onMount(() => {
    //LaunchFeed();
});

</script>

<button id ="start" onclick={LaunchFeed}>
    Start VideoFeed
</button>

<button id ="play" onclick={() => {
    if (videoFeed){
        console.log("Playing video");
        videoFeed.play();
    } else {
        console.log("No video feed available. reLaunching feed...");
        LaunchFeed();
    }
}

}>
    Play Video
</button>

<button id ="stop" onclick={() => {console.log("Stopping video");  stopStream(); }}>
    STOP Video
</button>

<p class="tip">
    Input Camera Feed
</p>

<section class="preview">
{#if !videoFeed && !loading}
    <div id="emptyState" class="empty">No camera selected</div>
{/if}

{#if loading}
    <div>Loading camera feed...</div>
{/if}

<video bind:this={videoFeed}
        autoplay
        muted 
        playsinline
        >
</video>

</section>

<style>

    .preview { 
        position: relative; 
        width: 50%; 
        aspect-ratio: 16 / 9; 
        background: #070809; 
        border-radius: 10px; 
        overflow: hidden; 
        border: 1px solid #292e37; 
        margin: 16px 0 ;
    }
    video {
        width: 100%; 
        height: 100%; 
        object-fit: contain; 
        display: block; 
    }
</style>
