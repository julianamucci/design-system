<script lang="ts">
  import { untrack } from 'svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Search from '@lucide/svelte/icons/search';
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
  } from '@/components/ui/input-group';
  // O snippet de cada variante e de cada composição sai da MESMA transform que
  // alimenta o painel Code das stories — duas cópias do mesmo exemplo divergem
  // sem ninguém ver, e cada metade fica certa sozinha.
  import { inputGroupSnippet } from '@/components/ui/input-group/input-group.source';
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
  import inputGroupTranslations from '@shared/content/input-group/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const SLUG = 'input-group';

  /** Onde o botão de revelar a senha vive. Valor ESTÁVEL: nunca texto traduzido. */
  type DemoLocation = 'docs_demo' | 'docs_composition';

  // ─── i18n ────────────────────────────────────────────────────────────────────

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(inputGroupTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (inputGroupTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: SLUG,
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: SLUG,
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  // Com Variantes E Composições: o conteúdo compartilhado deste componente traz
  // `variants.items` (as quatro posições do addon) e `variants.compositions` (as
  // quatro montagens canônicas), e as duas seções são obrigatórias por isso.
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: SLUG, locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Rótulos da página ───────────────────────────────────────────────────────

  const labels = $derived({
    searchGroup: $tStore('demonstration.labels.searchGroup'),
    searchField: $tStore('demonstration.labels.searchField'),
    clear:       $tStore('demonstration.labels.clear'),
    password:    $tStore('demonstration.labels.password'),
    reveal:      $tStore('demonstration.labels.reveal'),
    hide:        $tStore('demonstration.labels.hide'),
    siteGroup:   $tStore('demonstration.labels.siteGroup'),
    siteField:   $tStore('demonstration.labels.siteField'),
    prefix:      $tStore('demonstration.labels.prefix'),
    paste:       $tStore('demonstration.labels.paste'),
    note:        $tStore('demonstration.labels.note'),
    send:        $tStore('demonstration.labels.send'),
    invalidMsg:  $tStore('demonstration.labels.invalidMsg'),
    shortcut:    $tStore('demonstration.labels.shortcut'),
    suffix: '.com',
  });

  // ─── Ids da marcação ─────────────────────────────────────────────────────────
  //
  // Constantes nomeadas, e não literais soltos: rótulo e campo se ligam por eles,
  // e um literal divergente quebra a ligação sem erro nenhum na tela.

  const DEMO_PASSWORD_ID = 'input-group-docs-demo-password';
  const COMPOSITION_PASSWORD_ID = 'input-group-docs-composition-password';
  const COMPOSITION_SITE_ID = 'input-group-docs-composition-site';
  const DO_DONT_SITE_ID = 'input-group-docs-do-dont-site';
  const DO_DONT_INVALID_ID = 'input-group-docs-do-dont-invalid';
  const DO_DONT_INVALID_ERROR_ID = `${DO_DONT_INVALID_ID}-error`;
  /**
   * O lado "não faça" do par 2 precisa do próprio id.
   *
   * Os dois lados aparecem na MESMA tela: com um id só, os dois rótulos
   * apontariam para o primeiro campo e o segundo ficaria sem nome outra vez —
   * agora sem o axe reclamar.
   */
  const DO_DONT_INVALID_NO_TEXT_ID = `${DO_DONT_INVALID_ID}-sem-texto`;

  // ─── Demonstração ────────────────────────────────────────────────────────────
  //
  // A demonstração é o campo de senha: é a composição que prova a decisão que
  // mais custa quando se erra — o que age dentro da moldura é um BOTÃO, e o que
  // ele fez é contado pela PALAVRA, não pelo desenho do ícone.
  //
  // Os dois campos de senha da página têm estado PRÓPRIO: um estado só faria os
  // dois alternarem juntos, e quem lê acharia que clicou no errado.

  let demoPasswordVisible = $state(false);
  let compositionPasswordVisible = $state(false);

  /**
   * O payload carrega só valor estável (slug, variante, lugar); texto traduzido
   * ali partiria um evento em três no GA4.
   */
  function trackPasswordToggle(visible: boolean, location: DemoLocation): void {
    track('button_click', {
      component: SLUG,
      variant: visible ? 'hide' : 'reveal',
      location,
    });
  }

  function toggleDemoPassword(): void {
    trackPasswordToggle(demoPasswordVisible, 'docs_demo');
    demoPasswordVisible = !demoPasswordVisible;
  }

  function toggleCompositionPassword(): void {
    trackPasswordToggle(compositionPasswordVisible, 'docs_composition');
    compositionPasswordVisible = !compositionPasswordVisible;
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";`;

  const interfaceCode = `// InputGroup (a moldura)
interface InputGroupProps {
  class?: string;
}
// o nome acessível entra como atributo: aria-label="…" — OPCIONAL,
// ver a nota sobre nomear o grupo

// InputGroupAddon (o compartimento do acompanhamento)
interface InputGroupAddonProps {
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  class?: string;
}

// InputGroupText — só o conteúdo dos children e os atributos nativos
// de <span>.

// InputGroupButton (compõe Button)
interface InputGroupButtonProps {
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm';   // repassada ao Button
  variant?: ButtonVariant;                      // padrão 'ghost'
  type?: 'button' | 'submit' | 'reset';         // padrão 'button'
  class?: string;
}

// InputGroupInput / InputGroupTextarea — repassam todo atributo nativo de
// <input> e de <textarea>. O estado inválido é do CAMPO, e a moldura reage
// a ele por :has().`;

  // ─── Variantes ───────────────────────────────────────────────────────────────
  //
  // As quatro posições do addon. O `trackId` é a CHAVE do item no conteúdo
  // compartilhado, literal: o `name` chega traduzido, e sem ele o mesmo botão
  // sairia com um valor por idioma no GA4.

  const alignmentCode = $derived({
    inlineStart: inputGroupSnippet({
      placeholder: labels.siteField,
      addons: [{ align: 'inline-start', label: labels.prefix }],
    }),
    inlineEnd: inputGroupSnippet({
      placeholder: labels.siteField,
      addons: [{ align: 'inline-end', label: labels.prefix }],
    }),
    blockStart: inputGroupSnippet({
      placeholder: labels.note,
      multiline: true,
      rows: 2,
      addons: [{ align: 'block-start', buttonLabel: labels.send }],
    }),
    blockEnd: inputGroupSnippet({
      placeholder: labels.note,
      multiline: true,
      rows: 2,
      addons: [{ align: 'block-end', buttonLabel: labels.send }],
    }),
  });

  // ─── Composições ─────────────────────────────────────────────────────────────

  const compositionCode = $derived({
    search: inputGroupSnippet({
      'aria-label': labels.searchGroup,
      placeholder: labels.searchField,
      addons: [
        { align: 'inline-start', icon: 'Search' },
        { align: 'inline-end', label: labels.shortcut },
      ],
    }),
    password: inputGroupSnippet({
      'aria-label': labels.password,
      addons: [
        { align: 'inline-end', buttonAccessibleName: labels.reveal, buttonIcon: 'Eye' },
      ],
    }),
    affix: inputGroupSnippet({
      placeholder: labels.siteField,
      visibleLabel: labels.siteGroup,
      addons: [
        { align: 'inline-start', label: labels.prefix },
        { align: 'inline-end', label: labels.suffix },
      ],
    }),
    textareaToolbar: inputGroupSnippet({
      'aria-label': labels.note,
      placeholder: labels.note,
      multiline: true,
      rows: 3,
      addons: [{ align: 'block-end', buttonLabel: labels.send }],
    }),
  });

  // ─── Propriedades ────────────────────────────────────────────────────────────

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });

  /**
   * Uma linha da tabela de props.
   *
   * O NOME é desta stack (`class`, e não `className`); a descrição vem do
   * conteúdo compartilhado, que a escreve sem citar API nenhuma.
   */
  function propRow(name: string, key: string, t: (k: string) => string) {
    return {
      name,
      type: t(`props.table.${key}.type`),
      defaultValue: t(`props.table.${key}.default`),
      required: t(`props.table.${key}.required`),
      description: toPlainText(t(`props.table.${key}.description`)),
    };
  }

  const groupPropItems  = $derived([propRow('aria-label', 'ariaLabel', $tStore), propRow('class', 'class', $tStore)]);
  const addonPropItems  = $derived([propRow('align', 'align', $tStore), propRow('class', 'class', $tStore)]);
  const textPropItems   = $derived([propRow('children', 'text', $tStore), propRow('class', 'class', $tStore)]);
  const buttonPropItems = $derived([
    propRow('size', 'size', $tStore),
    propRow('variant', 'variant', $tStore),
    propRow('class', 'class', $tStore),
  ]);

  // ─── Tokens ──────────────────────────────────────────────────────────────────
  //
  // Chave do conteúdo → token, conferidos um a um contra a folha
  // `docs/shared/styles/nds/input-group.css`.

  const TOKEN_ROWS: Array<{ key: string; token: string }> = [
    { key: 'border',          token: '--input'               },
    { key: 'radius',          token: '--radius'              },
    { key: 'transition',      token: '--duration-fast'       },
    { key: 'ring',            token: '--ring'                },
    { key: 'destructive',     token: '--destructive'         },
    { key: 'disabledBg',      token: '--muted'               },
    { key: 'controlRadius',   token: '--radius-none'         },
    { key: 'textareaPadding', token: '--spacing-2'           },
    { key: 'addonPadding',    token: '--spacing-1-5'         },
    { key: 'addonGap',        token: '--spacing-2'           },
    { key: 'addonSize',       token: '--text-control'        },
    { key: 'addonWeight',     token: '--font-weight-medium'  },
    { key: 'addonColor',      token: '--muted-foreground'    },
    { key: 'addonInline',     token: '--spacing-2'           },
    { key: 'addonBlock',      token: '--spacing-2-5'         },
    { key: 'iconSize',        token: '--spacing-4'           },
    { key: 'buttonRadius',    token: '--radius-md'           },
    { key: 'buttonGap',       token: '--spacing-1'           },
    { key: 'buttonPadding',   token: '--spacing-1-5'         },
  ];

  const tokenItems = $derived(
    TOKEN_ROWS.map(({ key, token }) => ({
      token,
      value: $tStore(`tokens.table.${key}.class`),
      description: toPlainText($tStore(`tokens.table.${key}.part`)),
    })),
  );

  // ─── Notas ───────────────────────────────────────────────────────────────────

  const noteItems = $derived([
    ...[1, 2, 3, 4, 5].map(i => ({ title: '', content: $tStore(`notes.item${i}`) })),
    {
      title: '',
      // Não há forma declarada para somente-leitura, e a ausência é registrada:
      // inventar aqui uma classe que a folha não tem seria cravar o valor.
      content:
        '<strong>Não há forma declarada para somente-leitura.</strong> A folha compartilhada não desenha esse estado. Use o atributo <code>readonly</code> nativo no campo: ele é anunciado pelo leitor de tela e não gasta cor nenhuma.',
    },
  ]);
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug={SLUG}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug={SLUG}>
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <label class="nds-label" for={DEMO_PASSWORD_ID}>{labels.password}</label>
      <InputGroup aria-label={labels.password}>
        <InputGroupInput
          id={DEMO_PASSWORD_ID}
          type={demoPasswordVisible ? 'text' : 'password'}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={demoPasswordVisible ? labels.hide : labels.reveal}
            onclick={toggleDemoPassword}
          >
            {#if demoPasswordVisible}
              <EyeOff aria-hidden="true" />
            {:else}
              <Eye aria-hidden="true" />
            {/if}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5, 6].map(i => $tStore(`anatomy.item${i}`))}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map(i => stripHtml($tStore(`usage.guidelines.item${i}`))),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4].map(i => ({
        s: toPlainText($tStore(`usage.scenarios.item${i}.s`)),
        u: toPlainText($tStore(`usage.scenarios.item${i}.u`)),
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
      items: ['prefix', 'suffix', 'addonButton', 'groupName'].map(key => ({
        element: $tStore(`usage.uxWriting.table.${key}.name`),
        rules:   $tStore(`usage.uxWriting.table.${key}.format`),
        do:      toPlainText($tStore(`usage.uxWriting.table.${key}.good`)),
        dont:    toPlainText($tStore(`usage.uxWriting.table.${key}.bad`)),
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
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair3.do')),
        dontCaption: toPlainText($tStore('doDont.pair3.dont')),
        doPreview: doPair3,
        dontPreview: dontPair3,
      },
    ]}
  />

  <!-- Par 1 — o acompanhamento que age é um botão de verdade -->
  {#snippet doPair1()}
    <InputGroup aria-label={labels.searchGroup}>
      <InputGroupInput placeholder={labels.searchField} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label={labels.clear}>
          <EyeOff aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}
  {#snippet dontPair1()}
    <!-- O painel "não faça" mostra o FORMATO do defeito sem plantá-lo: o
         acompanhamento é texto inerte, e a legenda é quem conta que a forma
         errada é pendurar um clique num bloco desses. Plantar um `onclick` num
         `<div>` aqui deixaria a própria página de documentação com um controle
         inalcançável por teclado. -->
    <InputGroup>
      <InputGroupInput placeholder={labels.searchField} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{labels.clear}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  <!-- Par 2 — o erro aparece na moldura E em texto ligado ao campo -->
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <!-- O rótulo VISÍVEL nomeia o campo — mesmo padrão do par 3. Sem ele o
           único candidato a nome era o `aria-describedby` do erro, e descrição
           não é nome: `label-title-only` reprova. O par continua sendo sobre a
           PALAVRA do erro; o rótulo está nos dois lados justamente para não
           virar a diferença entre eles. -->
      <label class="nds-label" for={DO_DONT_INVALID_ID}>{labels.siteGroup}</label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{labels.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={DO_DONT_INVALID_ID}
          placeholder={labels.siteField}
          aria-invalid="true"
          aria-describedby={DO_DONT_INVALID_ERROR_ID}
        />
      </InputGroup>
      <!-- Dentro da moldura, o texto herdaria o `cursor: text` do addon e
           disputaria a largura com o que a pessoa digita. -->
      <p id={DO_DONT_INVALID_ERROR_ID} class="nds-text-caption nds-text-destructive">
        {labels.invalidMsg}
      </p>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <!-- Só a moldura vermelha: quem não distingue a cor não fica sabendo de
         nada. O atributo está lá — é ele que pinta —, mas não há texto nenhum
         ligado a ele.

         O rótulo acompanha o lado bom: a diferença que este par ensina é a
         presença do TEXTO DO ERRO, e um campo sem nome de um lado só
         acrescentaria um segundo defeito no meio da lição. -->
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <label class="nds-label" for={DO_DONT_INVALID_NO_TEXT_ID}>{labels.siteGroup}</label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{labels.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={DO_DONT_INVALID_NO_TEXT_ID}
          placeholder={labels.siteField}
          aria-invalid="true"
        />
      </InputGroup>
    </div>
  {/snippet}

  <!-- Par 3 — o rótulo visível nomeia; o prefixo só completa o formato -->
  {#snippet doPair3()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <label class="nds-label" for={DO_DONT_SITE_ID}>{labels.siteGroup}</label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{labels.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id={DO_DONT_SITE_ID} placeholder={labels.siteField} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{labels.suffix}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  {/snippet}
  {#snippet dontPair3()}
    <!-- Sem rótulo: o campo fica sem nome, e `https://` não é o assunto dele. O
         leitor de tela anuncia só "campo de edição". -->
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{labels.prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder={labels.siteField} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{labels.suffix}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={stripHtml($tStore('description'))}
    code={codeImport}
    componentSlug={SLUG}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    id="variantes"
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    componentSlug={SLUG}
    items={[
      {
        name: $tStore('variants.items.inlineStart.name'),
        description: $tStore('variants.items.inlineStart.description'),
        trackId: 'inlineStart',
        code: alignmentCode.inlineStart,
        preview: variantInlineStart,
      },
      {
        name: $tStore('variants.items.inlineEnd.name'),
        description: $tStore('variants.items.inlineEnd.description'),
        trackId: 'inlineEnd',
        code: alignmentCode.inlineEnd,
        preview: variantInlineEnd,
      },
      {
        name: $tStore('variants.items.blockStart.name'),
        description: $tStore('variants.items.blockStart.description'),
        trackId: 'blockStart',
        code: alignmentCode.blockStart,
        preview: variantBlockStart,
      },
      {
        name: $tStore('variants.items.blockEnd.name'),
        description: $tStore('variants.items.blockEnd.description'),
        trackId: 'blockEnd',
        code: alignmentCode.blockEnd,
        preview: variantBlockEnd,
      },
    ]}
  />

  {#snippet variantInlineStart()}
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{labels.prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder={labels.siteField} />
    </InputGroup>
  {/snippet}

  {#snippet variantInlineEnd()}
    <InputGroup>
      <InputGroupInput placeholder={labels.siteField} />
      <InputGroupAddon align="inline-end">
        <!-- O MESMO fragmento das outras stacks: a variante mostra a POSIÇÃO, e
             trocar o texto junto faria a comparação medir duas coisas. -->
        <InputGroupText>{labels.prefix}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  {#snippet variantBlockStart()}
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupButton>{labels.send}</InputGroupButton>
      </InputGroupAddon>
      <InputGroupTextarea rows={2} placeholder={labels.note} />
    </InputGroup>
  {/snippet}

  {#snippet variantBlockEnd()}
    <InputGroup>
      <InputGroupTextarea rows={2} placeholder={labels.note} />
      <InputGroupAddon align="block-end">
        <InputGroupButton>{labels.send}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    id="composicoes"
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug={SLUG}
    items={[
      {
        name: $tStore('variants.compositions.search.name'),
        description: $tStore('variants.compositions.search.description'),
        useWhen: $tStore('variants.compositions.search.use'),
        trackId: 'search',
        code: compositionCode.search,
        preview: compositionSearch,
      },
      {
        name: $tStore('variants.compositions.password.name'),
        description: $tStore('variants.compositions.password.description'),
        useWhen: $tStore('variants.compositions.password.use'),
        trackId: 'password',
        code: compositionCode.password,
        preview: compositionPassword,
      },
      {
        name: $tStore('variants.compositions.affix.name'),
        description: $tStore('variants.compositions.affix.description'),
        useWhen: $tStore('variants.compositions.affix.use'),
        trackId: 'affix',
        code: compositionCode.affix,
        preview: compositionAffix,
      },
      {
        name: $tStore('variants.compositions.textareaToolbar.name'),
        description: $tStore('variants.compositions.textareaToolbar.description'),
        useWhen: $tStore('variants.compositions.textareaToolbar.use'),
        trackId: 'textareaToolbar',
        code: compositionCode.textareaToolbar,
        preview: compositionTextareaToolbar,
      },
    ]}
  />

  {#snippet compositionSearch()}
    <InputGroup aria-label={labels.searchGroup}>
      <InputGroupAddon align="inline-start">
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder={labels.searchField} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{labels.shortcut}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  {#snippet compositionPassword()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <label class="nds-label" for={COMPOSITION_PASSWORD_ID}>{labels.password}</label>
      <InputGroup aria-label={labels.password}>
        <InputGroupInput
          id={COMPOSITION_PASSWORD_ID}
          type={compositionPasswordVisible ? 'text' : 'password'}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={compositionPasswordVisible ? labels.hide : labels.reveal}
            onclick={toggleCompositionPassword}
          >
            {#if compositionPasswordVisible}
              <EyeOff aria-hidden="true" />
            {:else}
              <Eye aria-hidden="true" />
            {/if}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  {/snippet}

  {#snippet compositionAffix()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <label class="nds-label" for={COMPOSITION_SITE_ID}>{labels.siteGroup}</label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{labels.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id={COMPOSITION_SITE_ID} placeholder={labels.siteField} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{labels.suffix}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  {/snippet}

  {#snippet compositionTextareaToolbar()}
    <InputGroup aria-label={labels.note}>
      <InputGroupTextarea rows={3} placeholder={labels.note} />
      <InputGroupAddon align="block-end">
        <InputGroupButton>{labels.send}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={['rest', 'focus', 'invalid', 'disabled'].map(key => ({
      label:    $tStore(`states.${key}.label`),
      trigger:  toPlainText($tStore(`states.${key}.trigger`)),
      behavior: toPlainText($tStore(`states.${key}.behavior`)),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      { title: 'InputGroup',       cols: propsTableCols, items: groupPropItems  },
      { title: 'InputGroupAddon',  cols: propsTableCols, items: addonPropItems  },
      { title: 'InputGroupText',   cols: propsTableCols, items: textPropItems   },
      { title: 'InputGroupButton', cols: propsTableCols, items: buttonPropItems },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={tokenItems}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
    language="css"
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: toPlainText($tStore('accessibility.keyboard.tab'))      },
      { key: 'Shift+Tab', description: toPlainText($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText($tStore('accessibility.keyboard.enter'))    },
      { key: 'Space',     description: toPlainText($tStore('accessibility.keyboard.space'))    },
    ]}
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug={SLUG}
    items={[
      { name: $tStore('related.items.input.name'),    description: toPlainText($tStore('related.items.input.description')),    path: '?path=/docs/primitives-form-input--docs'    },
      { name: $tStore('related.items.textarea.name'), description: toPlainText($tStore('related.items.textarea.description')), path: '?path=/docs/primitives-form-textarea--docs' },
      { name: $tStore('related.items.button.name'),   description: toPlainText($tStore('related.items.button.description')),   path: '?path=/docs/primitives-form-button--docs'   },
      { name: $tStore('related.items.form.name'),     description: toPlainText($tStore('related.items.form.description')),     path: '?path=/docs/primitives-form-form--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug={SLUG}
    items={noteItems}
  />

  <!-- ── Analytics ──────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'button_click',        trigger: toPlainText($tStore('analytics.table.button_click.trigger')),        payload: $tStore('analytics.table.button_click.payload')        },
      { event: 'docs_section_viewed', trigger: toPlainText($tStore('analytics.table.docs_section_viewed.trigger')), payload: $tStore('analytics.table.docs_section_viewed.payload') },
    ]}
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
      items: [1, 2, 3, 4, 5].map(i => ({
        action:   toPlainText($tStore(`testes.functional.item${i}.action`)),
        result:   toPlainText($tStore(`testes.functional.item${i}.result`)),
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
      items: [
        { criterion: toPlainText($tStore('testes.accessibility.item1')), level: '2.2 AA', how: 'axe-core via Storybook' },
        { criterion: toPlainText($tStore('testes.accessibility.item2')), level: '4.1.2',  how: 'play (Playground)'      },
        { criterion: toPlainText($tStore('testes.accessibility.item3')), level: '4.1.2',  how: 'play (Playground)'      },
        { criterion: toPlainText($tStore('testes.accessibility.item4')), level: '2.1.1',  how: 'play (Playground)'      },
        { criterion: toPlainText($tStore('testes.accessibility.item5')), level: '1.4.1',  how: 'play (Invalid)'         },
        { criterion: toPlainText($tStore('testes.accessibility.item6')), level: '4.1.3',  how: 'play (Playground)'      },
        { criterion: toPlainText($tStore('testes.accessibility.item7')), level: '1.4.4',  how: 'play (Playground)'      },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map(i => ({
        story:    $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
