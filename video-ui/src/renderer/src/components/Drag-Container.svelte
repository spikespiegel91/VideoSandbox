<script lang="ts">

	let {
		handle = true,
		x = $bindable(0),
		y = $bindable(0),
		children
	}: {
		handle?: boolean;
		children?: Snippet
	} = $props();

	//let x = $state(0);
	//let y = $state(0);

	let dragging = false;
	let offsetX = 0;
	let offsetY = 0;

	function startDrag(event: PointerEvent) {
		event.preventDefault();

		dragging = true;

		offsetX = event.clientX - x;
		offsetY = event.clientY - y;

		(event.currentTarget as HTMLElement).setPointerCapture(
			event.pointerId
		);
	}

	function drag(event: PointerEvent) {
		if (!dragging) return;

		x = event.clientX - offsetX;
		y = event.clientY - offsetY;
	}

	function stopDrag() {
		dragging = false;
	}

</script>

<div
	class="draggable"
	style:transform={`translate(${x}px, ${y}px)`}
>
    {@render children?.()}

    <div 
        role="application"
        class="header text-icon"
        onpointerdown={startDrag}
        onpointermove={drag}
        onpointerup={stopDrag}
    > ✥ </div>

</div>

<style>
	.draggable {
		position: absolute;
		z-index: 9;
		background-color: rgba(50,50,10,0.2);
		border: 1px solid rgba(255,255,255,0.0);
		text-align: center;
	}

	.header {
		padding: 0px;
		cursor: move;
		color: white;
		touch-action: none;
        background: var(--ev-c-gray-3);
        border-top: 1px solid rgba(0,0,0,0.9);
        border: 1px solid rgba(0,0,0,0.4);
	}

    .header:hover {
        background: rgba(244, 244, 244, 0.4);
    }

    .text-icon {
        color:  var(--ev-c-text-3)
    }

    .text-icon:hover {
        color:  var(--ev-c-text-1);
    }

</style>