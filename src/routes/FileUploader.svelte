<script lang="ts">
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import type { ImgPG, PDFPg } from "./types";
  import { Upload } from "lucide-svelte";
  import {} from "@tauri-apps/api/window"
  import * as pdfjs from "pdfjs-dist";

  let inpt: HTMLInputElement;
  let uploadedFiles = $state<string[]>([]);
  let isLoading = $state(false);
  let directory = $state(false);
  let {
    pages = $bindable(),
    addingPages = $bindable(),
  }: { pages: (PDFPg | ImgPG)[]; addingPages: boolean } = $props();

  const appWindow = getCurrentWindow()
</script>

<div class="p-4 space-y-4">
  <div class="flex flex-row gap-2 items-center">
    <Checkbox
      id="directory"
      onclick={() => (directory = !directory)}
      value={directory ? "true" : "false"}
    ></Checkbox>
    <label for={"directory"} class="text-sm">Modo diretorio</label>
  </div>
  <div>
    <label
      class="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted transition-colors"
    >
      <Upload class="w-6 h-6 text-muted-foreground mb-2" />
      <span class="text-sm font-medium text-foreground"> Adicionar PDFs </span>
      <span class="text-xs text-muted-foreground mt-1">
        Clique ou arraste
      </span>
    </label>
    <!-- <input
      id="pdf-upload"
      bind:this={inpt}
      type="file"
      accept=".pdf,.jpg,.jpeg"
      webkitdirectory={directory}
      multiple
      onchange={async (event) => {
        const files = event.currentTarget.files;
        if (!files) return;
        isLoading = true;

        try {
          let fileIndex = 0;
          const reader = new FileReader();
          for await (let file of files) {
            if (file.name.endsWith("pdf")) {
              addingPages = true;
              let doc = await pdfjs.getDocument(await file.arrayBuffer())
                .promise;

              for (let i = 0; i < doc.numPages; i++) {
                pages.push({
                  id: `${file.name}-${i}`,
                  fileIndex,
                  fileName: file.name,
                  flip: 0,
                  pageNumber: i + 1,
                  document: await doc.getPage(i + 1),
                  selected: false,
                  prevData: file,
                });
                // pages = [...pages];
              }
            } else if (file.type.startsWith("image")) {
              reader.readAsDataURL(file);
              await new Promise((resolve) => {
                reader.addEventListener("load", resolve, {
                  once: true,
                });
              });
              pages.push({
                file_name: file.name,
                data: file,
                id: `${file.name}`,
                flip: 0,
                selected: false,
                thumb: reader.result! as any,
                mime: file.type,
              });
            }
            if (!uploadedFiles.includes(file.name))
              uploadedFiles.push(file.name);
            fileIndex++;
          }
        } finally {
          isLoading = false;
          addingPages = false;
          if (inpt.value) inpt.value = "";
        }
      }}
      disabled={isLoading}
      class="hidden"
    /> -->
  </div>
  <!-- 
  {#if uploadedFiles.length > 0}
    <div class="space-y-2">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase">
        Arquivos adicionados
      </h3>
      <div class="space-y-1">
        {#each uploadedFiles as filename}
          <div
            class="flex items-center gap-2 p-2 rounded bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors"
          >
            <FileText class="w-4 h-4 text-primary shrink-0" />
            <span class="truncate text-xs">{filename}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if} -->
</div>
