<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    CheckSquare,
    Square,
    Trash,
    RotateCcw,
    Merge,
  } from "lucide-svelte";
  import { resolveResource, tempDir } from "@tauri-apps/api/path";
  import type { ImgPG, PDFPg } from "./types";
  import { save } from "@tauri-apps/plugin-dialog";
  import { readFile, remove, rename, writeFile } from "@tauri-apps/plugin-fs";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { fly } from "svelte/transition";
  import { Command } from "@tauri-apps/plugin-shell";
  import { toast } from "svelte-sonner";

  let {
    onSelectAll,
    pagesCount,
    selectedCount,
    pages = $bindable(),
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

  let shouldCompress = $state(false);
  let compressLevel = $state(0);

  function formatRanges(nums: number[]) {
    if (nums.length === 0) return "";

    let result = [];
    let start = nums[0];

    for (let i = 0; i < nums.length; i++) {
      const current = nums[i];
      const next = nums[i + 1];
      const diffToNext = next - current;
      const isSequenceContinuing = Math.abs(diffToNext) === 1;
      const isDirectionChanging =
        i > 0 && next - current !== nums[i] - nums[i - 1];

      if (
        !isSequenceContinuing ||
        (i < nums.length - 1 &&
          isDirectionChanging &&
          i > 0 &&
          Math.abs(nums[i] - nums[i - 1]) === 1)
      ) {
        // End the range
        result.push(start === current ? `${start}` : `${start}-${current}`);
        start = next;
      }
    }

    return result.join(",");
  }

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

      let currentFile = "";
      let nums = [];
      let lastRotate = 0;
      let toRemove = [];
      let temp = await tempDir();
      let i = 0;
      let rotations: { [key: number]: number[] } = {};
      for (let page of pages) {
        i++;
        // if (lastRotate != page.flip) args.push("--rotate=+" + page.flip);
        if (page.flip > 0) {
          let cur = rotations[page.flip];
          if (cur) {
            cur.push(i);
          } else {
            rotations[page.flip] = [i];
          }
        }
        let pth = "img_path" in page ? page.img_path : page.path;
        if (currentFile != pth && nums.length > 0) {
          args.push(currentFile);
          args.push(formatRanges(nums));
          nums = [];
        }
        if ("img_path" in page) {
          // image
          let path = temp + i + ".pdf";
          toRemove.push(path);
          console.log(
            await Command.sidecar(
              "binaries/magick",
              [page.img_path, "-compress", "zip", path],
              {
                cwd: await resolveResource("./binaries"),
              },
            ).execute(),
          );

          args.push(path);
          args.push("1");
          lastRotate = page.flip;
          continue;
        }

        nums.push(page.pageNumber + 1);
        lastRotate = page.flip;
        currentFile = page.path;
      }
      args.push(currentFile);
      args.push(formatRanges(nums));

      args.push("--");

      for (let obj of Object.entries(rotations)) {
        let key = obj[0];
        let val = obj[1];
        args.push(`--rotate=${key}:${formatRanges(val)}`);
      }

      args.push(output);
      console.log(
        await Command.sidecar("binaries/qpdf", args, {
          cwd: await resolveResource("./binaries"),
        }).execute(),
      );
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
            `-sOutputFile=${output.replace(".pdf", "_____comprimido.pdf")}`,
            output,
          ],
          {
            cwd: await resolveResource("./binaries"),
          },
        ).execute();

        statusText = "Finalizando arquivo...";
        await remove(output);
        await rename(output.replace(".pdf", "_____comprimido.pdf"), output);
        toast.success("Arquivo processado com sucesso");
      }
    } finally {
      processing = false;
      statusText = "";
    }
  }
  function handleRotate() {
    pages.forEach((page) => {
      if (!page.selected) return;
      let val = (page.flip + 90) % 360;
      page.flip = val;
    });
    pages = [...pages]
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
    <div class="text-xs text-muted-foreground px-2 py-1 bg-muted rounded mt-2">
      {selectedCount} de {pagesCount} selecionada{selectedCount !== 1
        ? "s"
        : ""}
    </div>
    <div class="flex flex-row gap-4 items-center justify-center mb-16">
      <Button
        variant="destructive"
        size="icon"
        onclick={() => {
          pages = pages.filter((x) => !x.selected);
          for (let page of pages) {
            page.selected = false;
          }
        }}
      >
        <Trash />
      </Button>
      <Button variant="outline" size="icon" onclick={handleRotate}>
        <RotateCcw />
      </Button>
      <Button variant="default" size="icon" color="black">
        <Merge />
      </Button>
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

  <p class="text-sm text-gray-600">{statusText}</p>

  <!-- Merge Button -->
  <Button
    size="sm"
    variant="outline"
    class="w-full text-xs h-8"
    onclick={onNewMerge}
    disabled={processing || addingPages}
  >
    {#if processing}
      Processando...
    {:else}
      Mesclar PDFs
    {/if}
  </Button>
</div>
