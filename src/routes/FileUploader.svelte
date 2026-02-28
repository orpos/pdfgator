<script lang="ts">
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import type { ImgPG, PDFPg } from "./types";
  import { Upload } from "lucide-svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { open } from "@tauri-apps/plugin-dialog";
  import { onMount } from "svelte";
  import * as pdfjs from "pdfjs-dist";
  import * as fs from "@tauri-apps/plugin-fs";
  import { convertFileSrc } from "@tauri-apps/api/core";

  let isLoading = $state(false);
  let directory = $state(false);
  let {
    pages = $bindable(),
    addingPages = $bindable(),
  }: { pages: (PDFPg | ImgPG)[]; addingPages: boolean } = $props();

  async function handleFiles(paths: string[]) {
    try {
      isLoading = true;
      addingPages = true;
      for await (let path of paths) {
        let inf = await fs.stat(path);
        if (inf.isDirectory) {
          handleFiles((await fs.readDir(path)).map((x) => path + "/" + x.name));
          continue;
        }
        // pb is file
        if (path.endsWith(".pdf")) {
          let doc = await pdfjs.getDocument(await fs.readFile(path)).promise;

          for (let i = 0; i < doc.numPages; i++) {
            pages.push({
              path,
              pageNumber: i,
              flip: 0,
              selected: false,
              doc: doc.getPage(i + 1),
              id: `${path}-${i}`,
            });
          }
        } else if (
          path.endsWith(".jpg") ||
          path.endsWith(".png") ||
          path.endsWith(".jpeg")
        ) {
          pages.push({
            img_path: path,
            thumb_path: convertFileSrc(path),
            flip: 0,
            selected: false,
            id: path,
          });
        }
      }
    } finally {
      isLoading = false;
      addingPages = false;
    }
  }

  onMount(() => {
    const appWindow = getCurrentWindow();

    appWindow.onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        let files = event.payload.paths;
        handleFiles(files);
      }
    });
  });
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
    <button
      class="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted transition-colors"
      onclick={async () => {
        const paths = await open({
          multiple: true,
          directory: directory,
          recursive: true,
          filters: [
            {
              name: "Pdf",
              extensions: ["pdf"],
            },
            {
              name: "Imagens",
              extensions: ["jpg", "jpeg", "png", "jiff"],
            },
          ],
        });
        if (paths) {
          console.log(paths);
          handleFiles(paths);
        }
      }}
    >
      <Upload class="w-6 h-6 text-muted-foreground mb-2" />
      <span class="text-sm font-medium text-foreground"> Adicionar PDFs </span>
      <span class="text-xs text-muted-foreground mt-1">
        Clique ou arraste
      </span>
    </button>
  </div>
</div>
