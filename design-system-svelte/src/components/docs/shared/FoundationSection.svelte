<script lang="ts">
  /**
   * Renderer genérico de seção Foundations.
   * Recebe uma `node` arbitrária do JSON de tradução e renderiza
   * texto, listas, tabelas (se `cols`/`rows` ou `tableCols`/`tableRows`) e
   * subgrupos aninhados de forma legível.
   *
   * Não tenta cobrir 100% dos formatos — apenas os shapes recorrentes em
   * docs/shared/content/foundations/*. Strings com HTML simples (<code>, <strong>)
   * usam @html porque o conteúdo é controlado pelo design system.
   */
  import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  } from '@/components/ui/table';

  type Props = {
    node: unknown;
    level?: number;
  };

  let { node, level = 2 }: Props = $props();

  function isString(v: unknown): v is string {
    return typeof v === 'string';
  }
  function isObject(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }
  function isArray(v: unknown): v is unknown[] {
    return Array.isArray(v);
  }

  // Chaves que indicam que o nó é uma tabela.
  function asTable(n: Record<string, unknown>):
    | { cols: string[]; rows: unknown[] }
    | null {
    if (isArray(n.cols) && isArray(n.rows)) {
      return { cols: n.cols.map(String), rows: n.rows };
    }
    if (isArray(n.tableCols) && isArray(n.tableRows)) {
      return { cols: n.tableCols.map(String), rows: n.tableRows };
    }
    return null;
  }

  function isRowArray(row: unknown): row is string[] {
    return isArray(row) && row.every((c) => typeof c === 'string' || typeof c === 'number');
  }

  function cellsOfObjectRow(row: Record<string, unknown>, cols: string[]): string[] {
    // Tenta mapear cada coluna a uma chave do row pelo "slug" da coluna.
    return cols.map((col) => {
      const k = col.toLowerCase().replace(/[^a-z0-9]+/g, '');
      for (const key of Object.keys(row)) {
        if (key.toLowerCase().replace(/[^a-z0-9]+/g, '') === k) {
          const v = row[key];
          return v == null ? '' : String(v);
        }
      }
      // fallback: primeira propriedade ainda não usada
      const vals = Object.values(row).map((v) => (v == null ? '' : String(v)));
      return vals[cols.indexOf(col)] ?? '';
    });
  }

  // Renderiza um objeto de "items" (mapa de itens) como cards de título + body.
  function entries(obj: Record<string, unknown>): [string, unknown][] {
    return Object.entries(obj);
  }

  // Pula chaves meta (já tratadas no header da página).
  const META_KEYS = new Set(['title', 'category', 'type', 'description', 'seo', 'nav']);

  function headingTag(l: number): 'h2' | 'h3' | 'h4' | 'h5' {
    if (l <= 2) return 'h2';
    if (l === 3) return 'h3';
    if (l === 4) return 'h4';
    return 'h5';
  }

  function headingClass(l: number): string {
    if (l <= 2) return 'text-xl font-semibold text-foreground';
    if (l === 3) return 'text-lg font-semibold text-foreground';
    if (l === 4) return 'text-base font-medium text-foreground';
    return 'text-sm font-medium text-foreground';
  }
</script>

{#snippet renderValue(value: unknown, depth: number)}
  {#if isString(value)}
    <p class="text-sm text-muted-foreground leading-relaxed">{@html value}</p>
  {:else if isArray(value)}
    {#if value.every((v) => isString(v))}
      <ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        {#each value as item}
          <li>{@html item}</li>
        {/each}
      </ul>
    {:else}
      <div class="space-y-3">
        {#each value as item}
          {#if isObject(item)}
            <div class="rounded-lg border border-border/50 p-4 space-y-2">
              {@render renderObject(item, depth + 1)}
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">{String(item)}</p>
          {/if}
        {/each}
      </div>
    {/if}
  {:else if isObject(value)}
    {@render renderObject(value, depth + 1)}
  {/if}
{/snippet}

{#snippet renderObject(obj: Record<string, unknown>, depth: number)}
  {@const table = asTable(obj)}
  {#if table}
    <div class="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {#each table.cols as col}
              <TableHead>{col}</TableHead>
            {/each}
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each table.rows as row}
            <TableRow>
              {#if isRowArray(row)}
                {#each row as cell}
                  <TableCell>{@html String(cell)}</TableCell>
                {/each}
              {:else if isObject(row)}
                {#each cellsOfObjectRow(row, table.cols) as cell}
                  <TableCell>{@html cell}</TableCell>
                {/each}
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {:else}
    <div class="space-y-4">
      {#each entries(obj) as [key, value]}
        {#if key === 'title' && isString(value)}
          {@const Tag = headingTag(depth)}
          <svelte:element this={Tag} class={headingClass(depth)}>{value}</svelte:element>
        {:else if (key === 'subtitle' || key === 'body' || key === 'description' || key === 'intro' || key === 'audience' || key === 'note') && isString(value)}
          <p class="text-sm text-muted-foreground leading-relaxed">{@html value}</p>
        {:else if key === 'items' && isObject(value)}
          <div class="grid gap-3 md:grid-cols-2">
            {#each entries(value) as [, item]}
              {#if isObject(item)}
                <div class="rounded-lg border border-border/50 p-4 space-y-2">
                  {#if isString(item.title)}
                    <h4 class="text-sm font-semibold text-foreground">{item.title}</h4>
                  {/if}
                  {#if isString(item.body)}
                    <p class="text-sm text-muted-foreground leading-relaxed">{@html item.body}</p>
                  {:else if isString(item.description)}
                    <p class="text-sm text-muted-foreground leading-relaxed">{@html item.description}</p>
                  {/if}
                  {#if isArray(item.items)}
                    <ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {#each item.items as sub}
                        {#if isString(sub)}
                          <li>{@html sub}</li>
                        {:else if isObject(sub) && isString(sub.title)}
                          <li><strong>{sub.title}</strong>{#if isString(sub.body)} — {@html sub.body}{/if}</li>
                        {/if}
                      {/each}
                    </ul>
                  {/if}
                </div>
              {:else if isString(item)}
                <p class="text-sm text-muted-foreground">{@html item}</p>
              {/if}
            {/each}
          </div>
        {:else if key === 'items' && isArray(value)}
          <ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {#each value as item}
              {#if isString(item)}
                <li>{@html item}</li>
              {:else if isObject(item) && isString(item.title)}
                <li><strong>{item.title}</strong>{#if isString(item.body)} — {@html item.body}{/if}</li>
              {/if}
            {/each}
          </ul>
        {:else if isString(value)}
          <div class="space-y-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{key}</span>
            <p class="text-sm text-foreground leading-relaxed">{@html value}</p>
          </div>
        {:else if isArray(value) || isObject(value)}
          <section class="space-y-2">
            {@render renderValue(value, depth)}
          </section>
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#if isObject(node)}
  {@render renderObject(node, level)}
{:else if node !== undefined && node !== null}
  {@render renderValue(node, level)}
{/if}
