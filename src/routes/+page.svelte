<script lang="ts">
  import { GlobalWorkerOptions } from "pdfjs-dist";
  import FileUploader from "./FileUploader.svelte";
  import type { ImgPG, PDFPg } from "./types";
  import Controls from "./Controls.svelte";
  import PageGrid from "./PageGrid.svelte";

  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  let selectedAll = $state(false);
  let pages = $state<(PDFPg | ImgPG)[]>([]);
  let addingPages = $state<boolean>(false);
</script>

<main class="min-h-screen bg-background">
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <header class="border-b border-border bg-card px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">PDFGator</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Organize, reordene e combine seus arquivos PDF com facilidade
          </p>
        </div>
        <div class="text-sm text-muted-foreground">
          {pages.length} página{pages.length !== 1 ? "s" : ""} no total
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- {/* Left Panel - File Upload */} -->
      <div
        class="w-64 border-r border-border bg-card overflow-y-auto flex flex-col"
      >
        <FileUploader bind:pages bind:addingPages />

        {#if pages.length > 0}
          <div class="border-t border-border p-4">
            <Controls
              {pages}
              {addingPages}
              pagesCount={pages.length}
              selectedCount={pages.filter((x) => x.selected).length}
              onSelectAll={() => {
                selectedAll = !selectedAll;
                pages.forEach((page) => (page.selected = selectedAll));
              }}
            />
          </div>
        {/if}
      </div>
      <!-- Right Panel - Page Grid -->
      <div class="flex-1 bg-background p-6 overflow-y-auto">
        {#if pages.length === 0}
          <div class="h-full flex items-center justify-center">
            <div class="text-center">
              <p class="text-muted-foreground text-lg mb-2">
                Nenhum arquivo adicionado
              </p>
              <p class="text-muted-foreground text-sm">
                Comece adicionando um PDF no painel esquerdo
              </p>
            </div>
          </div>
        {:else}
          <PageGrid bind:pages />
        {/if}
      </div>
    </div>
  </div>
</main>
