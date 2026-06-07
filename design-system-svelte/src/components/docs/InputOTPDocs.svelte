<script lang="ts">
  import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
  } from '@/components/ui/input-otp';
  // bits-ui PinInput aceita `pattern` como string. Replicamos a constante
  // pública do react-input-otp localmente para manter o snippet didático.
  const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import { Button } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import uiTranslations from '@/i18n/ui.json';
  import inputOtpTranslations from '@shared/content/input-otp/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(inputOtpTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'input-otp',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: $tStore('category'), item: '/components/form' },
        { name: 'InputOTP' },
      ],
    });
    track('docs_page_view', {
      component_name: 'input-otp',
      locale: l,
      page_title: t('title'),
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
        { id: 'importacao',   label: tContent('nav.import')   },
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')   },
        { id: 'propriedades', label: tContent('nav.props')    },
        { id: 'tokens',       label: tContent('nav.tokens')   },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'input-otp', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo state ──────────────────────────────────────────────────────────────

  let sixValue = $state('');
  let fourValue = $state('');
  let sepValue = $state('');
  let alphaValue = $state('');
  let compLabelValue = $state('');
  let compHelpValue = $state('');
  let compErrorValue = $state('123');
  let compResendValue = $state('');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";`;

  const codeSixDigits = `<InputOTP maxLength={6} bind:value={code} autocomplete="one-time-code" inputmode="numeric">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`;

  const codeFourDigits = `<InputOTP maxLength={4} bind:value={pin} inputmode="numeric">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>`;

  const codeWithSeparator = `<InputOTP maxLength={6} bind:value={code}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`;

  const codeAlpha = `import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
  inputmode="text"
  bind:value={code}
>
  <InputOTPGroup>
    <!-- 6 slots -->
  </InputOTPGroup>
</InputOTP>`;

  const interfaceCode = `// InputOTP (input-otp lib)
interface InputOTPProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  pattern?: string | RegExp; // default REGEXP_ONLY_DIGITS
  disabled?: boolean;
  autoFocus?: boolean;
  autocomplete?: string;     // recomendado: "one-time-code"
  inputmode?: "numeric" | "text";
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="input-otp">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add input-otp"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <!-- 6 dígitos -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.sixDigits')}
          </p>
          <InputOTP
            maxlength={6}
            bind:value={sixValue}
            aria-label={stripHtml($tStore('demonstration.labels.sixDigits'))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <!-- 4 dígitos -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.fourDigits')}
          </p>
          <InputOTP
            maxlength={4}
            bind:value={fourValue}
            aria-label={stripHtml($tStore('demonstration.labels.fourDigits'))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <!-- Com Separator -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.withSeparator')}
          </p>
          <InputOTP
            maxlength={6}
            bind:value={sepValue}
            aria-label={stripHtml($tStore('demonstration.labels.withSeparator'))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <!-- Alfanumérico -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.alphanumeric')}
          </p>
          <InputOTP
            maxlength={6}
            bind:value={alphaValue}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            aria-label={stripHtml($tStore('demonstration.labels.alphanumeric'))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>
    {/snippet}
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
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        stripHtml($tStore('usage.guidelines.item1')),
        stripHtml($tStore('usage.guidelines.item2')),
        stripHtml($tStore('usage.guidelines.item3')),
        stripHtml($tStore('usage.guidelines.item4')),
        stripHtml($tStore('usage.guidelines.item5')),
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
        { element: $tStore('usage.uxWriting.table.label.name'),     rules: $tStore('usage.uxWriting.table.label.format'),     do: $tStore('usage.uxWriting.table.label.good'),     dont: $tStore('usage.uxWriting.table.label.bad')     },
        { element: $tStore('usage.uxWriting.table.helpText.name'),  rules: $tStore('usage.uxWriting.table.helpText.format'),  do: $tStore('usage.uxWriting.table.helpText.good'),  dont: $tStore('usage.uxWriting.table.helpText.bad')  },
        { element: $tStore('usage.uxWriting.table.errorText.name'), rules: $tStore('usage.uxWriting.table.errorText.format'), do: $tStore('usage.uxWriting.table.errorText.good'), dont: $tStore('usage.uxWriting.table.errorText.bad') },
        { element: $tStore('usage.uxWriting.table.resend.name'),    rules: $tStore('usage.uxWriting.table.resend.format'),    do: $tStore('usage.uxWriting.table.resend.good'),    dont: $tStore('usage.uxWriting.table.resend.bad')    },
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
    ]}
  />

  {#snippet doPair1()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      autocomplete="one-time-code"
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="text-xs font-mono text-muted-foreground italic" style="contain: layout">
      (sem autocomplete)
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="text-xs font-medium" style="contain: layout">Código de verificação</div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="text-xs italic text-muted-foreground" style="contain: layout">(sem label)</div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.sixDigits'),     description: stripHtml($tStore('variants.styles.sixDigits')),     code: codeSixDigits,     preview: variantSix     },
      { name: $tStore('variants.items.fourDigits'),    description: stripHtml($tStore('variants.styles.fourDigits')),    code: codeFourDigits,    preview: variantFour    },
      { name: $tStore('variants.items.withSeparator'), description: stripHtml($tStore('variants.styles.withSeparator')), code: codeWithSeparator, preview: variantSep     },
      { name: $tStore('variants.items.alphanumeric'),  description: stripHtml($tStore('variants.styles.alphanumeric')),  code: codeAlpha,         preview: variantAlpha   },
    ]}
  />

  {#snippet variantSix()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      maxLength=6 · inputmode=numeric
    </div>
  {/snippet}
  {#snippet variantFour()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      maxLength=4 · inputmode=numeric
    </div>
  {/snippet}
  {#snippet variantSep()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      3 + Separator + 3
    </div>
  {/snippet}
  {#snippet variantAlpha()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      pattern=DIGITS_AND_CHARS · inputmode=text
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="input-otp"
    items={[
      {
        name: $tStore('variants.compositions.withLabel.name'),
        description: $tStore('variants.compositions.withLabel.description'),
        useWhen: $tStore('variants.compositions.withLabel.use'),
        code: `<div class="flex flex-col gap-2">
  <Label for="otp-code">Código de verificação</Label>
  <InputOTP id="otp-code" maxlength={6} bind:value={code} autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
</div>`,
        preview: compLabel,
      },
      {
        name: $tStore('variants.compositions.withHelpText.name'),
        description: $tStore('variants.compositions.withHelpText.description'),
        useWhen: $tStore('variants.compositions.withHelpText.use'),
        code: `<div class="flex flex-col gap-2">
  <Label for="otp-help">Código de verificação</Label>
  <InputOTP id="otp-help" maxlength={6} bind:value={code}
    autocomplete="one-time-code" inputmode="numeric" aria-describedby="otp-help-text">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <p id="otp-help-text" class="text-xs text-muted-foreground">
    Enviamos por SMS, expira em 5 min.
  </p>
</div>`,
        preview: compHelp,
      },
      {
        name: $tStore('variants.compositions.withErrorMessage.name'),
        description: $tStore('variants.compositions.withErrorMessage.description'),
        useWhen: $tStore('variants.compositions.withErrorMessage.use'),
        code: `<div class="flex flex-col gap-2">
  <Label for="otp-err">Código de verificação</Label>
  <InputOTP id="otp-err" maxlength={6} bind:value={code} aria-invalid="true"
    autocomplete="one-time-code" inputmode="numeric" aria-describedby="otp-err-text">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <p id="otp-err-text" class="text-xs text-destructive">
    Código incorreto. Verifique e tente novamente.
  </p>
</div>`,
        preview: compError,
      },
      {
        name: $tStore('variants.compositions.withResendButton.name'),
        description: $tStore('variants.compositions.withResendButton.description'),
        useWhen: $tStore('variants.compositions.withResendButton.use'),
        code: `<div class="flex flex-col gap-3">
  <Label for="otp-resend">Código de verificação</Label>
  <InputOTP id="otp-resend" maxlength={6} bind:value={code} autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <div class="flex items-center justify-between gap-3">
    <p class="text-xs text-muted-foreground">Não recebeu?</p>
    <Button variant="link" size="sm">Reenviar código</Button>
  </div>
</div>`,
        preview: compResend,
      },
    ]}
  />

  {#snippet compLabel()}
    <div class="flex flex-col gap-2" style="contain: layout">
      <Label for="comp-label-otp">Código de verificação</Label>
      <InputOTP id="comp-label-otp" maxlength={6} bind:value={compLabelValue} aria-label="Código de verificação">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  {/snippet}

  {#snippet compHelp()}
    <div class="flex flex-col gap-2" style="contain: layout">
      <Label for="comp-help-otp">Código de verificação</Label>
      <InputOTP id="comp-help-otp" maxlength={6} bind:value={compHelpValue} aria-describedby="comp-help-otp-text" aria-label="Código de verificação">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p id="comp-help-otp-text" class="text-xs text-muted-foreground">Enviamos por SMS, expira em 5 min.</p>
    </div>
  {/snippet}

  {#snippet compError()}
    <div class="flex flex-col gap-2" style="contain: layout">
      <Label for="comp-err-otp">Código de verificação</Label>
      <InputOTP id="comp-err-otp" maxlength={6} bind:value={compErrorValue} aria-invalid="true" aria-describedby="comp-err-otp-text" aria-label="Código de verificação">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p id="comp-err-otp-text" class="text-xs text-destructive">Código incorreto. Verifique e tente novamente.</p>
    </div>
  {/snippet}

  {#snippet compResend()}
    <div class="flex flex-col gap-3" style="contain: layout">
      <Label for="comp-resend-otp">Código de verificação</Label>
      <InputOTP id="comp-resend-otp" maxlength={6} bind:value={compResendValue} aria-label="Código de verificação">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted-foreground">Não recebeu?</p>
        <Button variant="link" size="sm">Reenviar código</Button>
      </div>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.empty'),    trigger: 'value=""',                  behavior: stripHtml($tStore('states.descriptions.empty'))    },
      { label: $tStore('states.items.filling'),  trigger: 'value="123"',               behavior: stripHtml($tStore('states.descriptions.filling'))  },
      { label: $tStore('states.items.complete'), trigger: 'value.length === maxLength', behavior: stripHtml($tStore('states.descriptions.complete')) },
      { label: $tStore('states.items.disabled'), trigger: 'disabled',                  behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.error'),    trigger: 'aria-invalid="true"',       behavior: stripHtml($tStore('states.descriptions.error'))    },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'maxLength',  type: $tStore('props.table.maxLength.type'),  defaultValue: $tStore('props.table.maxLength.default'),  required: $tStore('props.table.maxLength.required'),  description: $tStore('props.table.maxLength.description')  },
          { name: 'value',      type: $tStore('props.table.value.type'),      defaultValue: $tStore('props.table.value.default'),      required: $tStore('props.table.value.required'),      description: $tStore('props.table.value.description')      },
          { name: 'onChange',   type: $tStore('props.table.onChange.type'),   defaultValue: $tStore('props.table.onChange.default'),   required: $tStore('props.table.onChange.required'),   description: $tStore('props.table.onChange.description')   },
          { name: 'onComplete', type: $tStore('props.table.onComplete.type'), defaultValue: $tStore('props.table.onComplete.default'), required: $tStore('props.table.onComplete.required'), description: $tStore('props.table.onComplete.description') },
          { name: 'pattern',    type: $tStore('props.table.pattern.type'),    defaultValue: $tStore('props.table.pattern.default'),    required: $tStore('props.table.pattern.required'),    description: $tStore('props.table.pattern.description')    },
          { name: 'disabled',   type: $tStore('props.table.disabled.type'),   defaultValue: $tStore('props.table.disabled.default'),   required: $tStore('props.table.disabled.required'),   description: $tStore('props.table.disabled.description')   },
          { name: 'autoFocus',  type: $tStore('props.table.autoFocus.type'),  defaultValue: $tStore('props.table.autoFocus.default'),  required: $tStore('props.table.autoFocus.required'),  description: $tStore('props.table.autoFocus.description')  },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: 'size',          value: $tStore('tokens.table.slotSize.class'), description: $tStore('tokens.table.slotSize.part') },
      { token: '--input',       value: $tStore('tokens.table.border.class'),   description: $tStore('tokens.table.border.part')   },
      { token: '--radius',      value: $tStore('tokens.table.rounded.class'),  description: $tStore('tokens.table.rounded.part')  },
      { token: '--ring',        value: $tStore('tokens.table.active.class'),   description: $tStore('tokens.table.active.part')   },
      { token: '--destructive', value: $tStore('tokens.table.invalid.class'),  description: $tStore('tokens.table.invalid.part')  },
      { token: 'opacity',       value: $tStore('tokens.table.disabled.class'), description: $tStore('tokens.table.disabled.part') },
      { token: 'animation',     value: $tStore('tokens.table.caret.class'),    description: $tStore('tokens.table.caret.part')    },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
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
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: stripHtml($tStore('accessibility.keyboard.tab'))       },
      { key: 'Arrows',    description: stripHtml($tStore('accessibility.keyboard.arrows'))    },
      { key: 'Backspace', description: stripHtml($tStore('accessibility.keyboard.backspace')) },
      { key: 'Ctrl+V',    description: stripHtml($tStore('accessibility.keyboard.paste'))     },
      { key: '0-9',       description: stripHtml($tStore('accessibility.keyboard.digit'))     },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.input.name'),  description: $tStore('related.items.input.description'),  path: '?path=/docs/ui-input--docs'  },
      { name: $tStore('related.items.form.name'),   description: $tStore('related.items.form.description'),   path: '?path=/docs/ui-form--docs'   },
      { name: $tStore('related.items.label.name'),  description: $tStore('related.items.label.description'),  path: '?path=/docs/ui-label--docs'  },
      { name: $tStore('related.items.button.name'), description: $tStore('related.items.button.description'), path: '?path=/docs/ui-button--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
      { title: '', content: $tStore('notes.item5') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: 'Evento',
      trigger: 'Trigger',
      payload: 'Payload',
    }}
    items={[
      { event: 'otp_complete', trigger: 'onComplete(value)', payload: "{ component: 'input-otp', location, length }" },
      { event: 'otp_paste',    trigger: 'onPaste',           payload: "{ component: 'input-otp', location, length }" },
      { event: 'otp_resend',   trigger: 'onClick resend',    payload: "{ component: 'input-otp', location }"          },
      { event: '—',            trigger: stripHtml($tStore('analytics.description')), payload: '—'                    },
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        action: stripHtml($tStore(`testes.functional.item${i}.action`)),
        result: stripHtml($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'            },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.3.5',  how: 'DevTools attribute'  },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '3.3.2',  how: 'Manual review'       },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2',  how: 'DevTools a11y tree'  },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2',  how: 'DevTools attribute'  },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: '1.4.3',  how: 'Contrast checker'    },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
