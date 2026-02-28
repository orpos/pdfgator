<script lang="ts">
  import type { PDFPg } from "./types";
  import { onMount } from "svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import { Download, RotateCw, Trash2 } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Viewer } from "svelte-image-viewer";
  import { toast } from "svelte-sonner";
  import { save } from "@tauri-apps/plugin-dialog";
  import { writeFile } from "@tauri-apps/plugin-fs";
  import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
  import { Skeleton } from "$lib/components/ui/skeleton";
  // import Dialog from "$lib/components/ui/dialog/dialog.svelte";

  let {
    page,
    isSelected = $bindable(),
    index,
    flip = $bindable(),
    onRemove,
  }: {
    isSelected: boolean;
    page: PDFPg;
    index: number;
    flip: number;
    onRemove: () => any;
  } = $props();
  let open = $state(false);

  async function renderImage(element: HTMLCanvasElement) {
    let doc = await page.doc;
    let viewport = doc.getViewport({ scale: 1 });
    element.width = Math.floor(viewport.width);
    element.height = Math.floor(viewport.height);
    doc.render({
      canvas: element,
      viewport,
    });
  }

  function renderPage(
    element: HTMLCanvasElement,
    data: {
      doc: PDFPageProxy;
      scale?: number;
    },
  ) {
    let viewport = data.doc.getViewport({ scale: data.scale ?? 1 });
    element.width = Math.floor(viewport.width);
    element.height = Math.floor(viewport.height);
    data.doc.render({
      canvas: element,
      viewport,
    });
  }

  function dataUrlToUint8Array(dataUrl: string) {
    // 1. Remove the header (e.g., "data:image/png;base64,")
    const base64 = dataUrl.split(",")[1];

    // 2. Decode base64 to a binary string
    const binaryString = atob(base64);

    // 3. Convert binary string to Uint8Array
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  let scale = $state("1.0");

  async function downloadInMime(mime: string, file: string) {
    const n = parseFloat(scale.replace(",", "."));
    if (Number.isNaN(n)) {
      return toast.error("Numero de escala invalido");
    }

    let doc = await page.doc;
    const viewport = doc.getViewport({ scale: n });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Wait for rendering to complete
    await doc.render({
      canvasContext: context!,
      viewport,
      canvas,
    }).promise;

    const url = canvas.toDataURL(mime);

    let data = dataUrlToUint8Array(url);

    let path = await save({
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpeg"],
        },
      ],
      defaultPath: file,
    });

    if (path) {
      writeFile(path!, data);
      toast.success("Baixado imagem com sucesso");
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="relative group"
  oncontextmenu={(event) => {
    event.preventDefault();
    open = true;
  }}
  onclick={(event) => {
    if (event.ctrlKey) {
      isSelected = !isSelected;
    }
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
      style={`transform: rotate(${Number.parseInt(String(flip ?? 0))}deg)`}
    >
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      {#await page.doc}
        <Skeleton />
      {:then doc}
        <canvas
          use:renderPage={{
            doc,
            scale: 0.43,
          }}
        />
      {/await}
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
      }}
      title="Virar página"
    >
      <RotateCw class="w-3 h-3 mr-1" />
    </Button>
    <Dialog.Root>
      <Dialog.Trigger>
        <Button
          title="Baixar"
          variant="secondary"
          class="flex-1 h-8 text-xs bg-blue-700 text-white"
        >
          <Download />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <h1 class="text-xl">Baixar</h1>
        <p>Escolha a maneira de baixar e a escala</p>
        <input bind:value={scale} />
        <Button onclick={() => downloadInMime("image/png", "imagem.png")}>
          PNG
        </Button>
        <Button onclick={() => downloadInMime("image/jpeg", "imagem.jpg")}>
          JPG
        </Button>
      </Dialog.Content>
    </Dialog.Root>
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
  <Dialog.Content class="h-[80vh] w-[90vw] cursor-grab">
    <Viewer>
      {#await page.doc}
        <Skeleton />
      {:then doc}
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <canvas
          class="w-full h-full"
          use:renderPage={{
            doc,
            scale: 1,
          }}
        />
      {/await}
    </Viewer>
  </Dialog.Content>
</Dialog.Root>
