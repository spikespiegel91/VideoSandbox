<script>

    let csvData = $state(null);
    let selectedDelimiter = $state(";")

    const possibleDelimiters = [';', ',', '\t', '|'];
</script>

<button id="openCsv"
    onclick = {async () => {
        csvData = null;
        const result = await window.api.openCSV({delimeter: selectedDelimiter});
        if (result) {
            csvData = result.data;
        }
    }}
> Open CSV </button>

<select bind:value={selectedDelimiter}>
    {#each possibleDelimiters as delimiter}
        <option value={delimiter}>{delimiter}</option>
    {/each}
</select>

{#if csvData}
    <pre>{JSON.stringify(csvData, null, 2)}</pre>
{/if}