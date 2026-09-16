<script lang="ts">
import {onMount} from "svelte";

let videoHTML: HTMLVideoElement | null = $state(null);
let loading = $state(false); 

let devices: MediaDeviceInfo[] = $state([]);
let selectedDeviceId: string | null = $state(null);

let foo = ["foo", "bar"];

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

// function selectedResolution() {
//   const [width, height] = resolutionSelect.value.split("x").map(Number);
//   return { width, height };
// }

//const video = document.querySelector("video");
const width = 1280;
const height = 720;

let constraints = $state({
  audio: false,
  //video: true,
  video: {
    // deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    width: { exact: width },
    height: { exact: height},
  }
//   video: {
//         deviceId: deviceId ? { exact: deviceId } : undefined,
//         width: { ideal: width },
//         height: { ideal: height },
//         frameRate: { ideal: 30 }
//       }
});

function setSelectedDeviceId() {
    //selectedDeviceId = deviceId;
    constraints.video.deviceId = selectedDeviceId ? { exact: selectedDeviceId } : undefined;
}

function handleDeviceChange() {
    stopVideoStream();
    setSelectedDeviceId();
    console.log("selected video stream with constraints:", constraints);

}

const startVideoStream = async () => {
    // This is a simple one-to-one svelte adaptation of the MediaDevices API:
    // https://developer.mozilla.org/es/docs/Web/API/MediaDevices
    
    
    //stopVideoStream();

    if(!selectedDeviceId)
        return;

    loading = true;
    console.log("Starting video stream with constraints:", constraints);

    //setSelectedDeviceId();

    navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {

        const videoTracks = stream.getVideoTracks();

        console.log("Tengo transmisión con las restricciones:", constraints);
        console.log(`Usando el dispositivo de vídeo: ${videoTracks[0].label}`);

        if (!videoHTML) {
            console.error("No video feed element available.");
            return;
        }
        videoHTML.srcObject = stream;
        // videoFeed.play();

        // Stop the stream when the track ends
        stream.getVideoTracks().forEach(track => track.onended = () => {
            stopVideoStream();
            console.log("Transmisión finalizada");
        });
        
        // stream.onremovetrack = () => {
        //     console.log("Transmisión finalizada");
        // };

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

function stopVideoStream() {
    const source = videoHTML?.srcObject;
    if (source instanceof MediaStream) {
        source.getTracks().forEach(track => track.stop());
    }
    if (videoHTML) {videoHTML.srcObject = null;}
}


const loadVideoDevices = async () => {
  
    navigator.mediaDevices
    .enumerateDevices()
    .then((devicesList) => {
        console.log("All video devices:", devicesList);
        devices = devicesList.filter(device => device.kind === "videoinput");
        console.log("Filtered video devices:", devices);
    })
    .catch((error) => {
        console.error(`Error loading video devices: ${error.name}`, error);
    });

}


//  save utils
//  const ipcHandle = () => window.electron.ipcRenderer.send('ping')




//

onMount(async () => {
    // First getUserMedia call obtains permission and makes labels available.
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

    await loadVideoDevices();
});



///////////////////////////////////////
let SaveDirectory = $state('');

function selectSaveDirectory() {
    window.api.chooseDirectory().then((directory) => {
        if (directory) {
            SaveDirectory = directory;
        }
    });
}

/**
startRecording()
      │
      ├── window.video.start()
      │       └── Electron opens file
      │
      └── mediaRecorder.start(2000)
              │
              ├── dataavailable → write()
              ├── dataavailable → write()
              ├── dataavailable → write()
              │
              │   ... 1–2 hours ...
              │
stopRecording()
      │
      └── mediaRecorder.stop()
              │
              ├── final dataavailable → write()
              │
              └── onstop → window.video.stop()
                              │
                              └── Electron closes file
 * 
 */


let recorder = $state(null);
let mimeType = $state('video/webm'); //  "video/webm;codecs=vp8,opus"
let writeQueue = Promise.resolve();
// let chunks = $state([]);

// async function saveVideoStream( saveDirectory: string ) {
//     const blob = new Blob(chunks, { type: mimeType });
//     const buffer = new Uint8Array(await blob.arrayBuffer());
//     const filename = `recording-${timestamp()}.webm`;

//     try {
        
//         await window.api.saveFile({ 
//             directory: saveDirectory, 
//             filename, 
//             data: buffer 
//         })

//         console.log(`Video saved successfully to ${saveDirectory}/${filename}`);

//     } catch (error) {
//         console.error(`Error saving video stream: ${error.name}`, error);
//     }
// }

// // naive implementation for single stream recording
// function setNewRecorder() {

//     if (!videoHTML?.srcObject) {
//         throw new Error("No video stream available");
//     }

//     recorder = new MediaRecorder(videoHTML.srcObject , { mimeType });

//     recorder.ondataavailable = e => {
//         if (e.data.size) chunks.push(e.data);
//     };

//     recorder.onstop = async () => {
//         await saveVideoStream(SaveDirectory);
//         chunks = [];
//         recorder = null;
//     };

//     return recorder;
// }

async function setNewMediaRecorder() { 
    if (!videoHTML?.srcObject) {
        throw new Error("No video stream available");
    }

    const filename = `recording-${timestamp()}.webm`;
    
    // Initializes the save directory and initializes the file for writing (WriteStream)
    const { filepath, jobID } = await window.video.start({
        directory: SaveDirectory, 
        filename
    })

    recorder = new MediaRecorder(videoHTML.srcObject , { mimeType });
    
    recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;

        // Keep writes in order so stop cannot close the stream too early.
        writeQueue = writeQueue.then(async () => {
            const buffer = await event.data.arrayBuffer();
            await window.video.write({jobID, buffer});
        });
    }

    recorder.onstop = async () => {
        await writeQueue;

        await window.video.stop(jobID);
        // writeQueue = Promise.resolve();
        recorder = null;
    };

}

////////////////////////////////////
let wink = $state(false)

function RecON() {
    console.log("Starting recording...");
    wink = true;

    // we need ot record and save the video stream
    //chunks = [];
    //setNewRecorder();
    // recorder.start(5000);

    //
    setNewMediaRecorder().then(() => {
        recorder.start(3000);
    });

}

async function RecSTOP() {
    console.log("Stopping recording...");
    wink = false;

    if (recorder) {
       await recorder.stop();
    }
}

// exported functions for controlling recording in App.svelte
export { RecON, RecSTOP };



</script>




<div class="video-controls">

    <select class="device-select" bind:value={selectedDeviceId} onchange={handleDeviceChange}>
        <option value={null}>Please select a camera...</option>
        {#each devices as device}
            <option value={device.deviceId}> {device.label} | {device.deviceId.slice(0, 6)}...</option>
        {/each}
    </select>

    <button onclick={selectSaveDirectory}>Select Save Directory {SaveDirectory.slice(6)}</button>

</div>

<section class="preview">
    {#if !selectedDeviceId && !loading}
        <div id="emptyState" class="empty">No camera selected</div>
    {/if}

    {#if loading}
        <div>Loading camera...</div>
    {/if}

    {#if wink}
        <div class="recording-indicator">●</div>
    {/if}
    <video bind:this={videoHTML}
            autoplay
            muted 
            playsinline
            >
    </video>

</section>

<div class="action right tooltip">
    <button id ="start" class="primary" onclick={startVideoStream}> Camera ON</button>
    <button id ="stop" 
        onclick={() => {
            console.log("Stopping video");  stopVideoStream(); 
        }}>
        OFF
    </button>
</div>

    

<style>
    .preview { 
        position: relative; 
        width: 100%; 
        aspect-ratio: 16 / 9; 
        background: #070809; 
        border-radius: 10px; 
        overflow: hidden; 
        border: 1px solid #292e37; 
        margin: 0px;
       
    }
    video {
        width: 100%; 
        height: 100%; 
        object-fit: contain; 
        display: block; 
    }

    .video-controls {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        margin-top: 5px;
        margin-bottom: 5px;
        align-items: center;
        justify-content: start;
        height: 30px;
    }

    .tooltip {
        position: absolute;
        right: 0px;
       
        color: white;
        padding: 5px;
        margin-right: 10px;
        transform: translate(0%, -120%);
    }

    .device-select {
        width: 50%;
        box-sizing: border-box;
        padding: 8px;
        border-radius: 12px;
        border: 1px solid #292e37;
        background: #070809;
        color: #ffffff;
    }

    .right { 
        margin-left: auto;
    }

    .recording-indicator {
        position: absolute;
        top: 0px;
        right: 8px;
        color: red;
        padding: 2px 2px ;
        border-radius: 4px;
        font-weight: bold;
        animation: blink 1.2s infinite;
    }

    @keyframes blink {
        0%, 50%, 100% { opacity: 0.8; }
        25%, 75% { opacity: 0.2; }
    }
</style>
