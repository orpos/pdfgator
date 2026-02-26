<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { Download, CheckSquare, Square } from "lucide-svelte";
  import { resolveResource } from "@tauri-apps/api/path";
  import type { ImgPG, PDFPg } from "./types";
  import { degrees, PDFDocument } from "pdf-lib";
  import { save } from "@tauri-apps/plugin-dialog";
  import { readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { fly } from "svelte/transition";
  import { Command } from "@tauri-apps/plugin-shell";
  import { toast } from "svelte-sonner";

  let {
    onSelectAll,
    pagesCount,
    selectedCount,
    pages,
    addingPages,
  }: {
    selectedCount: number;
    onSelectAll: () => any;
    pagesCount: number;
    pages: (PDFPg | ImgPG)[];
    addingPages: boolean;
  } = $props();

  let statusText = $state("");
  let processing = $state(false);
  let processedPages = $state(0);
  let shouldCompress = $state(false);
  let compressLevel = $state(0);

  async function onNewMerge() {
    try {
      processing = true;

      let output = await save({
        filters: [
          {
            name: "PDF",
            extensions: ["pdf"],
          },
        ],
        defaultPath: "file.pdf",
      });
      if (!output) return;

      let args = ["--empty", "--pages"];


      for (let page of pages) {
        if ("file_name" in page) {
          // image
          continue
        }
        page.fileName;
      }

      args.push("--");
      args.push(output);
    } finally {
      processing = false;
      statusText = "";
    }
  }

  async function onMerge() {
    try {
      processing = true;
      let newDocument = await PDFDocument.create({
        updateMetadata: false,
      });
      let loaded: any = {};
      for (let page of pages) {
        if ("file_name" in page) {
          // await newDocument.embed(page.thumb)
          // newDocument.addPage();
          console.log("new img");
          console.log(page.thumb);

          console.log(page.mime);
          let img;
          if (page.mime.endsWith("png")) {
            img = await newDocument.embedPng(page.thumb);
          } else {
            img = await newDocument.embedJpg(page.thumb);
          }
          const { height, width } = img.scale(1);

          const pg = newDocument.addPage([width, height]);
          pg.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height,
          });
          if (page.flip) {
            pg.setRotation(degrees(page.flip));
          }
          continue;
        }
        if (!loaded[page.fileIndex]) {
          statusText = "Carregando Arquivo PDF : " + page.fileName;
          loaded[page.fileIndex] = await PDFDocument.load(
            await page.prevData.arrayBuffer(),
          );
        }
        processedPages += 1;
        statusText = "Adicionando Pagina : " + page.id;
        let thePage = newDocument.addPage(
          (
            await newDocument.copyPages(loaded[page.fileIndex!], [
              page.pageNumber - 1,
            ])
          )[0],
        );
        if (page.flip) {
          thePage.setRotation(degrees(page.flip));
        }
      }

      const bytes = await newDocument.save();

      let filePath = await save({
        filters: [
          {
            name: "PDF",
            extensions: ["pdf"],
          },
        ],
        defaultPath: "file.pdf",
      });

      if (filePath) {
        statusText = "Salvando...";
        await writeFile(filePath, bytes);

        if (shouldCompress) {
          let level: string;
          if (compressLevel == 1) {
            level = "printer";
          } else if (compressLevel == 2) {
            level = "ebook";
          } else {
            level = "screen";
          }
          statusText = "Comprimindo...";
          let child = await Command.sidecar(
            "binaries/gs",
            [
              "-sDEVICE=pdfwrite",
              "-dCompatibilityLevel=1.4",
              "-dNOPAUSE",
              "-dQUIET",
              "-dBATCH",
              // Metadata Stripping
              "-dDoThumbnails=false",
              "-dCreateJobTicket=false",
              "-dPreserveEmptyPages=false",
              `-dPDFSETTINGS=/${level}`,
              `-sOutputFile=${filePath.replace(".pdf", "_____comprimido.pdf")}`,
              filePath,
            ],
            {
              cwd: await resolveResource("./binaries"),
            },
          ).execute();

          statusText = "Finalizando arquivo...";
          let fileData = await readFile(
            filePath.replace(".pdf", "_____comprimido.pdf"),
          );

          // let document = await PDFDocument.load(fileData);
          // document.setAuthor("A");
          // document.setCreator("PDFGator(custom app)");
          // document.setProducer("ghostscript, PDFGator and pdflib");
          // statusText = "Salvando arquivo final...";
          // let newData = await document.save();
          // await writeFile(filePath, newData);
          // statusText = "Tirando arquivo antigo...";
          // await remove(filePath.replace(".pdf", "_____comprimido.pdf"));
        }
        toast.success("Arquivo criado com sucesso");
      }
    } finally {
      processing = false;
      statusText = "";
      processedPages = 0;
    }
  }
</script>

<div class="space-y-3">
  <!-- Select All Button  -->
  <Button
    variant="outline"
    size="sm"
    class="w-full justify-start text-xs h-8"
    onclick={onSelectAll}
  >
    {#if selectedCount === pagesCount && pagesCount > 0}
      <CheckSquare class="w-4 h-4 mr-2" />
      Desselecionar tudo
    {:else}
      <Square class="w-4 h-4 mr-2" />
      Selecionar tudo
    {/if}
  </Button>

  {#if selectedCount > 0}
    <div class="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
      {selectedCount} de {pagesCount} selecionada{selectedCount !== 1
        ? "s"
        : ""}
    </div>
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <button
    class="flex flex-row text-sm items-center gap-2"
    onclick={() => (shouldCompress = !shouldCompress)}
  >
    <Checkbox checked={shouldCompress} />
    Comprimir
  </button>

  {#if shouldCompress}
    <div transition:fly class="py-4">
      Nível de compressão:
      <NativeSelect bind:value={compressLevel}>
        <option value="0">Baixa</option>
        <option value="1" selected>Media</option>
        <option value="2">Alta</option>
      </NativeSelect>
    </div>
  {/if}

  <progress value={processedPages / pages.length} />
  <p class="text-sm text-gray-600">{statusText}</p>

  <!-- Merge Button -->
  <Button
    size="sm"
    variant="outline"
    class="w-full text-xs h-8"
    onclick={onMerge}
    disabled={processing || addingPages}
  >
    {#if processing}
      Processando...
    {:else}
      Mesclar PDFs
    {/if}
  </Button>
</div>
