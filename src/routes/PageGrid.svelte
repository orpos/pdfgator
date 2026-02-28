<script lang="ts">
  import type { ImgPG, PDFPg } from "./types";
  import PageCard from "./PageCard.svelte";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { createSortable } from "@dnd-kit/svelte/sortable";
  import { move } from "@dnd-kit/helpers";
  import PageCardImg from "./PageCardImg.svelte";

  let { pages = $bindable() }: { pages: (PDFPg | ImgPG)[] } = $props();

  function onDragEnd(event: any) {
    console.log(event);
    setTimeout(() => {
      pages = move(pages, event);
    }, 300);
  }

</script>

<div
  class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max"
>
  <!-- <div class="flex flex-wrap gap-4 flex-row size-max"> -->
  <DragDropProvider {onDragEnd}>
    {#each pages as page, index (page)}
      {@const sortable = createSortable({ id: "draggable-" + index, index })}
      <div {@attach sortable.attach}>
        {#if "img_path" in page}
          <PageCardImg
            bind:flip={page.flip}
            {index}
            {page}
            bind:isSelected={page.selected}
            onRemove={() => pages.splice(index, 1)}
          />
        {:else}
          <PageCard
            bind:flip={page.flip}
            {index}
            {page}
            bind:isSelected={page.selected}
            onRemove={() => pages.splice(index, 1)}
          />
        {/if}
      </div>
    {/each}
  </DragDropProvider>
</div>
