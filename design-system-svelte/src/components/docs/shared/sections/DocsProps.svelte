<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';

  interface DocsPropItem {
    name: string; type: string; defaultValue: string; required: string; description: string;
  }
  interface DocsPropsTableDef {
    title?: string;
    cols: { prop: string; type: string; default: string; required: string; description: string };
    items: DocsPropItem[];
  }

  const { title, tables, interfaceCode, extensibilityTitle, extensibilityNotes }: {
    title: string;
    tables: DocsPropsTableDef[];
    interfaceCode?: string;
    extensibilityTitle?: string;
    extensibilityNotes?: string;
  } = $props();
</script>

<section id="propriedades">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-8">
    {#each tables as def}
      <div class="space-y-3">
        {#if def.title}
          <h3 class="text-base font-semibold">{def.title}</h3>
        {/if}
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">{def.cols.prop}</th>
                <th class="p-3 border-r border-border font-semibold">{def.cols.type}</th>
                <th class="p-3 border-r border-border font-semibold">{def.cols.default}</th>
                <th class="p-3 border-r border-border font-semibold">{def.cols.required}</th>
                <th class="p-3 font-semibold">{def.cols.description}</th>
              </tr>
            </thead>
            <tbody>
              {#each def.items as item}
                <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono font-bold text-primary">{item.name}</td>
                  <td class="p-3 border-r border-border font-mono text-muted-foreground">{item.type}</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{item.defaultValue}</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{item.required}</td>
                  <td class="p-3 text-muted-foreground">{item.description}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/each}
    {#if interfaceCode}
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
        <code class="whitespace-pre">{interfaceCode}</code>
      </div>
    {/if}
    {#if extensibilityTitle}
      <div class="space-y-2">
        <h3 class="text-base font-semibold">{extensibilityTitle}</h3>
        {#if extensibilityNotes}
          <div class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml(extensibilityNotes)}</div>
        {/if}
      </div>
    {/if}
  </div>
</section>
