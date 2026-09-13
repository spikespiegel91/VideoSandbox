<script>
  import VideoPlayer from './components/VideoPlayer.svelte'
  import VideoFeed from './components/VideoFeed.svelte'
  import Versions from './components/Versions.svelte'
  import electronLogo from './assets/electron.svg'

  import Resize from './components/Resize-Container.svelte'
  import Drag from './components/Drag-Container.svelte'

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')


 let rec = $state(null)

 	let width = $state(340)
	let heigth = $state(420)

  // top left pixel coordinates of the draggable container, relative to its parent container
	let x = $state(0)
	let y = $state(0)

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

<div class="Viewport"> 
  <Drag bind:x={x} bind:y={y} handle={true}> 
    <Resize bind:w={width} bind:h={heigth}>

      <VideoFeed bind:this={rec}/>
      
      <div class= "tooltip footer">
        <p2> Size: {heigth.toFixed(1)} x {width.toFixed(1)}</p2> 
        <p2> Top-Left Corner: ({x.toFixed(2)} , {y.toFixed(2)})</p2> 
      </div>
      
    </Resize>
  </Drag>


  <Drag handle={true}> 
    <Resize >
      <VideoFeed bind:this={rec}/>
      <div class= "tooltip footer">
      </div>
    </Resize>
  </Drag>


</div>






<!-- <div class="video-player">  
  <VideoPlayer/>
</div> -->

<style>

	.Viewport {
		border: 4px dashed yellowgreen;
		height: 640px;
		width: 1240px;
		margin: 20px;
		background-color: rgba(232, 235, 223,0.01)
	}
  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px;
    margin-left: 10px;
    transform: translate(0%, -120%);
  }
  .footer {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    gap: 0px;
    padding-left: 10px;
    opacity: 0.4;
  }

  p2 {
    margin: 0;
    font-size: 12px;
  }


</style>
