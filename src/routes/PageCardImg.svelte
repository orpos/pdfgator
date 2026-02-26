<script lang="ts">
  import type { ImgPG } from "./types";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import { RotateCw, Trash2 } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Viewer } from "svelte-image-viewer";
  // import Dialog from "$lib/components/ui/dialog/dialog.svelte";

  let {
    page,
    isSelected = $bindable(),
    index,
    flip = $bindable(),
    onRemove,
  }: {
    isSelected: boolean;
    page: ImgPG;
    index: number;
    flip: number;
    onRemove: () => any;
  } = $props();

  let open = $state(false);

  let flp = $state(0);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="relative group"
  oncontextmenu={(event) => {
    event.preventDefault();
    open = true;
  }}
>
  <!-- Card Container -->
  <div
    class={`relative aspect-3/4 rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
      isSelected
        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
        : "border-border bg-card hover:border-primary"
    }`}
  >
    <!-- Page Preview -->
    <div
      class="w-full h-full flex items-center justify-center p-2 transition-transform"
      style={`transform: rotate(${Number.parseInt(String(flp))}deg)`}
    >
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <img src={page.thumb} />
    </div>

    <!-- Page Index Badge -->
    <div
      class="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
    >
      {index}
    </div>

    <!-- Selection Checkbox -->
    <div class="absolute top-2 right-2">
      <Checkbox
        checked={isSelected}
        onchange={() => (isSelected = !isSelected)}
        class="w-5 h-5 bg-white border-primary"
      />
    </div>
  </div>

  <!-- Action Buttons - Visible on Hover -->
  <div
    class="absolute bottom-5 left-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mx-4"
  >
    <Button
      size="sm"
      variant="outline"
      class="flex-1 h-8 text-xs"
      onclick={() => {
        flip = ((flip ?? 0) + 90) % 360;
        flp = flip;
      }}
      title="Virar página"
    >
      <RotateCw class="w-3 h-3 mr-1" />
    </Button>
    <Button
      size="sm"
      variant="destructive"
      class="flex-1 h-8 text-xs"
      onclick={onRemove}
      title="Remover página"
    >
      <Trash2 class="w-3 h-3 mr-1" />
    </Button>
  </div>
</div>

<Dialog.Root bind:open>
  <Dialog.Content class="h-[80vh] w-[90vw]">
    <Viewer>
      <img src={page.thumb} />
    </Viewer>
  </Dialog.Content>
</Dialog.Root>
