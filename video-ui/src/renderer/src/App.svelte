<script>
  import VideoPlayer from './components/VideoPlayer.svelte'
  import VideoFeed from './components/VideoFeed.svelte'
  import Versions from './components/Versions.svelte'
  import electronLogo from './assets/electron.svg'

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')


 let rec = $state(null)

</script>


<div class="text">
  Live Camera
 
    <button class="action svelte" onclick={() => rec?.RecON()}>
      REC ON
    </button>
    <button class="action primary" onclick={() => rec?.RecSTOP()}>
      ■ STOP recording
    </button>

</div>
<p class="tip">Create a <code>new project</code>, add cameras and click <code>REC</code> to start recording</p>


<VideoFeed bind:this={rec}/>


<!-- <div class="video-player">  
  <VideoPlayer/>
</div> -->
