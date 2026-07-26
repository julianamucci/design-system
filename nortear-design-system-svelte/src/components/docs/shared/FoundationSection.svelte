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
  import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
  } from '@/components/ui/card';

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
    // Forma mista: cols = { chave: rótulo }, rows = ARRAY de arrays (posicional)
    // — ex.: "Tipos de uso" da página Motion.
    if (isObject(n.cols) && isArray(n.rows)) {
      const cols = Object.values(n.cols).map(String);
      return { cols, rows: n.rows };
    }
    // Forma em objeto: cols = { chave: rótulo }, rows = { id: { chave: valor } }.
    // Mapeia cada célula pela CHAVE de coluna (igual React/Vue/Vanilla).
    if (isObject(n.cols) && isObject(n.rows)) {
      const colKeys = Object.keys(n.cols);
      const cols = colKeys.map((k) => String((n.cols as Record<string, unknown>)[k]));
      // Linha pode ser objeto (mapeia pela CHAVE da coluna) ou array (posicional).
      const rows = Object.values(n.rows).map((row) => {
        if (isArray(row)) return row.map((c) => (c == null ? '' : String(c)));
        if (isObject(row)) return colKeys.map((k) => (row[k] == null ? '' : String(row[k])));
        return [String(row)];
      });
      return { cols, rows };
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

  // Chaves candidatas a título e a corpo de um card (na ordem de preferência).
  const TITLE_KEYS = ['title', 'name', 'label'];
  const BODY_KEYS = ['body', 'description', 'usage', 'use', 'text'];

  function itemTitle(v: unknown): string {
    if (!isObject(v)) return '';
    const k = TITLE_KEYS.find((x) => typeof v[x] === 'string');
    return k ? (v[k] as string) : '';
  }
  function itemBody(v: unknown): string {
    if (isString(v)) return v;
    if (!isObject(v)) return '';
    const k = BODY_KEYS.find((x) => typeof v[x] === 'string');
    return k ? (v[k] as string) : '';
  }
  function itemExtras(v: unknown): Array<[string, string]> {
    if (!isObject(v)) return [];
    const tk = TITLE_KEYS.find((x) => typeof v[x] === 'string');
    const bk = BODY_KEYS.find((x) => typeof v[x] === 'string');
    return Object.entries(v).filter(
      ([k, val]) => typeof val === 'string' && k !== tk && k !== bk,
    ) as Array<[string, string]>;
  }

  function headingClass(l: number): string {
    // Roles compostos do type scale já trazem o peso — não empilhar nds-font-*.
    if (l <= 2) return 'nds-text-h2 nds-text-foreground';
    if (l === 3) return 'nds-text-h3 nds-text-foreground';
    if (l === 4) return 'nds-text-h4 nds-text-foreground';
    return 'nds-text-body nds-font-medium';
  }
</script>

{#snippet renderValue(value: unknown, depth: number)}
  {#if isString(value)}
    <p class="nds-text-body nds-leading-relaxed">{@html value}</p>
  {:else if isArray(value)}
    {#if value.every((v) => isString(v))}
      <ul class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground" data-spacing="xs">
        {#each value as item}
          <li>{@html item}</li>
        {/each}
      </ul>
    {:else}
      <div class="nds-stack" data-spacing="sm">
        {#each value as item}
          {#if isObject(item)}
            <div class="nds-stack nds-p-4 nds-rounded-md nds-border-soft nds-bg-card" data-spacing="xs">
              {@render renderObject(item, depth + 1)}
            </div>
          {:else}
            <p class="nds-text-body">{String(item)}</p>
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
  <div class="nds-stack" data-spacing="md">
    {#each entries(obj) as [key, value]}
        {#if (key === 'cols' || key === 'tableCols') && table}
          <!-- Tabela renderizada na posição da chave `cols` — as demais chaves
               (title, subtitle, rules...) continuam no fluxo. Antes, um `if`
               de topo curto-circuitava e engolia o resto da seção. -->
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
        {:else if (key === 'rows' || key === 'tableRows') && table}
          <!-- consumida pela tabela renderizada na chave cols -->
        {:else if key === 'title' && isString(value)}
          {@const Tag = headingTag(depth)}
          <svelte:element this={Tag} class="{headingClass(depth)}">{@html value}</svelte:element>
        {:else if (key === 'subtitle' || key === 'body' || key === 'description' || key === 'intro' || key === 'audience' || key === 'note') && isString(value)}
          <p class="nds-text-body nds-leading-relaxed">{@html value}</p>
        {:else if key === 'items' && isObject(value)}
          {@const itemsAreCards = Object.values(value).some((v) => v !== null && typeof v === 'object')}
          {#if itemsAreCards}
            <!-- Itens objeto → grid fixo de 2 colunas de Card (title + description + extras) -->
            <div class="nds-grid" data-cols="2" data-fixed="true" data-spacing="md">
              {#each entries(value) as [, item]}
                <Card>
                  <CardHeader>
                    {#if itemTitle(item)}
                      <CardTitle as="h3">{@html itemTitle(item)}</CardTitle>
                    {/if}
                    {#if itemBody(item)}
                      <CardDescription>{@html itemBody(item)}</CardDescription>
                    {/if}
                  </CardHeader>
                  {#if itemExtras(item).length}
                    <CardContent class="nds-stack" data-spacing="xs">
                      {#each itemExtras(item) as [, exVal]}
                        <p class="nds-text-caption nds-text-muted-foreground nds-m-0">{@html exVal}</p>
                      {/each}
                    </CardContent>
                  {/if}
                </Card>
              {/each}
            </div>
          {:else}
            <ul class="nds-stack nds-list-none" data-spacing="md">
              {#each entries(value) as [, item]}
                <li class="nds-text-body nds-leading-relaxed nds-accent-start">{@html String(item)}</li>
              {/each}
            </ul>
          {/if}
        {:else if key === 'rules' && (isObject(value) || isArray(value))}
          <!-- rules → lista de acento, sem heading do nome da chave (igual às demais stacks) -->
          <ul class="nds-stack nds-list-none" data-spacing="md">
            {#each (isArray(value) ? value : Object.values(value)) as rule}
              {#if isString(rule)}
                <li class="nds-text-body nds-leading-relaxed nds-accent-start">{@html rule}</li>
              {/if}
            {/each}
          </ul>
        {:else if key === 'items' && isArray(value)}
          <ul class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground" data-spacing="xs">
            {#each value as item}
              {#if isString(item)}
                <li>{@html item}</li>
              {:else if isObject(item) && isString(item.title)}
                <li><strong>{item.title}</strong>{#if isString(item.body)} — {@html item.body}{/if}</li>
              {/if}
            {/each}
          </ul>
        {:else if isString(value)}
          <!-- `*Title` → h3, `*Code` → bloco de código, resto → parágrafo (sem rótulo de chave) -->
          {#if key.endsWith('Title')}
            <h3 class="nds-text-h3 nds-text-foreground">{@html value}</h3>
          {:else if key.endsWith('Code')}
            <div class="nds-docs-code"><span class="nds-whitespace-pre">{@html value}</span></div>
          {:else}
            <p class="nds-text-body nds-leading-relaxed">{@html value}</p>
          {/if}
        {:else if isArray(value) || isObject(value)}
          <section class="nds-stack" data-spacing="xs">
            {@render renderValue(value, depth)}
          </section>
        {/if}
      {/each}
    </div>
{/snippet}

{#if isObject(node)}
  {@render renderObject(node, level)}
{:else if node !== undefined && node !== null}
  {@render renderValue(node, level)}
{/if}
