<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Combobox,
    ComboboxChip,
    ComboboxChipRemove,
    ComboboxChips,
    ComboboxClear,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxGroupLabel,
    ComboboxInput,
    ComboboxInputWrapper,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxPopup,
    ComboboxPositioner,
    ComboboxSeparator,
    ComboboxTrigger,
    filterItems,
    type ComboboxOption,
  } from '@/components/ui/combobox';
  import { Button } from '@/components/ui/button';
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
  import comboboxTranslations from '@shared/content/combobox/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // O nome do tipo das opções diverge por uma colisão de nomes que só existe
  // aqui: `ComboboxItem` já é a PEÇA que renderiza uma opção, e um componente
  // Svelte ocupa o nome nos dois espaços — valor e tipo. O dado passou a se
  // chamar `ComboboxOption`, e a tabela de props acompanha.
  const { tStore } = useTranslation(comboboxTranslations, {
    '*': { 'props.table.items.type': 'ComboboxOption[]' },
  });

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'combobox',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'combobox',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    const tContent = $tStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tContent('nav.demonstration') },
        { id: 'anatomia',     label: tContent('nav.anatomy')       },
        { id: 'quando-usar',  label: tContent('nav.usage')         },
        { id: 'do-dont',      label: tContent('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tContent('nav.import')       },
        { id: 'variantes',    label: tContent('nav.variants')     },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')       },
        { id: 'propriedades', label: tContent('nav.props')        },
        { id: 'tokens',       label: tContent('nav.tokens')       },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tContent('nav.accessibility') },
        { id: 'relacionados',   label: tContent('nav.related')       },
        { id: 'notas',          label: tContent('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tContent('nav.analytics') },
        { id: 'testes',    label: tContent('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap((group) => group.sections.map((s) => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'combobox', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high', medium: 'common.medium', low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Rótulos localizados ─────────────────────────────────────────────────────

  const labels = $derived.by(() => {
    const t = $tStore;
    return {
      country: t('demonstration.labels.countryLabel'),
      countryPlaceholder: t('demonstration.labels.countryPlaceholder'),
      countries: t('demonstration.labels.countriesLabel'),
      countriesPlaceholder: t('demonstration.labels.countriesPlaceholder'),
      grouped: t('demonstration.labels.groupedLabel'),
      groupedPlaceholder: t('demonstration.labels.groupedPlaceholder'),
      empty: t('demonstration.labels.empty'),
      remove: t('demonstration.labels.remove'),
      removed: t('demonstration.labels.removed'),
      clear: t('demonstration.labels.clear'),
      openList: t('demonstration.labels.openList'),
    };
  });

  const countryItems = $derived.by(() => {
    const t = $tStore;
    return [
      { value: 'brasil',    label: t('demonstration.labels.brazil') },
      { value: 'argentina', label: t('demonstration.labels.argentina') },
      { value: 'chile',     label: t('demonstration.labels.chile') },
      { value: 'colombia',  label: t('demonstration.labels.colombia') },
      { value: 'mexico',    label: t('demonstration.labels.mexico') },
      { value: 'peru',      label: t('demonstration.labels.peru') },
      { value: 'portugal',  label: t('demonstration.labels.portugal') },
      { value: 'espanha',   label: t('demonstration.labels.spain') },
      { value: 'uruguai',   label: t('demonstration.labels.uruguay') },
    ] satisfies ComboboxOption[];
  });

  const groceryItems = $derived.by(() => {
    const t = $tStore;
    const fruits = t('demonstration.labels.groupFruits');
    const vegetables = t('demonstration.labels.groupVegetables');
    return [
      { value: 'maca',      label: t('demonstration.labels.apple'),    group: fruits },
      { value: 'banana',    label: t('demonstration.labels.banana'),   group: fruits },
      { value: 'laranja',   label: t('demonstration.labels.orange'),   group: fruits },
      { value: 'cenoura',   label: t('demonstration.labels.carrot'),   group: vegetables },
      { value: 'batata',    label: t('demonstration.labels.potato'),   group: vegetables },
      { value: 'abobrinha', label: t('demonstration.labels.zucchini'), group: vegetables },
    ] satisfies ComboboxOption[];
  });

  // ─── Estado das amostras ─────────────────────────────────────────────────────
  //
  // Um registro só, com uma chave por amostra: onze campos na página, cada um com
  // valor e texto de busca próprios. Guardar tudo em dois objetos é o que permite
  // uma única marcação parametrizada em vez de onze cópias dela.

  const values = $state<Record<string, string | string[]>>({
    demoSingle: '',
    demoMultiple: ['brasil', 'argentina'],
    demoGrouped: '',
    varSingle: '',
    varMultiple: ['brasil'],
    varGrouped: '',
    dd1Do: '',
    dd1Dont: '',
    dd2Do: '',
    dd2Dont: '',
    compForm: '',
  });

  const queries = $state<Record<string, string>>({
    demoSingle: '', demoMultiple: '', demoGrouped: '',
    varSingle: '', varMultiple: '', varGrouped: '',
    dd1Do: '', dd1Dont: '', dd2Do: '', dd2Dont: '', compForm: '',
  });

  function chipsOf(id: string): string[] {
    const current = values[id];
    return Array.isArray(current) ? current : [];
  }

  function groupsOf(items: ComboboxOption[], query: string) {
    const out: { label: string; items: ComboboxOption[] }[] = [];
    for (const entry of items) {
      const title = entry.group ?? '';
      const last = out.at(-1);
      if (last && last.label === title) last.items.push(entry);
      else out.push({ label: title, items: [entry] });
    }
    return out.filter((group) => filterItems(group.items, query).length > 0);
  }

  function labelOf(items: ComboboxOption[], value: string): string {
    return items.find((entry) => entry.value === value)?.label ?? value;
  }

  /**
   * Quantos itens cada amostra tinha na chamada ANTERIOR.
   *
   * Guardar à parte é o que faz a conta valer: quando o retorno de mudança
   * chega, o valor ligado já foi atualizado, e comparar com ele daria sempre
   * empate — toda remoção contaria como escolha.
   */
  const previousCount: Record<string, number> = Object.fromEntries(
    Object.entries(values).map(([key, entry]) => [
      key,
      Array.isArray(entry) ? entry.length : entry ? 1 : 0,
    ]),
  );

  /**
   * Escolher e desfazer são eventos DIFERENTES, e a diferença está no tamanho:
   * a lista cresceu, alguém escolheu; encolheu, alguém removeu um chip ou limpou
   * o campo. O payload carrega valor e nome do campo, nunca texto traduzido de
   * interface — o mesmo evento em três idiomas tem de contar como um só.
   */
  function report(id: string, items: ComboboxOption[], next: string | string[]): void {
    const before = previousCount[id] ?? 0;
    const after = Array.isArray(next) ? next.length : next ? 1 : 0;
    previousCount[id] = after;
    const value = Array.isArray(next) ? next[next.length - 1] : next;
    if (after < before || !value) {
      track('field_change', {
        component: 'combobox',
        field_name: id,
        value: Array.isArray(next) ? next.join(',') : next,
        location: 'docs_demo',
      });
      return;
    }
    track('option_select', {
      component: 'combobox',
      field_name: id,
      value,
      label: labelOf(items, value),
      location: 'docs_demo',
    });
  }

  // ─── Código exibido ──────────────────────────────────────────────────────────

  const codeImport = `import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxTrigger,
} from "@/components/ui/combobox";`;

  const codeSingle = `<Combobox {items} bind:value name="pais">
  <ComboboxLabel>País</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar país" />
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxPositioner>
    <ComboboxPopup>
      <ComboboxList>
        {#each items as item (item.value)}
          <ComboboxItem value={item.value} label={item.label} />
        {/each}
      </ComboboxList>
      <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
    </ComboboxPopup>
  </ComboboxPositioner>
</Combobox>`;

  const codeMultiple = `<Combobox {items} bind:value multiple>
  <ComboboxLabel>Países</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxChips>
      {#each value as chip (chip)}
        <ComboboxChip value={chip}>
          <ComboboxChipRemove />
        </ComboboxChip>
      {/each}
      <ComboboxInput placeholder="Adicionar país" />
    </ComboboxChips>
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxPositioner>
    <ComboboxPopup>
      <ComboboxList>
        {#each items as item (item.value)}
          <ComboboxItem value={item.value} label={item.label} />
        {/each}
      </ComboboxList>
      <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
    </ComboboxPopup>
  </ComboboxPositioner>
</Combobox>`;

  const codeGrouped = `<ComboboxList>
  {#each groups as group, index (group.label)}
    <ComboboxGroup>
      <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
      {#each group.items as item (item.value)}
        <ComboboxItem value={item.value} label={item.label} />
      {/each}
    </ComboboxGroup>
    {#if index < groups.length - 1}
      <ComboboxSeparator />
    {/if}
  {/each}
</ComboboxList>`;

  const interfaceCode = `// Combobox (raiz — dona do valor, do texto e do aberto/fechado)
interface ComboboxProps {
  items?: ComboboxOption[];      // { value, label, disabled?, group? }
  value?: string | string[];     // $bindable — texto no simples, lista no múltiplo
  inputValue?: string;           // $bindable — o texto de busca
  open?: boolean;                // $bindable
  multiple?: boolean;
  chipsLayout?: "wrap" | "single-line";  // padrão "wrap": chips em linhas
  disabled?: boolean;
  invalid?: boolean;
  loop?: boolean;                // da última opção a seta volta à primeira
  name?: string;
  filter?: (item: ComboboxOption, query: string) => boolean;
  onValueChange?: (value: string | string[]) => void;
  onInputValueChange?: (text: string) => void;
}

// ComboboxItem
interface ComboboxItemProps {
  value: string;                 // OBRIGATÓRIO
  label?: string;                // padrão: o próprio valor
  disabled?: boolean;
}

// ComboboxChip — o botão de remover lê o valor do chip por contexto
interface ComboboxChipProps {
  value: string;                 // OBRIGATÓRIO
  label?: string;                // padrão: o rótulo vindo de \`items\`
}`;
</script>

{#snippet comboboxField(
  id: string,
  items: ComboboxOption[],
  config: {
    label: string;
    placeholder: string;
    multiple?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
    grouped?: boolean;
  },
)}
  <Combobox
    {items}
    bind:value={values[id]}
    bind:inputValue={queries[id]}
    multiple={config.multiple ?? false}
    disabled={config.disabled ?? false}
    invalid={config.invalid ?? false}
    name={config.name}
    removedMessage={(label) => `${label} ${labels.removed}`}
    onValueChange={(next) => report(id, items, next)}
  >
    <ComboboxLabel>{config.label}</ComboboxLabel>
    <ComboboxInputWrapper>
      <!-- O campo de texto é filho da caixa de chips, não irmão dela: o texto
           segue depois do último chip, e limpar e gatilho ficam de fora do que
           quebra ou rola — sempre na primeira linha. Sem chips a caixa não
           existe, e o campo é filho direto do wrapper. -->
      {#if config.multiple}
        <ComboboxChips>
          {#each chipsOf(id) as chip (chip)}
            <ComboboxChip value={chip}>
              <ComboboxChipRemove removeLabel={labels.remove} />
            </ComboboxChip>
          {/each}
          <ComboboxInput placeholder={config.placeholder} />
        </ComboboxChips>
      {:else}
        <ComboboxInput placeholder={config.placeholder} />
      {/if}
      <ComboboxClear aria-label={labels.clear} />
      <ComboboxTrigger aria-label={labels.openList} />
    </ComboboxInputWrapper>
    <ComboboxPositioner>
      <ComboboxPopup>
        <ComboboxList>
          {#if config.grouped}
            {#each groupsOf(items, queries[id]) as group, index (group.label)}
              <ComboboxGroup>
                <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
                {#each group.items as entry (entry.value)}
                  <ComboboxItem value={entry.value} label={entry.label} />
                {/each}
              </ComboboxGroup>
              {#if index < groupsOf(items, queries[id]).length - 1}
                <ComboboxSeparator />
              {/if}
            {/each}
          {:else}
            {#each items as entry (entry.value)}
              <ComboboxItem value={entry.value} label={entry.label} />
            {/each}
          {/if}
        </ComboboxList>
        <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
      </ComboboxPopup>
    </ComboboxPositioner>
  </Combobox>
{/snippet}

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="combobox">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="combobox">
    <div class="nds-grid nds-w-full" data-cols="2" data-spacing="xl">
      <div style="contain: layout">
        {@render comboboxField('demoSingle', countryItems, {
          label: labels.country,
          placeholder: labels.countryPlaceholder,
          name: 'pais',
        })}
      </div>

      <div style="contain: layout">
        {@render comboboxField('demoMultiple', countryItems, {
          label: labels.countries,
          placeholder: labels.countriesPlaceholder,
          multiple: true,
          name: 'paises',
        })}
      </div>

      <div style="contain: layout; grid-column: 1 / -1;">
        {@render comboboxField('demoGrouped', groceryItems, {
          label: labels.grouped,
          placeholder: labels.groupedPlaceholder,
          grouped: true,
        })}
      </div>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
      $tStore('anatomy.item8'),
      $tStore('anatomy.item9'),
      $tStore('anatomy.item10'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
        $tStore('usage.guidelines.item6'),
        $tStore('usage.guidelines.item7'),
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
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
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
        {
          element: $tStore('usage.uxWriting.table.placeholder.name'),
          rules: $tStore('usage.uxWriting.table.placeholder.format'),
          do: $tStore('usage.uxWriting.table.placeholder.good'),
          dont: $tStore('usage.uxWriting.table.placeholder.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.itemLabel.name'),
          rules: $tStore('usage.uxWriting.table.itemLabel.format'),
          do: $tStore('usage.uxWriting.table.itemLabel.good'),
          dont: $tStore('usage.uxWriting.table.itemLabel.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.chipRemove.name'),
          rules: $tStore('usage.uxWriting.table.chipRemove.format'),
          do: $tStore('usage.uxWriting.table.chipRemove.good'),
          dont: $tStore('usage.uxWriting.table.chipRemove.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.emptyMessage.name'),
          rules: $tStore('usage.uxWriting.table.emptyMessage.format'),
          do: $tStore('usage.uxWriting.table.emptyMessage.good'),
          dont: $tStore('usage.uxWriting.table.emptyMessage.bad'),
        },
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
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ───────────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: dd1Do,
        dontPreview: dd1Dont,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: dd2Do,
        dontPreview: dd2Dont,
      },
    ]}
  />

  {#snippet dd1Do()}
    <div style="contain: layout">
      <Combobox
        items={countryItems}
        bind:value={values.dd1Do}
        bind:inputValue={queries.dd1Do}
        multiple
      >
        <ComboboxLabel>{labels.country}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxChips>
            {#each chipsOf('dd1Do') as chip (chip)}
              <ComboboxChip value={chip}>
                <ComboboxChipRemove removeLabel={labels.remove} />
              </ComboboxChip>
            {/each}
            <ComboboxInput placeholder={labels.countryPlaceholder} />
          </ComboboxChips>
          <ComboboxTrigger aria-label={labels.openList} />
        </ComboboxInputWrapper>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList>
              {#each countryItems as entry (entry.value)}
                <ComboboxItem value={entry.value} label={entry.label} />
              {/each}
            </ComboboxList>
            <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
    </div>
  {/snippet}

  {#snippet dd1Dont()}
    <div style="contain: layout">
      <Combobox
        items={countryItems}
        bind:value={values.dd1Dont}
        bind:inputValue={queries.dd1Dont}
        multiple
      >
        <ComboboxLabel>{labels.country}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxChips>
            {#each chipsOf('dd1Dont') as chip (chip)}
              <ComboboxChip value={chip}>
                <!-- Todos com o mesmo nome: numa lista de controles, os cinco
                     botões viram cinco linhas iguais e indistinguíveis. -->
                <ComboboxChipRemove aria-label={labels.remove} />
              </ComboboxChip>
            {/each}
            <ComboboxInput placeholder={labels.countryPlaceholder} />
          </ComboboxChips>
          <ComboboxTrigger aria-label={labels.openList} />
        </ComboboxInputWrapper>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList>
              {#each countryItems as entry (entry.value)}
                <ComboboxItem value={entry.value} label={entry.label} />
              {/each}
            </ComboboxList>
            <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
    </div>
  {/snippet}

  {#snippet dd2Do()}
    <div style="contain: layout">
      {@render comboboxField('dd2Do', countryItems, {
        label: labels.countries,
        placeholder: labels.countriesPlaceholder,
        multiple: true,
      })}
    </div>
  {/snippet}

  {#snippet dd2Dont()}
    <div style="contain: layout">
      <Combobox
        items={countryItems}
        bind:value={values.dd2Dont}
        bind:inputValue={queries.dd2Dont}
        multiple
      >
        <ComboboxLabel>{labels.countries}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxChips>
            {#each chipsOf('dd2Dont') as chip (chip)}
              <!-- Chip sem botão de remover: desfazer passa a exigir o mouse na
                   lista, e o teclado perde o caminho de volta. -->
              <ComboboxChip value={chip} />
            {/each}
            <ComboboxInput placeholder={labels.countriesPlaceholder} />
          </ComboboxChips>
          <ComboboxTrigger aria-label={labels.openList} />
        </ComboboxInputWrapper>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList>
              {#each countryItems as entry (entry.value)}
                <ComboboxItem value={entry.value} label={entry.label} />
              {/each}
            </ComboboxList>
            <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="combobox"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="combobox"
    items={[
      {
        name: $tStore('variants.items.single'),
        description: stripHtml($tStore('variants.styles.single')),
        code: codeSingle,
        trackId: 'single',
        preview: variantSingle,
      },
      {
        name: $tStore('variants.items.multiple'),
        description: stripHtml($tStore('variants.styles.multiple')),
        code: codeMultiple,
        trackId: 'multiple',
        preview: variantMultiple,
      },
      {
        name: $tStore('variants.items.grouped'),
        description: stripHtml($tStore('variants.styles.grouped')),
        code: codeGrouped,
        trackId: 'grouped',
        preview: variantGrouped,
      },
    ]}
  />

  {#snippet variantSingle()}
    <div style="contain: layout">
      {@render comboboxField('varSingle', countryItems, {
        label: labels.country,
        placeholder: labels.countryPlaceholder,
      })}
    </div>
  {/snippet}

  {#snippet variantMultiple()}
    <div style="contain: layout">
      {@render comboboxField('varMultiple', countryItems, {
        label: labels.countries,
        placeholder: labels.countriesPlaceholder,
        multiple: true,
      })}
    </div>
  {/snippet}

  {#snippet variantGrouped()}
    <div style="contain: layout">
      {@render comboboxField('varGrouped', groceryItems, {
        label: labels.grouped,
        placeholder: labels.groupedPlaceholder,
        grouped: true,
      })}
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="combobox"
    items={[
      {
        name: $tStore('variants.compositions.inForm.name'),
        description: $tStore('variants.compositions.inForm.description'),
        useWhen: $tStore('variants.compositions.inForm.use'),
        code: `<form
  class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg" data-spacing="md"
  onsubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log("País:", data.get("pais"));
  }}
>
  <Combobox {items} bind:value name="pais">
    <ComboboxLabel>País</ComboboxLabel>
    <ComboboxInputWrapper>
      <ComboboxInput placeholder="Buscar país" />
      <ComboboxTrigger aria-label="Abrir lista" />
    </ComboboxInputWrapper>
    <ComboboxPositioner>
      <ComboboxPopup>
        <ComboboxList>
          {#each items as item (item.value)}
            <ComboboxItem value={item.value} label={item.label} />
          {/each}
        </ComboboxList>
        <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
      </ComboboxPopup>
    </ComboboxPositioner>
  </Combobox>
  <Button type="submit">Continuar</Button>
</form>`,
        preview: compFormSnippet,
      },
    ]}
  />

  {#snippet compFormSnippet()}
    <form
      class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg" data-spacing="md"
      style="contain: layout"
      onsubmit={(event) => event.preventDefault()}
    >
      {@render comboboxField('compForm', countryItems, {
        label: labels.country,
        placeholder: labels.countryPlaceholder,
        name: 'pais',
      })}
      <div style="align-self: flex-end;">
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.default.label'),   trigger: toPlainText($tStore('states.default.trigger')),   behavior: toPlainText($tStore('states.default.behavior')) },
      { label: $tStore('states.open.label'),      trigger: toPlainText($tStore('states.open.trigger')),      behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.filtering.label'), trigger: toPlainText($tStore('states.filtering.trigger')), behavior: toPlainText($tStore('states.filtering.behavior')) },
      { label: $tStore('states.selected.label'),  trigger: toPlainText($tStore('states.selected.trigger')),  behavior: toPlainText($tStore('states.selected.behavior')) },
      { label: $tStore('states.focus.label'),     trigger: toPlainText($tStore('states.focus.trigger')),     behavior: toPlainText($tStore('states.focus.behavior')) },
      { label: $tStore('states.empty.label'),     trigger: toPlainText($tStore('states.empty.trigger')),     behavior: toPlainText($tStore('states.empty.behavior')) },
      { label: $tStore('states.disabled.label'),  trigger: toPlainText($tStore('states.disabled.trigger')),  behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.invalid.label'),   trigger: toPlainText($tStore('states.invalid.trigger')),   behavior: toPlainText($tStore('states.invalid.behavior')) },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'items',              type: $tStore('props.table.items.type'),              defaultValue: $tStore('props.table.items.default'),              required: $tStore('props.table.items.required'),              description: toPlainText($tStore('props.table.items.description')) },
          { name: 'value',              type: $tStore('props.table.value.type'),              defaultValue: $tStore('props.table.value.default'),              required: $tStore('props.table.value.required'),              description: toPlainText($tStore('props.table.value.description')) },
          { name: 'defaultValue',       type: $tStore('props.table.defaultValue.type'),       defaultValue: $tStore('props.table.defaultValue.default'),       required: $tStore('props.table.defaultValue.required'),       description: toPlainText($tStore('props.table.defaultValue.description')) },
          { name: 'onValueChange',      type: $tStore('props.table.onValueChange.type'),      defaultValue: $tStore('props.table.onValueChange.default'),      required: $tStore('props.table.onValueChange.required'),      description: toPlainText($tStore('props.table.onValueChange.description')) },
          { name: 'inputValue',         type: $tStore('props.table.inputValue.type'),         defaultValue: $tStore('props.table.inputValue.default'),         required: $tStore('props.table.inputValue.required'),         description: toPlainText($tStore('props.table.inputValue.description')) },
          { name: 'onInputValueChange', type: $tStore('props.table.onInputValueChange.type'), defaultValue: $tStore('props.table.onInputValueChange.default'), required: $tStore('props.table.onInputValueChange.required'), description: toPlainText($tStore('props.table.onInputValueChange.description')) },
          { name: 'multiple',           type: $tStore('props.table.multiple.type'),           defaultValue: $tStore('props.table.multiple.default'),           required: $tStore('props.table.multiple.required'),           description: toPlainText($tStore('props.table.multiple.description')) },
          { name: 'chipsLayout',        type: $tStore('props.table.chipsLayout.type'),        defaultValue: $tStore('props.table.chipsLayout.default'),        required: $tStore('props.table.chipsLayout.required'),        description: toPlainText($tStore('props.table.chipsLayout.description')) },
          { name: 'filter',             type: $tStore('props.table.filter.type'),             defaultValue: $tStore('props.table.filter.default'),             required: $tStore('props.table.filter.required'),             description: toPlainText($tStore('props.table.filter.description')) },
          { name: 'placeholder',        type: $tStore('props.table.placeholder.type'),        defaultValue: $tStore('props.table.placeholder.default'),        required: $tStore('props.table.placeholder.required'),        description: toPlainText($tStore('props.table.placeholder.description')) },
          { name: 'disabled',           type: $tStore('props.table.disabled.type'),           defaultValue: $tStore('props.table.disabled.default'),           required: $tStore('props.table.disabled.required'),           description: toPlainText($tStore('props.table.disabled.description')) },
          { name: 'name',               type: $tStore('props.table.name.type'),               defaultValue: $tStore('props.table.name.default'),               required: $tStore('props.table.name.required'),               description: toPlainText($tStore('props.table.name.description')) },
        ],
      },
    ]}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
    interfaceCode={interfaceCode}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--input',                value: $tStore('tokens.table.input.class'),               description: $tStore('tokens.table.input.part') },
      { token: '--input-background',     value: $tStore('tokens.table.inputBackground.class'),     description: $tStore('tokens.table.inputBackground.part') },
      { token: '--foreground',           value: $tStore('tokens.table.foreground.class'),          description: $tStore('tokens.table.foreground.part') },
      { token: '--muted-foreground',     value: $tStore('tokens.table.mutedForeground.class'),     description: $tStore('tokens.table.mutedForeground.part') },
      { token: '--muted',                value: $tStore('tokens.table.muted.class'),               description: $tStore('tokens.table.muted.part') },
      { token: '--secondary',            value: $tStore('tokens.table.secondary.class'),           description: $tStore('tokens.table.secondary.part') },
      { token: '--secondary-foreground', value: $tStore('tokens.table.secondaryForeground.class'), description: $tStore('tokens.table.secondaryForeground.part') },
      { token: '--popover',              value: $tStore('tokens.table.popover.class'),             description: $tStore('tokens.table.popover.part') },
      { token: '--popover-foreground',   value: $tStore('tokens.table.popoverForeground.class'),   description: $tStore('tokens.table.popoverForeground.part') },
      { token: '--accent',               value: $tStore('tokens.table.accent.class'),              description: $tStore('tokens.table.accent.part') },
      { token: '--accent-foreground',    value: $tStore('tokens.table.accentForeground.class'),    description: $tStore('tokens.table.accentForeground.part') },
      { token: '--primary',              value: $tStore('tokens.table.primary.class'),             description: $tStore('tokens.table.primary.part') },
      { token: '--border',               value: $tStore('tokens.table.border.class'),              description: $tStore('tokens.table.border.part') },
      { token: '--ring',                 value: $tStore('tokens.table.ring.class'),                description: $tStore('tokens.table.ring.part') },
      { token: '--destructive',          value: $tStore('tokens.table.destructive.class'),         description: $tStore('tokens.table.destructive.part') },
      { token: '--radius',               value: $tStore('tokens.table.radius.class'),              description: $tStore('tokens.table.radius.part') },
      { token: '--radius-full',          value: $tStore('tokens.table.radiusFull.class'),          description: $tStore('tokens.table.radiusFull.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
      $tStore('accessibility.items.item7'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'A-Z',        description: toPlainText($tStore('accessibility.keyboard.typing')) },
      { key: 'Arrow Down', description: toPlainText($tStore('accessibility.keyboard.arrowDown')) },
      { key: 'Arrow Up',   description: toPlainText($tStore('accessibility.keyboard.arrowUp')) },
      { key: 'Enter',      description: toPlainText($tStore('accessibility.keyboard.enter')) },
      { key: 'Escape',     description: toPlainText($tStore('accessibility.keyboard.escape')) },
      { key: 'Tab',        description: toPlainText($tStore('accessibility.keyboard.tab')) },
      { key: 'Backspace',  description: toPlainText($tStore('accessibility.keyboard.backspace')) },
      { key: 'Home',       description: toPlainText($tStore('accessibility.keyboard.home')) },
      { key: 'End',        description: toPlainText($tStore('accessibility.keyboard.end')) },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.select.name'),  description: $tStore('related.items.select.description'),  path: '?path=/docs/ui-select--docs' },
      { name: $tStore('related.items.command.name'), description: $tStore('related.items.command.description'), path: '?path=/docs/ui-command--docs' },
      { name: $tStore('related.items.input.name'),   description: $tStore('related.items.input.description'),   path: '?path=/docs/ui-input--docs' },
      { name: $tStore('related.items.form.name'),    description: $tStore('related.items.form.description'),    path: '?path=/docs/ui-form--docs' },
    ]}
  />

  <!-- ── Notas ─────────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="combobox"
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
      { title: '', content: $tStore('notes.item5') },
      { title: '', content: $tStore('notes.item6') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      {
        event: 'option_select',
        trigger: toPlainText($tStore('analytics.table.option_select.trigger')),
        payload: $tStore('analytics.table.option_select.payload'),
      },
      {
        event: 'field_change',
        trigger: toPlainText($tStore('analytics.table.field_change.trigger')),
        payload: $tStore('analytics.table.field_change.payload'),
      },
    ]}
  />

  <!-- ── Testes ────────────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      description: $tStore('testes.functional.description'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: toPlainText($tStore('testes.functional.item1.action')), result: toPlainText($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item2.action')), result: toPlainText($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item3.action')), result: toPlainText($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item4.action')), result: toPlainText($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item5.action')), result: toPlainText($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item6.action')), result: toPlainText($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item7.action')), result: toPlainText($tStore('testes.functional.item7.result')), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',    how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item3'), level: '4.1.2', how: 'DevTools attribute' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item6'), level: '1.4.3', how: 'Contrast checker' },
        { criterion: $tStore('testes.accessibility.item7'), level: '2.4.7', how: 'Keyboard test' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item6.story'), priority: localPriority($tStore('testes.visual.item6.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item7.story'), priority: localPriority($tStore('testes.visual.item7.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
