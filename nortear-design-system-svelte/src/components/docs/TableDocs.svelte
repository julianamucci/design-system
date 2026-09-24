<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import { Button } from '@/components/ui/button';
  import { Checkbox } from '@/components/ui/checkbox';
  import { Input } from '@/components/ui/input';
  import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination';
  import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Search from '@lucide/svelte/icons/search';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import tableTranslations from '@shared/content/table/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tableTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (tableTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'table',
    });
    track('docs_page_view', {
      component_name: 'table',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'table', locale: $locale });
  });
  $effect(() => section.attach());

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Quantos itens a seção publica HOJE, perguntado ao dicionário.
   *
   * Lista cravada à mão envelhece em SILÊNCIO: o conteúdo compartilhado cresce
   * nos três idiomas e a tela fica para trás sem nada ficar vermelho — foi assim
   * que um teste funcional, um visual e um de acessibilidade ficaram escritos e
   * invisíveis nesta página. Trocar `item1..item6` por `item1..item8` repetiria
   * o defeito no item seguinte, então quem decide o fim da lista é o dicionário.
   *
   * A parada é no primeiro índice AUSENTE, e não no tamanho do objeto: item
   * numerado fora de ordem é defeito de conteúdo, e tolerá-lo aqui o esconderia.
   * Mesma forma do DropdownMenuDocs desta stack.
   */
  function entriesFromDict<K extends string>(
    t: (key: string, defaultValue?: string) => string,
    base: string,
    fields: readonly K[],
  ): Array<Record<K, string>> {
    const out: Array<Record<K, string>> = [];
    for (let i = 1; ; i++) {
      if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
      out.push(
        Object.fromEntries(
          fields.map((field) => [field, t(`${base}.item${i}.${field}`, '')]),
        ) as Record<K, string>,
      );
    }
    return out;
  }

  // ─── Demo data ───────────────────────────────────────────────────────────────

  /**
   * A linha carrega o TEXTO JÁ TRADUZIDO, resolvido chave a chave.
   *
   * O caminho é escrito por EXTENSO de propósito. A varredura que compara as
   * cinco demonstrações procura a string literal `demonstration.labels.<chave>`
   * no arquivo; chave montada em template literal não aparece para ela — foi
   * assim que esta página constava lendo 14 dos 26 rótulos, com o método, o
   * identificador da fatura e três valores existindo só dentro de um
   * `$tStore(…${chave})`.
   *
   * Cinco dos rótulos são idênticos nos três idiomas porque são número de
   * documento e valor de fatura: esperado, e não redundância.
   */
  const invoices = $derived([
    {
      id: $tStore('demonstration.labels.inv001'),
      status: $tStore('demonstration.labels.paid'),
      method: $tStore('demonstration.labels.creditCard'),
      amount: $tStore('demonstration.labels.amount001'),
    },
    {
      id: $tStore('demonstration.labels.inv002'),
      status: $tStore('demonstration.labels.pending'),
      method: $tStore('demonstration.labels.bankTransfer'),
      amount: $tStore('demonstration.labels.amount002'),
    },
    {
      id: $tStore('demonstration.labels.inv003'),
      status: $tStore('demonstration.labels.canceled'),
      method: $tStore('demonstration.labels.pix'),
      amount: $tStore('demonstration.labels.amount003'),
    },
    {
      id: $tStore('demonstration.labels.inv004'),
      status: $tStore('demonstration.labels.paid'),
      method: $tStore('demonstration.labels.creditCard'),
      amount: $tStore('demonstration.labels.amount004'),
    },
    {
      id: $tStore('demonstration.labels.inv005'),
      status: $tStore('demonstration.labels.pending'),
      method: $tStore('demonstration.labels.pix'),
      amount: $tStore('demonstration.labels.amount005'),
    },
  ]);

  const skeletonRows = [1, 2, 3, 4, 5];

  // ─── Linha expansível ────────────────────────────────────────────────────────

  /**
   * O disclosure da prévia de `withExpandableRows` alterna DE VERDADE.
   *
   * Prévia que nasce aberta e não fecha documenta um desenho, não um
   * comportamento: o contrato que a variante existe para mostrar é o do estado
   * morando no CONTROLE (`aria-expanded`) enquanto a linha guarda o dela
   * (`data-state="selected"`) — e os dois acontecerem juntos só se vê alternando.
   * Mesma forma da story `WithExpandableRows` desta stack, em escala menor.
   */
  let expandedRows = $state<Record<string, boolean>>({});

  /**
   * O `id` sai do REGISTRO e sem o `#`: duas tabelas na mesma página não podem
   * repetir `id`, e `#` dentro dele quebraria qualquer `querySelector`.
   */
  function detailIdOf(id: string): string {
    return `table-docs-row-detail-${id.replace('#', '')}`;
  }

  function toggleRow(id: string) {
    expandedRows = { ...expandedRows, [id]: !expandedRows[id] };
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from "@/components/ui/table";`;

  const codeBasic = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`;

  /**
   * O total sai do DICIONÁRIO, e não de um número escrito no snippet.
   *
   * Estava cravado em `R$ 1.000,00`, que não fechava com nenhum conjunto de
   * dados desta página — o mesmo defeito que a variante com rodapé desta stack
   * já tinha pago. Número de sumário escrito à mão mente em silêncio: nenhum
   * compilador soma as linhas acima dele, e o leitor copia a mentira junto com
   * a forma. Sendo o mesmo `totalAmount` que a tabela ao lado exibe, o snippet
   * e o exemplo não podem mais discordar.
   */
  const codeWithFooter = $derived(`<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan={3}>${$tStore('demonstration.labels.total')}</TableCell>
      <TableCell class="nds-text-right">${$tStore('demonstration.labels.totalAmount')}</TableCell>
    </TableRow>
  </TableFooter>
</Table>`);

  const codeSrOnlyCaption = `<Table>
  <!-- Caption visualmente oculto — título já está acima -->
  <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <!-- ... -->
    </TableRow>
  </TableHeader>
  <TableBody>
    <!-- ... -->
  </TableBody>
</Table>`;

  const codeInlineActions = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <!-- ... -->
      <TableHead scope="col">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <!-- ... -->
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Ações para fatura {invoice.id}"
          >
            &hellip;
          </Button>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`;

  const codeEmptyState = `<TableBody>
  {#if invoices.length === 0}
    <TableRow>
      <TableCell colspan={4} class="nds-table-empty">
        Nenhuma fatura encontrada.
      </TableCell>
    </TableRow>
  {:else}
    {#each invoices as invoice (invoice.id)}
      <TableRow><!-- ... --></TableRow>
    {/each}
  {/if}
</TableBody>`;

  const codeExpandableRows = `<script lang="ts">
  let open = $state<Record<string, boolean>>({});
  const detailId = (id: string) => \`row-detail-\${id.replace('#', '')}\`;
<\/script>

<Table>
  <TableHeader>
    <TableRow>
      <!-- A coluna do disclosure vem primeiro e tem cabeçalho: o rótulo sai da
           tela num span, e não por classe no th, que desmontaria a grade. -->
      <TableHead scope="col"><span class="nds-sr-only">Detalhes</span></TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <!-- ... -->
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <!-- data-state é da SELEÇÃO; o estado de abertura mora no controle. -->
      <TableRow data-state={selected.has(invoice.id) ? 'selected' : undefined}>
        <TableCell>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open[invoice.id] ? 'true' : 'false'}
            aria-controls={detailId(invoice.id)}
            aria-label={\`Detalhes da fatura \${invoice.id}\`}
            onclick={() => (open = { ...open, [invoice.id]: !open[invoice.id] })}
          >
            <ChevronDown class="nds-chevron" aria-hidden="true" />
          </Button>
        </TableCell>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <!-- ... -->
      </TableRow>
      <!-- A revelada é IRMÃ e está SEMPRE no DOM: o id é alvo do aria-controls,
           e alvo que some deixa o atributo apontando para nada. Fechada, hidden
           a tira da tela e da tabulação pelo mesmo atributo. -->
      <TableRow id={detailId(invoice.id)} hidden={!open[invoice.id]}>
        <TableCell colspan={columns.length + 1}>
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-muted-foreground">Emitida em 03/09/2026...</p>
            <Button variant="outline" size="sm">Baixar recibo</Button>
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`;

  const codeSelected = `<TableRow data-state={isSelected ? 'selected' : undefined}>
  <!-- ... -->
</TableRow>`;

  const codeLoading = `<TableBody>
  {#each skeletonRows as row (row)}
    <TableRow>
      <TableCell><Skeleton data-shape="text" data-width="1-2" /></TableCell>
      <TableCell><Skeleton data-shape="text" data-width="1-3" /></TableCell>
      <TableCell><Skeleton data-shape="text" data-width="3-4" /></TableCell>
      <TableCell><Skeleton class="nds-spacer-start" data-shape="text" data-width="1-3" /></TableCell>
    </TableRow>
  {/each}
</TableBody>`;

  const codeTokenCustomization = `/* Em globals.css — sobrescrever tokens semânticos */
:root {
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
}

.dark {
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}`;

  const interfaceCode = `// Table — todos os subcomponentes aceitam class e ...restProps
interface TableProps {
  class?: string;
  children?: Snippet;
}

interface TableHeadProps {
  scope: 'col' | 'row';  // obrigatório
  class?: string;
  children?: Snippet;
}

interface TableCellProps {
  colspan?: number;
  rowspan?: number;
  class?: string;
  children?: Snippet;
}

interface TableRowProps {
  'data-state'?: 'selected';
  class?: string;
  children?: Snippet;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration>
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.method')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each invoices as invoice (invoice.id)}
              <TableRow>
                <TableCell class="nds-font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell class="nds-text-right">{invoice.amount}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colspan={3}>{$tStore('demonstration.labels.total')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.totalAmount')}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DocsDemonstration>

      <!-- ── Anatomia ───────────────────────────────────────────────── -->
      <DocsAnatomy
        items={[
          $tStore('anatomy.item1'),
          $tStore('anatomy.item2'),
          $tStore('anatomy.item3'),
          $tStore('anatomy.item4'),
          $tStore('anatomy.item5'),
          $tStore('anatomy.item6'),
          $tStore('anatomy.item7'),
          $tStore('anatomy.item8'),
        ]}
        structureLabel={$tStore('anatomy.structureLabel')}
        structureCode={$tStore('anatomy.structureCode')}
      />

      <!-- ── Quando Usar ────────────────────────────────────────────── -->
      <DocsWhenToUse
        guidelines={{
          title: $tStore('usage.guidelines.title'),
          items: [
            $tStore('usage.guidelines.item1'),
            $tStore('usage.guidelines.item2'),
            $tStore('usage.guidelines.item3'),
            $tStore('usage.guidelines.item4'),
            $tStore('usage.guidelines.item5'),
          ],
        }}
        scenarios={{
          title: $tStore('usage.scenarios.title'),
          cols: {
            scenario: $tStore('usage.scenarios.cols.scenario'),
            use: $tStore('usage.scenarios.cols.use'),
            alternative: $tStore('usage.scenarios.cols.alternative'),
          },
          items: [
            { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
            { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
            { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
            { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
            { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
          ],
        }}
        uxWriting={{
          title: $tStore('usage.uxWriting.title'),
          cols: {
            element: $tStore('usage.uxWriting.table.element'),
            rules: $tStore('usage.uxWriting.table.rules'),
            do: $tStore('usage.uxWriting.table.correct'),
            dont: $tStore('usage.uxWriting.table.avoid'),
          },
          items: [
            { element: $tStore('usage.uxWriting.table.caption.name'),     rules: $tStore('usage.uxWriting.table.caption.format'),     do: $tStore('usage.uxWriting.table.caption.good'),     dont: $tStore('usage.uxWriting.table.caption.bad')     },
            { element: $tStore('usage.uxWriting.table.head.name'),        rules: $tStore('usage.uxWriting.table.head.format'),        do: $tStore('usage.uxWriting.table.head.good'),        dont: $tStore('usage.uxWriting.table.head.bad')        },
            { element: $tStore('usage.uxWriting.table.emptyState.name'),  rules: $tStore('usage.uxWriting.table.emptyState.format'),  do: $tStore('usage.uxWriting.table.emptyState.good'),  dont: $tStore('usage.uxWriting.table.emptyState.bad')  },
            { element: $tStore('usage.uxWriting.table.actionLabel.name'), rules: $tStore('usage.uxWriting.table.actionLabel.format'), do: $tStore('usage.uxWriting.table.actionLabel.good'), dont: $tStore('usage.uxWriting.table.actionLabel.bad') },
          ],
        }}
        do={{
          title: $tStore('usage.do.title'),
          items: [
            $tStore('usage.do.item1'),
            $tStore('usage.do.item2'),
            $tStore('usage.do.item3'),
            $tStore('usage.do.item4'),
          ],
        }}
        dont={{
          title: $tStore('usage.dont.title'),
          items: [
            $tStore('usage.dont.item1'),
            $tStore('usage.dont.item2'),
            $tStore('usage.dont.item3'),
          ],
        }}
      />

      <!-- ── Do & Don't ─────────────────────────────────────────────── -->
      <DocsDoDont
        pairs={[
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair1.do'),
            dontCaption: $tStore('doDont.pair1.dont'),
            doPreview: doPair1,
            dontPreview: dontPair1,
          },
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair2.do'),
            dontCaption: $tStore('doDont.pair2.dont'),
            doPreview: doPair2,
            dontPreview: dontPair2,
          },
        ]}
      />

      <!-- O par fala da LEGENDA, e só dela: as duas prévias são idênticas
           exceto pelo `<TableCaption>`, que existe no `do` e não existe no
           `dont`. Diferença a mais aqui não é reforço — é ruído que o leitor
           teria de descartar para achar o que o par ensina.

           E `scope` NÃO é escrito em nenhuma das duas, de propósito: o
           `TableHead` desta stack já nasce com `scope="col"`, então o `dont`
           renderizaria o atributo de qualquer jeito e o par não ilustraria
           ausência nenhuma. Escrever `scope` vazio para forçar o contraste
           ensinaria a desarmar um default seguro. -->
      {#snippet doPair1()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead>{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet dontPair1()}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead>{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet doPair2()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <!-- UMA coluna, como na referência: o par fala do estado vazio, e
                   uma segunda coluna só faz o `colspan` parecer maior do que o
                   contrato precisa. -->
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colspan={1} class="nds-table-empty">
                {$tStore('demonstration.labels.emptyState')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet dontPair2()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- tabela vazia sem mensagem -->
          </TableBody>
        </Table>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport componentSlug="table"
        code={codeImport}
      />

      <!-- ── Variantes ──────────────────────────────────────────────── -->
      <DocsVariants
        items={[
          { trackId: 'basic', name: $tStore('variants.items.basic.label'),            description: stripHtml($tStore('variants.items.basic.description')),            code: codeBasic,          preview: variantBasic          },
          { trackId: 'withFooter', name: $tStore('variants.items.withFooter.label'),       description: stripHtml($tStore('variants.items.withFooter.description')),       code: codeWithFooter,     preview: variantWithFooter     },
          { trackId: 'withSrOnlyCaption', name: $tStore('variants.items.withSrOnlyCaption.label'),description: stripHtml($tStore('variants.items.withSrOnlyCaption.description')),code: codeSrOnlyCaption,  preview: variantSrOnlyCaption  },
          { trackId: 'withInlineActions', name: $tStore('variants.items.withInlineActions.label'),description: stripHtml($tStore('variants.items.withInlineActions.description')),code: codeInlineActions,  preview: variantInlineActions  },
          { trackId: 'withEmptyState', name: $tStore('variants.items.withEmptyState.label'),   description: stripHtml($tStore('variants.items.withEmptyState.description')),   code: codeEmptyState,     preview: variantEmptyState     },
          { trackId: 'withExpandableRows', name: $tStore('variants.items.withExpandableRows.label'), description: stripHtml($tStore('variants.items.withExpandableRows.description')), code: codeExpandableRows, preview: variantExpandableRows },
        ]}
      />

      {#snippet variantBasic()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet variantWithFooter()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colspan={2}>{$tStore('demonstration.labels.total')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.totalAmount')}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      {/snippet}

      {#snippet variantSrOnlyCaption()}
        <div>
          <p class="nds-text-body nds-font-semibold nds-mb-2">{$tStore('demonstration.labels.caption')}</p>
          <Table>
            <TableCaption class="nds-sr-only">{$tStore('demonstration.labels.caption')}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
                <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      {/snippet}

      {#snippet variantInlineActions()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each invoices.slice(0, 3) as invoice (invoice.id)}
              <TableRow>
                <TableCell class="nds-font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell class="nds-text-right">{invoice.amount}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${$tStore('demonstration.labels.actionsLabel')} ${invoice.id}`}
                  >
                    &hellip;
                  </Button>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/snippet}

      {#snippet variantEmptyState()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.method')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colspan={4} class="nds-table-empty">
                {$tStore('demonstration.labels.emptyState')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet variantExpandableRows()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <!-- A coluna do disclosure vem PRIMEIRO e tem cabeçalho. O rótulo
                   sai da tela num `<span class="nds-sr-only">` e não por classe
                   no próprio `<th>`: a classe tiraria a célula do fluxo e
                   desmontaria a grade, deixando as colunas de dado fora de
                   prumo com as linhas. -->
              <TableHead scope="col">
                <span class="nds-sr-only">{$tStore('demonstration.labels.detailsColumn')}</span>
              </TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="nds-text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each invoices.slice(0, 3) as invoice, i (invoice.id)}
              <!-- `data-state` é da SELEÇÃO, e o segundo registro nasce marcado
                   de propósito: aberta E marcada ao mesmo tempo é o caso que o
                   `:not([data-state="selected"])` da folha compartilhada
                   protege (C18 do PRD), e é o que esta prévia existe para deixar
                   ver. O estado de ABERTURA não entra aqui — ele mora no
                   controle, em `aria-expanded`. -->
              <TableRow data-state={i === 1 ? 'selected' : undefined}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-expanded={expandedRows[invoice.id] ? 'true' : 'false'}
                    aria-controls={detailIdOf(invoice.id)}
                    aria-label={`${$tStore('demonstration.labels.detailsLabel')} ${invoice.id}`}
                    onclick={() => toggleRow(invoice.id)}
                  >
                    <!-- Sem classe de tamanho: `.nds-button > svg` já dimensiona
                         o ícone. `nds-chevron` é a rotação global do disclosure
                         e casa com `[aria-expanded="true"]` — o mesmo atributo
                         que a folha lê para pintar a linha. -->
                    <ChevronDown class="nds-chevron" aria-hidden="true" />
                  </Button>
                </TableCell>
                <TableCell class="nds-font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell class="nds-text-right">{invoice.amount}</TableCell>
              </TableRow>
              <!-- A revelada é IRMÃ e está SEMPRE no DOM, escondida por `hidden`:
                   o `id` dela é o alvo do `aria-controls`, e alvo que some deixa
                   o atributo apontando para nada. O `colspan` é o das três
                   colunas de dado mais a do disclosure. -->
              <TableRow id={detailIdOf(invoice.id)} hidden={!expandedRows[invoice.id]}>
                <TableCell colspan={4}>
                  <div class="nds-stack" data-spacing="sm">
                    <p class="nds-text-muted-foreground">{$tStore('demonstration.labels.detailText')}</p>
                    <!-- Um controle dentro do detalhe: é ele que prova que o
                         conteúdo revelado entra na tabulação logo depois do
                         disclosure, e sai dela quando a linha fecha. -->
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`${$tStore('demonstration.labels.receiptLabel')} ${invoice.id}`}
                    >
                      {$tStore('demonstration.labels.receipt')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/snippet}

      <!-- ── Composições ──────────────────────────────────────────────── -->
      <DocsCompositions
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="table"
        items={[
          {
            trackId: 'filterableToolbar',
            name: $tStore('variants.compositions.filterableToolbar.name'),
            description: $tStore('variants.compositions.filterableToolbar.description'),
            useWhen: $tStore('variants.compositions.filterableToolbar.use'),
            code: `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-align="center" data-spacing="md">
    <div class="nds-w-full nds-max-w-sm" style="position: relative">
      <Search class="nds-icon-input-start nds-icon nds-text-muted-foreground" aria-hidden="true" />
      <Input aria-label="Filtrar faturas" placeholder="Filtrar faturas..." class="nds-pl-8" />
    </div>
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" class="nds-text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each filtered as invoice (invoice.id)}
        <TableRow>
          <TableCell>{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell class="nds-text-right">{invoice.amount}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>`,
            preview: compFilterableToolbar,
          },
          {
            trackId: 'sortableHeaders',
            name: $tStore('variants.compositions.sortableHeaders.name'),
            description: $tStore('variants.compositions.sortableHeaders.description'),
            useWhen: $tStore('variants.compositions.sortableHeaders.use'),
            code: `<TableHead scope="col" aria-sort="ascending">
  <Button variant="ghost" size="sm">
    Fatura
    <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
  </Button>
</TableHead>`,
            preview: compSortableHeaders,
          },
          {
            trackId: 'selectableRows',
            name: $tStore('variants.compositions.selectableRows.name'),
            description: $tStore('variants.compositions.selectableRows.description'),
            useWhen: $tStore('variants.compositions.selectableRows.use'),
            code: `<TableRow data-state={selected.has(invoice.id) ? 'selected' : undefined}>
  <TableCell>
    <Checkbox
      checked={selected.has(invoice.id)}
      onCheckedChange={(c) => toggle(invoice.id, c)}
      aria-label={\`Selecionar fatura \${invoice.id}\`}
    />
  </TableCell>
  <TableCell>{invoice.id}</TableCell>
  <TableCell>{invoice.status}</TableCell>
</TableRow>`,
            preview: compSelectableRows,
          },
          {
            trackId: 'withPagination',
            name: $tStore('variants.compositions.withPagination.name'),
            description: $tStore('variants.compositions.withPagination.description'),
            useWhen: $tStore('variants.compositions.withPagination.use'),
            code: `<div class="nds-stack" data-spacing="sm">
  <Table><!-- linhas --></Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
      <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
      <PaginationItem><PaginationNext href="#" /></PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
            preview: compWithPagination,
          },
        ]}
      />

      {#snippet compFilterableToolbar()}
        <div class="nds-w-full nds-stack" data-spacing="sm">
          <div class="nds-cluster" data-align="center" data-spacing="md">
            <div class="nds-w-full nds-max-w-sm" style="position: relative">
              <Search class="nds-icon-input-start nds-icon nds-text-muted-foreground" aria-hidden="true" />
              <!-- `nds-pl-8` e não `padding-left` inline: o inline era contorno de
                   um defeito de cascata já consertado — `spacing.css` passou a ser
                   importada depois de `input.css`, e a utilitária vence o empate.
                   Valor de desenho cravado no atributo `style` deixa o tema, a
                   densidade e a escala de tipo para trás.

                   O `aria-label` espelha o placeholder porque placeholder NÃO é
                   nome acessível: ele some ao digitar, e o campo passaria a ser um
                   controle mudo justo quando tem conteúdo. Mesma forma do campo de
                   filtro do DataTable. -->
              <Input
                aria-label={$tStore('demonstration.labels.filterLabel')}
                placeholder="Filtrar faturas..."
                class="nds-pl-8"
              />
            </div>
            <Button variant="outline">Status</Button>
          </div>
          <Table>
            <TableCaption class="nds-sr-only">Lista de faturas filtráveis</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="nds-text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
                <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
                <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
                <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      {/snippet}

      {#snippet compSortableHeaders()}
        <Table>
          <TableCaption class="nds-sr-only">Faturas ordenáveis</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" aria-sort="ascending">
                <Button variant="ghost" size="sm">
                  Fatura
                  <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                <Button variant="ghost" size="sm">
                  Status
                  <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none" class="nds-text-right">
                <Button variant="ghost" size="sm">
                  Valor
                  <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet compSelectableRows()}
        <Table>
          <TableCaption class="nds-sr-only">Faturas com seleção</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <!-- Nome acessível é texto de TELA, e por isso sai do dicionário
                     como o rótulo de coluna ao lado: cravado em pt-BR, o leitor
                     de en/es ouvia o controle num idioma que não é o da página.
                     `selectRow` é prefixo, composto com o id da fatura — mesma
                     forma de `actionsLabel`. -->
                <Checkbox aria-label={$tStore('demonstration.labels.selectAll')} />
              </TableHead>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="nds-text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>
                <Checkbox
                  checked
                  aria-label={`${$tStore('demonstration.labels.selectRow')} ${$tStore('demonstration.labels.inv001')}`}
                />
              </TableCell>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Checkbox
                  aria-label={`${$tStore('demonstration.labels.selectRow')} ${$tStore('demonstration.labels.inv002')}`}
                />
              </TableCell>
              <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet compWithPagination()}
        <div class="nds-w-full nds-stack" data-spacing="sm">
          <Table>
            <TableCaption class="nds-sr-only">Faturas paginadas</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="nds-text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv001')}</TableCell>
                <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="nds-font-medium">{$tStore('demonstration.labels.inv002')}</TableCell>
                <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
                <TableCell class="nds-text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination count={20} perPage={5}>
            {#snippet children({ pages, currentPage })}
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious />
                </PaginationItem>
                {#each pages as page (page.key)}
                  {#if page.type === 'ellipsis'}
                    <PaginationItem>...</PaginationItem>
                  {:else}
                    <PaginationItem>
                      <PaginationLink {page} isActive={currentPage === page.value}>
                        {page.value}
                      </PaginationLink>
                    </PaginationItem>
                  {/if}
                {/each}
                <PaginationItem>
                  <PaginationNext />
                </PaginationItem>
              </PaginationContent>
            {/snippet}
          </Pagination>
        </div>
      {/snippet}

      <!-- ── Estados ────────────────────────────────────────────────── -->
      <DocsStates
        cols={{
          state: $tStore('states.cols.state'),
          trigger: toPlainText($tStore('states.cols.trigger')),
          behavior: toPlainText($tStore('states.cols.behavior')),
        }}
        items={[
          { label: $tStore('states.empty.label'),    trigger: toPlainText($tStore('states.empty.trigger')),    behavior: toPlainText($tStore('states.empty.behavior'))},
          { label: $tStore('states.selected.label'), trigger: toPlainText($tStore('states.selected.trigger')), behavior: toPlainText($tStore('states.selected.behavior'))},
          { label: $tStore('states.loading.label'),  trigger: toPlainText($tStore('states.loading.trigger')),  behavior: toPlainText($tStore('states.loading.behavior'))},
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        tables={[
          {
            title: $tStore('props.tableTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableHeadTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'scope',    type: '"col" | "row"', defaultValue: '—',   required: 'Sim', description: $tStore('props.items.scope')    },
              { name: 'class',    type: 'string',        defaultValue: '—',   required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet',       defaultValue: '—',   required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableCellTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'colspan',  type: 'number',  defaultValue: '—', required: 'Não', description: $tStore('props.items.colSpan')   },
              { name: 'rowspan',  type: 'number',  defaultValue: '—', required: 'Não', description: $tStore('props.items.rowSpan')   },
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableRowTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'data-state', type: '"selected" | undefined', defaultValue: '—', required: 'Não', description: $tStore('props.items.dataState') },
              { name: 'class',      type: 'string',                 defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children',   type: 'Snippet',                defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableCaptionTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.items.children')  },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={$tStore('props.extensibilityTitle')}
        extensibilityNotes={$tStore('props.extensibility')}
      />

      <!-- ── Tokens ─────────────────────────────────────────────────── -->
      <DocsTokens
        cols={{
          token: $tStore('tokens.table.token'),
          value: $tStore('tokens.table.part'),
          description: $tStore('tokens.table.description'),
        }}
        items={[
          { token: '--border',                          value: 'TableHeader / TableBody', description: $tStore('tokens.items.borderB')          },
          { token: '--muted',                       value: 'TableFooter / TableRow',  description: $tStore('tokens.items.bgMuted')           },
          { token: '--muted',    value: 'TableRow',                description: $tStore('tokens.items.bgMutedSelected')   },
          { token: '--muted-foreground',             value: 'TableCaption',            description: $tStore('tokens.items.textMuted')         },
          { token: '--font-weight-medium',                       value: 'TableHead / TableFooter', description: $tStore('tokens.items.fontMedium')        },
          { token: '--spacing-10',                              value: 'TableHead',               description: $tStore('tokens.items.h10')               },
          { token: '--spacing-2',                               value: 'TableCell',               description: $tStore('tokens.items.p2')                },
          { token: 'caption-side',                    value: 'Table',                   description: $tStore('tokens.items.captionBottom')     },
        ]}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeTokenCustomization}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        screenReaderTitle={$tNavStore('common.screenReader')}
        screenReaderItems={screenReaderItems}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.aria.scope'),
          $tStore('accessibility.aria.caption'),
          $tStore('accessibility.aria.ariaLabel'),
          $tStore('accessibility.aria.ariaSort'),
          $tStore('accessibility.aria.tabIndex'),
        ]}
        keyboardTitle="Navegação por teclado"
        keyboardItems={[
          { key: 'Tab',   description: $tStore('accessibility.keyboard.tab')        },
          { key: 'Enter', description: $tStore('accessibility.keyboard.enter')      },
          { key: 'Space', description: $tStore('accessibility.keyboard.space')      },
          { key: '—',     description: $tStore('accessibility.keyboard.noKeyboard') },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated componentSlug="table"
        items={[
          { name: 'Avatar',        description: $tStore('related.avatar'),       path: '?path=/docs/components-display-avatar--docs'       },
          { name: 'Badge',         description: $tStore('related.badge'),        path: '?path=/docs/components-feedback-badge--docs'        },
          { name: 'Pagination',    description: $tStore('related.pagination'),   path: '?path=/docs/components-navigation-pagination--docs'   },
          { name: 'Skeleton',      description: $tStore('related.skeleton'),     path: '?path=/docs/components-feedback-skeleton--docs'     },
          { name: 'DropdownMenu',  description: $tStore('related.dropdownMenu'), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
        ]}
      />

      <!-- ── Notas ──────────────────────────────────────────────────── -->
      <DocsNotes componentSlug="table"
        items={[
          { title: '', content: $tStore('notes.tip1') },
          { title: '', content: $tStore('notes.tip2') },
          { title: '', content: $tStore('notes.tip3') },
          { title: '', content: $tStore('notes.tip4') },
          { title: '', content: $tStore('notes.tip5') },
        ]}
      />

      <!-- ── Analytics ─────────────────────────────────────────────── -->
      <DocsAnalytics
        cols={{
          event: $tStore('analytics.table.event'),
          trigger: toPlainText($tStore('analytics.table.trigger')),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
          { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
          { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
        ]}
      />

      <!-- ── Testes ─────────────────────────────────────────────────── -->
      <DocsTestes
        functional={{
          title: $tStore('testes.functional.title'),
          cols: {
            action: $tNavStore('common.userAction'),
            result: $tNavStore('common.expectedResult'),
            priority: $tNavStore('common.priority'),
          },
          items: entriesFromDict($tStore, 'testes.functional', ['action', 'result', 'priority']).map(
            (row) => ({
              action: toPlainText(row.action),
              result: toPlainText(row.result),
              priority: localPriority(row.priority, $tNavStore),
            }),
          ),
        }}
        accessibility={{
          title: $tStore('testes.accessibility.title'),
          cols: {
            criterion: $tNavStore('common.criterion'),
            level: 'WCAG',
            how: $tNavStore('common.howToVerify'),
          },
          items: entriesFromDict($tStore, 'testes.accessibility', ['criterion', 'level', 'how']).map(
            (row) => ({
              criterion: toPlainText(row.criterion),
              level: row.level,
              how: toPlainText(row.how),
            }),
          ),
        }}
        visual={{
          title: $tStore('testes.visual.title'),
          cols: {
            story: $tNavStore('common.storyState'),
            priority: $tNavStore('common.priority'),
          },
          items: entriesFromDict($tStore, 'testes.visual', ['story', 'priority']).map((row) => ({
            story: row.story,
            priority: localPriority(row.priority, $tNavStore),
          })),
        }}
      />
</DocsPageLayout>
