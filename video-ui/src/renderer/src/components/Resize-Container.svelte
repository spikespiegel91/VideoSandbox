<script lang="ts">
	
	// [ ] FIXME: see use of svelte window component https://svelte.dev/docs/svelte/svelte-window

	let {
        w = $bindable(420),
		h = $bindable(340),
		minWidth = 100,
		minHeight = 100,
		children
	}: {
        w?: number;
		h?: number;
		minWidth?: number;
		minHeight?: number;
		children?: Snippet;
	} = $props();

	//let w = $state(400);
	//let h = $state(400);
	let resizing = $state(false);

	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;

	function startResize(event: PointerEvent) {
		resizing = true;
		event.preventDefault();

		startX = event.clientX;
		startY = event.clientY;
		startWidth = w;
		startHeight = h;

		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
	}

	function resize(event: PointerEvent) {
		if (!resizing) return;
		
		w = Math.max(
			minWidth,
			startWidth + event.clientX - startX
		);

		h = Math.max(
			minHeight,
			startHeight + event.clientY - startY
		);
	}

	function stopResize(event: PointerEvent) {
		resizing = false;
		const handle = event.currentTarget as HTMLElement;

		if (handle.hasPointerCapture(event.pointerId)) {
			handle.releasePointerCapture(event.pointerId);
		}
	}
</script>

<div
	class="resizable"
	style:width={`${w}px`}
	style:height={`${h}px`}
>
	<div class="content">
		{@render children?.()}
	</div>
	
	<div
		class="handle text-icon"
		role="separator"
		aria-label="Resize"
		aria-orientation="horizontal"

		onpointerdown={startResize}
		onpointermove={resize}
		onpointerup={stopResize}
	>
	
      ◢   
	</div>

</div>

<style>
    .resizable {
        position: relative;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 10px;
    }

    .content {
        box-sizing: border-box;
        padding-right: 0px;
        padding-bottom: 0px;
        overflow: auto;
        width: 100%;
        height: 100%
    }

    .handle {
        position: absolute;
        right: 0;
        bottom: -26px;
        min-width: 25px;
        height: 25px;
        cursor: nwse-resize;
        touch-action: none;
        background: var(--ev-c-gray-3);
        border: 1px solid rgba(0,0,0,0.4);
    }

    .handle:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .inset-shadow {
		box-shadow: inset 0 -4px 8px rgba(0, 0,0, 0.3);
	}

    .shadow {
		box-shadow: 0 -4px 8px rgba(0, 0,0, 0.3);
	}

    .text-icon {
        color:  var(--ev-c-text-3)
    }

    .text-icon:hover {
        color:  var(--ev-c-text-1);
    }

</style>