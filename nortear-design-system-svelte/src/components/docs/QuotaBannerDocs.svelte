<script lang="ts">
  import { untrack } from 'svelte';
  import { QuotaBanner } from '@/components/ui/quota-banner';
  import {
    quotaBannerActionLabelFor,
    quotaBannerLabelsFor,
    quotaOf,
    renewalOfFor,
    type QuotaBannerCase,
  } from '@/components/ui/quota-banner/quota-banner.fixtures';
  import { Button } from '@/components/ui/button';
  import { Separator } from '@/components/ui/separator';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import quotaTranslations from '@shared/content/quota-banner/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  /**
   * Uma linha sobrescrita, e só uma: o TIPO do espaço dos controles.
   *
   * O nome é o mesmo do conteúdo compartilhado, e a descrição também vale
   * palavra por palavra — a peça desenha o lugar de quem responde, e isso não
   * muda com quem renderiza. O que muda é a FORMA de passar o controle: lá é uma
   * lista de nós do documento, aqui é uma lista de snippets, que é o vocabulário
   * desta stack para o mesmo contrato. Mesmo precedente do cartão de
   * autorização.
   */
  const { tStore } = useTranslation(quotaTranslations, {
    '*': { 'props.table.actions.type': 'Snippet[]' },
  });

  const labels = $derived(quotaBannerLabelsFor($locale));
  const actionLabel = $derived(quotaBannerActionLabelFor($locale));

  /**
   * A cota e o horizonte daquele exemplo, JÁ ESCRITOS no idioma da página.
   *
   * Quem escreve a duração é a docs page, e não a peça: aqui a página está no
   * papel de quem consome, que é quem conhece o idioma. Lê `$locale` a cada
   * chamada, porque a barra de idioma troca o idioma com a página montada.
   */
  const renewalFor = (name: QuotaBannerCase) => renewalOfFor($locale, name);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (quotaTranslations as unknown as Record<
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
      componentSlug: 'quota-banner',
    });
    track('docs_page_view', {
      component_name: 'quota-banner',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. O que muda entre
  // as fotos é o que a conta devolve — o nível, o resto e a presença do
  // horizonte —, e nada disso é uma escolha de quem monta.

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
        { id: 'importacao',   label: tNav('nav.import') },
        { id: 'estados',      label: tNav('nav.states') },
        { id: 'propriedades', label: tNav('nav.props')  },
        { id: 'tokens',       label: tNav('nav.tokens') },
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
    track('docs_section_viewed', {
      section_id: id,
      component_name: 'quota-banner',
      locale: $locale,
    });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const interfaceCode = `interface QuotaBannerProps {
  quota: QuotaAllowance;   // o uso e o teto
  renewsIn?: string;       // quando renova, JÁ ESCRITO; ausente é "não renova"
  actions?: Snippet[];     // os controles, prontos de quem consome
  labels: QuotaBannerLabels;
}

// O teto é OBRIGATÓRIO aqui, ao contrário das medições irmãs: a cota É o teto,
// e "quanto ainda resta" não tem resposta sem ele. Quem não tem teto não monta
// a faixa.
export interface QuotaAllowance {
  used: number;            // quanto já foi usado
  limit: number;           // o teto da cota
}

export interface QuotaBannerLabels {
  title: string;                      // de qual cota se trata; só para quem ouve
  unit: string;                       // o que está sendo contado
  left: string;                       // a palavra que acompanha o resto
  exhausted: string;                  // o que dizer quando não sobra nada
  renews: string;                     // a palavra que antecede o horizonte
  of: string;                         // liga o usado ao teto na razão
  level: Record<BudgetLevel, string>; // a palavra de cada nível
}

// A conta vem de \`@shared/primitives/token-budget\`, e é a MESMA que as outras
// medições leem — é isso que faz a palavra do nível querer dizer o mesmo em
// todas elas:
//   remainingUnits(uso, teto)    // o resto, nunca negativo
//   spentFraction(uso, teto)     // de 0 a 1, ou \`null\` quando o teto não é teto
//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'
//   fractionPercent(fracao)      // inteiro travado nas duas pontas`;
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

  <!--
    O controle da demonstração, montado por QUEM CONSOME.

    Ele nasce aqui e não dentro da peça porque a §7 da guideline 17 deixa o
    desenho do controle, a ênfase dele e o significado da escolha do lado de fora
    do design system. A faixa desenha o LUGAR de quem responde; o que o botão faz
    é de quem o passou — e é por isso que ele não tem manipulador nenhum aqui.
  -->
  {#snippet demoAction()}
    <Button variant="outline" size="sm">{actionLabel}</Button>
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <!--
    A legenda diz QUAL exemplo está desenhado — sem ela, quatro caixas empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre
    elas.

    O controle entra só onde ele muda alguma coisa — a cota esgotada —, e é de
    propósito: repeti-lo nas quatro faria a demonstração parecer que a faixa
    nasce com um botão, quando o botão é de quem a monta.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="quota-banner"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.normal')}
        </p>
        <QuotaBanner quota={quotaOf('normal')} renewsIn={renewalFor('normal')} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.threshold')}
        </p>
        <QuotaBanner quota={quotaOf('threshold')} renewsIn={renewalFor('threshold')} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.exhausted')}
        </p>
        <QuotaBanner
          quota={quotaOf('exhausted')}
          renewsIn={renewalFor('exhausted')}
          actions={[demoAction]}
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.noRenewal')}
        </p>
        <QuotaBanner quota={quotaOf('noRenewal')} renewsIn={renewalFor('noRenewal')} {labels} />
      </div>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5, 6].map(i => $tStore(`anatomy.item${i}`))}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
    language="html"
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map(i => $tStore(`usage.guidelines.item${i}`)),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map(i => ({
        s: $tStore(`usage.scenarios.item${i}.s`),
        u: $tStore(`usage.scenarios.item${i}.u`),
        a: toPlainText($tStore(`usage.scenarios.item${i}.a`)),
      })),
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: ['title', 'unit', 'left', 'exhausted'].map(k => ({
        element: $tStore(`usage.uxWriting.table.${k}.name`),
        rules: $tStore(`usage.uxWriting.table.${k}.format`),
        do: $tStore(`usage.uxWriting.table.${k}.good`),
        dont: $tStore(`usage.uxWriting.table.${k}.bad`),
      })),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.do.item${i}`)),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.dont.item${i}`)),
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <!--
    O MESMO uso nos dois lados de cada par: o que muda é se o horizonte chega
    junto, e depois se ele chega escrito por quem conhece o idioma.
  -->
  {#snippet doPair1()}
    <QuotaBanner quota={quotaOf('warning')} renewsIn={renewalFor('warning')} {labels} />
  {/snippet}
  <!--
    O contraexemplo: a cota renova, mas o horizonte não é passado. A faixa só
    pode dizer que está no fim, e esperar vira aposta — sem que nada pareça
    errado na tela.
  -->
  {#snippet dontPair1()}
    <QuotaBanner quota={quotaOf('warning')} {labels} />
  {/snippet}
  {#snippet doPair2()}
    <QuotaBanner quota={quotaOf('warning')} renewsIn={renewalFor('warning')} {labels} />
  {/snippet}
  <!--
    O contraexemplo: o horizonte escrito à mão. Ponto decimal, unidade por
    extenso e nenhuma das duas trocando com o idioma de quem lê — que é
    exatamente o que a peça não tem como consertar.
  -->
  {#snippet dontPair2()}
    <QuotaBanner quota={quotaOf('warning')} renewsIn="3.2 hours" {labels} />
  {/snippet}

  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={$tStore('import.basicCode')}
    secondaryDescription={$tStore('import.withLabels')}
    secondaryCode={$tStore('import.withLabelsCode')}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <!--
    Nenhum destes é um estado que a peça guarda: são as cinco respostas que a
    mesma faixa dá conforme o que a conta devolve. Os três primeiros saem do
    limiar; os dois últimos são o que o nível não modela — a cota que acabou e a
    que não renova.
  -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={['normal', 'warning', 'critical', 'exhausted', 'noRenewal'].map(k => ({
      label: $tStore(`states.${k}.label`),
      trigger: toPlainText($tStore(`states.${k}.trigger`)),
      behavior: toPlainText($tStore(`states.${k}.behavior`)),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: 'QuotaBanner',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['quota', 'renewsIn', 'actions', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'QuotaAllowance',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['quotaUsed', 'quotaLimit'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'QuotaBannerLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'labelsTitle', 'labelsUnit', 'labelsLeft', 'labelsExhausted',
          'labelsRenews', 'labelsOf', 'labelsLevel',
        ].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.value'),
      description: $tStore('tokens.table.description'),
    }}
    items={[
      'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
      'primary', 'warning', 'destructive', 'muted',
      'spacing2', 'spacing3', 'spacing6', 'radius', 'radiusFull',
    ].map(k => ({
      token: $tStore(`tokens.table.${k}.token`),
      value: $tStore(`tokens.table.${k}.value`),
      description: toPlainText($tStore(`tokens.table.${k}.description`)),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
    language="css"
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <!--
    Duas linhas de teclado, e as duas são honestas: a faixa em si não tem
    controle, mas os controles que chegam de fora entram na ordem de foco — e é
    aí que o teclado tem o que fazer.
  -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5, 6, 7].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab', description: $tStore('accessibility.keyboard.tab') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
    ]}
    screenReaderTitle={$tStore('accessibility.screenReader.title')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.contextDisplay.name'), description: toPlainText($tStore('related.items.contextDisplay.description')), path: '?path=/docs/primitives-conversational-contextdisplay--docs' },
      { name: $tStore('related.items.costMeter.name'),      description: toPlainText($tStore('related.items.costMeter.description')),      path: '?path=/docs/primitives-conversational-costmeter--docs'      },
      { name: $tStore('related.items.alert.name'),          description: toPlainText($tStore('related.items.alert.description')),          path: '?path=/docs/primitives-feedback-alert--docs'                },
      { name: $tStore('related.items.progress.name'),       description: toPlainText($tStore('related.items.progress.description')),       path: '?path=/docs/primitives-feedback-progress--docs'             },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="quota-banner"
    items={[1, 2, 3, 4, 5, 6, 7].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
  />

  <!-- ── Analytics ──────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={['pageView', 'sectionViewed', 'demoClick'].map(k => ({
      event: $tStore(`analytics.table.${k}`),
      trigger: toPlainText($tStore(`analytics.table.${k}Trigger`)),
      payload: $tStore(`analytics.table.${k}Payload`),
    }))}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
        action: toPlainText($tStore(`testes.functional.item${i}.action`)),
        result: toPlainText($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
        criterion: toPlainText($tStore(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
