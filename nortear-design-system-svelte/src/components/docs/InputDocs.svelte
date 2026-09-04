<script lang="ts">
  import { untrack } from 'svelte';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';

  // field_focus sempre; field_blur só com conteúdo (gatilho documentado).
  // field_error fica de fora: o erro da demo é estático, não um funil real.
  function trackFieldFocus(fieldName: string) {
    track('field_focus', { component: 'input', field_name: fieldName, location: 'docs_demo' });
  }
  function trackFieldBlur(fieldName: string, e: FocusEvent) {
    const value = (e.currentTarget as HTMLInputElement | null)?.value ?? '';
    if (value.length > 0) {
      track('field_blur', { component: 'input', field_name: fieldName, location: 'docs_demo' });
    }
  }
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import inputTranslations from '@shared/content/input/translations.json';


  import { toPlainText } from '@/lib/strip-html';

// ─── Tokens do campo ──────────────────────────────────────────────────────────
//
// Token, seletor que o consome e a chave de conteúdo que o descreve. Cada linha
// foi medida com getComputedStyle antes de entrar aqui — a tabela é o que quem
// customiza copia, e a versão anterior mandava sobrescrever `--height-default` e
// `--radius-input`, dois tokens que `.nds-input` não lê. Não existe token de
// ALTURA: ela nasce de `--spacing-2` mais `--text-control` (WCAG 1.4.4).
const FIELD_TOKENS = [
  ['--input', '.nds-input', 'border'],
  ['--ring', '.nds-input:hover', 'borderHover'],
  ['--ring', '.nds-input:focus-visible', 'borderFocus'],
  ['--destructive', '.nds-input[aria-invalid="true"]', 'borderError'],
  ['--background', '.nds-input', 'background'],
  ['--foreground', '.nds-input', 'text'],
  ['--muted-foreground', '.nds-input::placeholder', 'placeholder'],
  ['--muted', '.nds-input:disabled', 'bgDisabled'],
  ['--radius', '.nds-input', 'radius'],
  ['--spacing-2', '.nds-input', 'paddingBlock'],
  ['--text-control', '.nds-input', 'fontSize'],
  ['--muted', '.nds-input[type="file"]::file-selector-button', 'fileButton'],
] as const;

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(inputTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (inputTranslations as unknown as Record<
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
      componentSlug: 'input',
    });
    track('docs_page_view', {
      component_name: 'input',
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
    track('docs_section_viewed', { section_id: id, component_name: 'input', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Input } from "@/components/ui/input";`;

  const codeImportWithLabel = `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<div class="nds-stack" data-spacing="xs">
  <Label for="nome">Nome completo</Label>
  <Input id="nome" type="text" placeholder="ex: João da Silva" />
</div>`;

  const codeEmail = `<div class="nds-stack" data-spacing="xs">
  <Label for="email">Email</Label>
  <Input id="email" type="email" placeholder="ex: joao@empresa.com" />
</div>`;

  const codePassword = `<div class="nds-stack" data-spacing="xs">
  <Label for="senha">Senha</Label>
  <Input id="senha" type="password" placeholder="••••••••" />
</div>`;

  const codeDisabled = `<div class="nds-stack" data-spacing="xs">
  <Label for="campo-disabled">Campo desabilitado</Label>
  <Input id="campo-disabled" type="text" disabled placeholder="Não disponível" />
</div>`;

  const codeError = `<div class="nds-stack" data-spacing="xs">
  <Label for="email-erro">Email</Label>
  <Input id="email-erro" type="email" aria-invalid="true"
    aria-describedby="email-msg"
    placeholder="ex: joao@empresa.com" />
  <p id="email-msg" class="nds-text-caption nds-text-destructive">
    Email inválido. Use o formato nome@dominio.com
  </p>
</div>`;

  const codeFile = `<div class="nds-stack" data-spacing="xs">
  <Label for="arquivo">Arquivo</Label>
  <Input id="arquivo" type="file" />
</div>`;

  const codeTokenCustomization = `/* Em globals.css — sobrescrever os tokens que o campo consome */
:root {
  --input: 0 0% 56%;         /* borda em repouso — mantenha 3:1 contra o fundo */
  --ring: 0 0% 45%;          /* borda no hover e no foco, e a cor do halo */
  --destructive: 0 74% 42%;  /* borda e halo do estado de erro */
  --radius: 0.625rem;        /* arredondamento das quinas */
  --spacing-2: 0.5rem;       /* respiro vertical: a altura acompanha */
  --text-control: 0.875rem;  /* tipografia do campo: a altura acompanha */
}`;

  const interfaceCode = `// Input — estende todos os atributos HTML nativos de <input>
interface InputProps extends HTMLInputAttributes {
  class?: string;
  ref?: HTMLInputElement | null;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="input">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')}>
        <div class="nds-w-full nds-max-w-sm nds-stack" data-spacing="md">
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-nome">{$tStore('demonstration.labels.defaultLabel')}</Label>
            <Input id="demo-nome" type="text" placeholder={$tStore('demonstration.labels.defaultPlaceholder')} onfocus={() => trackFieldFocus('nome')} onblur={(e: FocusEvent) => trackFieldBlur('nome', e)} />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-email">{$tStore('demonstration.labels.emailLabel')}</Label>
            <Input id="demo-email" type="email" placeholder={$tStore('demonstration.labels.emailPlaceholder')} onfocus={() => trackFieldFocus('email')} onblur={(e: FocusEvent) => trackFieldBlur('email', e)} />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-senha">{$tStore('demonstration.labels.passwordLabel')}</Label>
            <Input id="demo-senha" type="password" placeholder={$tStore('demonstration.labels.passwordPlaceholder')} onfocus={() => trackFieldFocus('senha')} onblur={(e: FocusEvent) => trackFieldBlur('senha', e)} />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-busca">{$tStore('demonstration.labels.searchLabel')}</Label>
            <Input id="demo-busca" type="search" placeholder={$tStore('demonstration.labels.searchPlaceholder')} onfocus={() => trackFieldFocus('busca')} onblur={(e: FocusEvent) => trackFieldBlur('busca', e)} />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-disabled">{$tStore('demonstration.labels.disabledLabel')}</Label>
            <Input id="demo-disabled" type="text" disabled placeholder={$tStore('demonstration.labels.disabledPlaceholder')} />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="demo-error">{$tStore('demonstration.labels.errorLabel')}</Label>
            <Input
              id="demo-error"
              type="email"
              aria-invalid="true"
              aria-describedby="demo-error-msg"
              placeholder={$tStore('demonstration.labels.errorPlaceholder')}
            />
            <p id="demo-error-msg" class="nds-text-caption nds-text-destructive">{$tStore('demonstration.labels.errorMessage')}</p>
          </div>
        </div>
      </DocsDemonstration>

      <!-- ── Anatomia ───────────────────────────────────────────────── -->
      <DocsAnatomy
        title={$tStore('anatomy.title')}
        items={[
          $tStore('anatomy.item1'),
          $tStore('anatomy.item2'),
          $tStore('anatomy.item3'),
          $tStore('anatomy.item4'),
        ]}
        structureLabel={$tStore('anatomy.structureLabel')}
        structureCode={`<div class="nds-stack" data-spacing="xs">
  <Label for="email">Email</Label>       <!-- Label obrigatório -->
  <Input
    id="email"
    type="email"                         <!-- type semântico -->
    placeholder="ex: joao@empresa.com"
    aria-describedby="email-hint"
  />
  <p id="email-hint" class="nds-text-caption nds-text-muted-foreground">
    Texto de apoio.
  </p>
</div>`}
      />

      <!-- ── Quando Usar ────────────────────────────────────────────── -->
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
        title={$tStore('doDont.title')}
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
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair3.do'),
            dontCaption: $tStore('doDont.pair3.dont'),
            doPreview: doPair3,
            dontPreview: dontPair3,
          },
        ]}
      />

      {#snippet doPair1()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="do1-email">Email</Label>
          <Input id="do1-email" type="email" placeholder="ex: joao@empresa.com" />
        </div>
      {/snippet}
      {#snippet dontPair1()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="dont1-email">Email</Label>
          <Input id="dont1-email" type="email" placeholder="Digite seu email" />
        </div>
      {/snippet}

      {#snippet doPair2()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="do2-email">Email</Label>
          <Input id="do2-email" type="email" placeholder="ex: joao@empresa.com" />
        </div>
      {/snippet}
      {#snippet dontPair2()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="dont2-email">Email</Label>
          <Input id="dont2-email" type="text" placeholder="ex: joao@empresa.com" />
        </div>
      {/snippet}

      {#snippet doPair3()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="do3-nome">Nome completo</Label>
          <Input id="do3-nome" type="text" placeholder="ex: João da Silva" />
        </div>
      {/snippet}
      {#snippet dontPair3()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Input type="text" placeholder="Nome completo" />
        </div>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        description={$tStore('import.basic')}
        code={codeImportBasic}
        secondaryDescription={$tStore('import.withGroup')}
        secondaryCode={codeImportWithLabel}
      />

      <!-- ── Variantes (Tipos) ─────────────────────────────────────── -->
      <DocsVariants
        title={$tStore('variants.title')}
        componentSlug="input"
        items={[
          { name: 'text',     description: $tStore('variants.items.types.text'),     code: codeDefault,   preview: variantText     },
          { name: 'email',    description: $tStore('variants.items.types.email'),    code: codeEmail,     preview: variantEmail    },
          { name: 'password', description: $tStore('variants.items.types.password'), code: codePassword,  preview: variantPassword },
          { name: 'disabled', description: $tStore('states.disabled.behavior'), code: codeDisabled, preview: variantDisabled },
          { name: 'error',    description: $tStore('states.error.behavior'),   code: codeError,     preview: variantError    },
          { name: 'file',     description: $tStore('variants.items.types.file'),     code: codeFile,      preview: variantFile     },
        ]}
      />

      {#snippet variantText()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-text">Nome completo</Label>
          <Input id="v-text" type="text" placeholder="ex: João da Silva" />
        </div>
      {/snippet}
      {#snippet variantEmail()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-email">Email</Label>
          <Input id="v-email" type="email" placeholder="ex: joao@empresa.com" />
        </div>
      {/snippet}
      {#snippet variantPassword()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-password">Senha</Label>
          <Input id="v-password" type="password" placeholder="••••••••" />
        </div>
      {/snippet}
      {#snippet variantDisabled()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-disabled">Campo desabilitado</Label>
          <Input id="v-disabled" type="text" disabled placeholder="Não disponível" />
        </div>
      {/snippet}
      {#snippet variantError()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-error">Email</Label>
          <Input id="v-error" type="email" aria-invalid="true" aria-describedby="v-error-msg" placeholder="ex: joao@empresa.com" />
          <p id="v-error-msg" class="nds-text-caption nds-text-destructive">Email inválido. Use o formato nome@dominio.com</p>
        </div>
      {/snippet}
      {#snippet variantFile()}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <Label for="v-file">Arquivo</Label>
          <Input id="v-file" type="file" />
        </div>
      {/snippet}

      <!-- ── Composições ──────────────────────────────────────────────── -->
      <DocsCompositions
        title={$tStore('variants.compositionsTitle')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="input"
        items={[
          {
            trackId: 'withLabel',
            name: $tStore('variants.compositions.withLabel.name'),
            description: $tStore('variants.compositions.withLabel.description'),
            useWhen: $tStore('variants.compositions.withLabel.use'),
            code: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label for="input-nome">Nome completo</Label>\n  <Input id="input-nome" type="text" placeholder="ex: João da Silva" />\n</div>`,
            preview: compWithLabel,
          },
          {
            trackId: 'withHint',
            name: $tStore('variants.compositions.withHint.name'),
            description: $tStore('variants.compositions.withHint.description'),
            useWhen: $tStore('variants.compositions.withHint.use'),
            code: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label for="input-email">Email</Label>\n  <Input id="input-email" type="email" placeholder="ex: joao@empresa.com" />\n  <p class="nds-text-caption nds-text-muted-foreground">Usaremos este email para envio de notificações.</p>\n</div>`,
            preview: compWithHint,
          },
          {
            trackId: 'errorMessage',
            name: $tStore('variants.compositions.errorMessage.name'),
            description: $tStore('variants.compositions.errorMessage.description'),
            useWhen: $tStore('variants.compositions.errorMessage.use'),
            code: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label for="input-email-error">Email</Label>\n  <Input id="input-email-error" type="email" aria-invalid="true" aria-describedby="input-email-error-error" placeholder="ex: joao@empresa.com" />\n  <p id="input-email-error-error" class="nds-text-caption nds-text-destructive">Email inválido. Use o formato nome@dominio.com</p>\n</div>`,
            preview: compWithError,
          },
          {
            trackId: 'withPrefix',
            name: $tStore('variants.compositions.withPrefix.name'),
            description: $tStore('variants.compositions.withPrefix.description'),
            useWhen: $tStore('variants.compositions.withPrefix.use'),
            // A moldura e o anel de foco são do GRUPO; o campo interno fica nu.
            // A versão anterior montava a caixa à mão e zerava a borda por style
            // inline — o que vencia a folha e tirava o exemplo do tema.
            code: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label for="input-url">URL do site</Label>\n  <InputGroup>\n    <InputGroupAddon align="inline-start">\n      <InputGroupText>https://</InputGroupText>\n    </InputGroupAddon>\n    <InputGroupInput type="url" id="input-url" placeholder="meusite.com" />\n  </InputGroup>\n</div>`,
            preview: compWithPrefix,
          },
        ]}
      />

      {#snippet compWithLabel()}
        <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
          <Label for="input-nome">Nome completo</Label>
          <Input id="input-nome" type="text" placeholder="ex: João da Silva" />
        </div>
      {/snippet}
      {#snippet compWithHint()}
        <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
          <Label for="input-email">Email</Label>
          <Input id="input-email" type="email" placeholder="ex: joao@empresa.com" />
          <p class="nds-text-caption nds-text-muted-foreground">Usaremos este email para envio de notificações.</p>
        </div>
      {/snippet}
      {#snippet compWithError()}
        <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
          <Label for="input-email-error">Email</Label>
          <Input id="input-email-error" type="email" aria-invalid="true" aria-describedby="input-email-error-error" placeholder="ex: joao@empresa.com" />
          <p id="input-email-error-error" class="nds-text-caption nds-text-destructive">Email inválido. Use o formato nome@dominio.com</p>
        </div>
      {/snippet}
      {#snippet compWithPrefix()}
        <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
          <Label for="input-url">URL do site</Label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput type="url" id="input-url" placeholder="meusite.com" />
          </InputGroup>
        </div>
      {/snippet}

      <!-- ── Estados ────────────────────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('states.cols.state'),
          trigger: toPlainText($tStore('states.cols.trigger')),
          behavior: toPlainText($tStore('states.cols.behavior')),
        }}
        items={[
          { label: $tStore('states.default.label'),  trigger: toPlainText($tStore('states.default.trigger')),  behavior: toPlainText($tStore('states.default.behavior'))},
          { label: $tStore('states.focus.label'),    trigger: toPlainText($tStore('states.focus.trigger')),    behavior: toPlainText($tStore('states.focus.behavior'))},
          { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior'))},
          { label: $tStore('states.error.label'),    trigger: toPlainText($tStore('states.error.trigger')),    behavior: toPlainText($tStore('states.error.behavior'))},
          { label: $tStore('states.file.label'),     trigger: toPlainText($tStore('states.file.trigger')),     behavior: toPlainText($tStore('states.file.behavior'))},
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.inputTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'type',          type: 'HTMLInputTypeAttribute',    defaultValue: '"text"', required: 'Não', description: $tStore('props.table.type_prop')    },
              { name: 'placeholder',   type: 'string',                    defaultValue: '—',      required: 'Não', description: $tStore('props.table.placeholder')   },
              { name: 'disabled',      type: 'boolean',                   defaultValue: 'false',  required: 'Não', description: $tStore('props.table.disabled')      },
              { name: 'aria-invalid',  type: '"true" | "false"',          defaultValue: '—',      required: 'Não', description: $tStore('props.table.ariaInvalid')   },
              { name: 'autocomplete',  type: 'string',                    defaultValue: '—',      required: 'Não', description: $tStore('props.table.autoComplete')  },
              { name: 'class',         type: 'string',                    defaultValue: '—',      required: 'Não', description: $tStore('props.table.className')     },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={$tStore('props.extensibilityTitle')}
        extensibilityNotes={$tStore('props.extensibility')}
      />

      <!-- ── Tokens ─────────────────────────────────────────────────── -->
      <DocsTokens
        title={$tStore('tokens.title')}
        cols={{
          token: $tStore('tokens.table.token'),
          value: $tStore('tokens.table.class'),
          description: $tStore('tokens.table.part'),
        }}
        items={FIELD_TOKENS.map(([token, selector, key]) => ({
          token,
          value: selector,
          description: $tStore(`tokens.table.${key}`),
        }))}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeTokenCustomization}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        screenReaderTitle={$tNavStore('common.screenReader')}
        screenReaderItems={screenReaderItems}
        title={$tStore('accessibility.title')}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.item1'),
          $tStore('accessibility.item2'),
          $tStore('accessibility.item3'),
          $tStore('accessibility.item4'),
          $tStore('accessibility.item5'),
        ]}
        keyboardTitle="Navegação por Teclado"
        keyboardItems={[
          { key: 'Tab',        description: $tStore('accessibility.keyboard.tab')      },
          { key: 'Shift+Tab',  description: $tStore('accessibility.keyboard.shiftTab') },
          { key: 'Typing',     description: $tStore('accessibility.keyboard.typing')   },
          { key: 'Escape',     description: $tStore('accessibility.keyboard.escape')   },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: 'Textarea',  description: $tStore('related.textarea'),  path: '?path=/docs/components-form-textarea--docs'  },
          { name: 'InputOTP',  description: $tStore('related.inputOTP'),  path: '?path=/docs/components-form-inputotp--docs'  },
          { name: 'Select',    description: $tStore('related.select'),    path: '?path=/docs/components-form-select--docs'    },
          { name: 'Form',      description: $tStore('related.form'),      path: '?path=/docs/components-form-form--docs'      },
          { name: 'Label',     description: $tStore('related.label'),     path: '?path=/docs/components-form-label--docs'     },
        ]}
      />

      <!-- ── Notas ──────────────────────────────────────────────────── -->
      <DocsNotes
        title={$tStore('notes.title')}
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
        title={$tStore('analytics.title')}
        cols={{
          event: $tStore('analytics.table.event'),
          trigger: toPlainText($tStore('analytics.table.trigger')),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.table.fieldFocus'),    trigger: toPlainText($tStore('analytics.table.fieldFocusTrigger')),    payload: $tStore('analytics.table.fieldFocusPayload')    },
          { event: $tStore('analytics.table.fieldBlur'),     trigger: toPlainText($tStore('analytics.table.fieldBlurTrigger')),     payload: $tStore('analytics.table.fieldBlurPayload')     },
          { event: $tStore('analytics.table.fieldError'),    trigger: toPlainText($tStore('analytics.table.fieldErrorTrigger')),    payload: $tStore('analytics.table.fieldErrorPayload')    },
          { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
          { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
          { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
        ]}
      />

      <!-- ── Testes ─────────────────────────────────────────────────── -->
      <DocsTestes
        title={$tStore('testes.title')}
        functional={{
          title: $tStore('testes.functional.title'),
          cols: {
            action: $tNavStore('common.userAction'),
            result: $tNavStore('common.expectedResult'),
            priority: $tNavStore('common.priority'),
          },
          items: [
            { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item8.action'), result: $tStore('testes.functional.item8.result'), priority: localPriority($tStore('testes.functional.item8.priority'), $tNavStore) },
          ],
        }}
        accessibility={{
          title: $tStore('testes.accessibility.title'),
          cols: {
            criterion: $tNavStore('common.criterion'),
            level: 'WCAG',
            how: $tNavStore('common.howToVerify'),
          },
          items: [
            { criterion: $tStore('testes.accessibility.item1'), level: 'AA', how: 'axe-core / testing-library' },
            { criterion: $tStore('testes.accessibility.item2'), level: 'AA', how: 'getByLabelText no testing-library' },
            { criterion: $tStore('testes.accessibility.item3'), level: 'AA', how: 'Inspecionar atributo aria-invalid no DOM' },
            { criterion: $tStore('testes.accessibility.item4'), level: 'AA', how: 'Inspecionar aria-describedby no DOM' },
            { criterion: $tStore('testes.accessibility.item5'), level: 'AA', how: 'axe-core / Lighthouse contrast audit' },
          ],
        }}
        visual={{
          title: $tStore('testes.visual.title'),
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
          ],
        }}
      />
</DocsPageLayout>
