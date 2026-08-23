import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_AVATAR } from '@/components/ui/avatar';
import uiTranslations from '@/i18n/ui.json';
import avatarTranslations from '@shared/content/avatar/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Dois grupos de override, os dois por ausência no conteúdo compartilhado:
//
// 1. `props.table.className` / `.children` — aqui não existe prop de classe nem
//    de conteúdo: o `class` é o atributo nativo do elemento (o Angular mescla
//    com a classe base) e o conteúdo é escrito dentro dele.
// 2. `accessibility.keyboard.*` — este conteúdo tem `keyboardTitle` mas não as
//    linhas da tabela. Escrevê-las direto no template deixaria a seção em um
//    idioma só; como override, seguem os três.
const { t, dict } = useTranslation(avatarTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base. Para tamanho, use a propriedade de tamanho.',
    'props.table.children': 'Conteúdo, escrito dentro do elemento: a imagem e o fallback.',
    'accessibility.keyboard.none': 'O Avatar não é focável nem interativo — ele segue o fluxo de tabulação do container que o envolve.',
    'accessibility.keyboard.tab': 'Quando o Avatar está dentro de um link ou de um botão, é o container que recebe o foco e desenha o anel.',
    'accessibility.keyboard.enter': 'Aciona o container clicável — link ou botão — que envolve o Avatar.',
  },
  en: {
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class. For size, use the size property.',
    'props.table.children': 'Content, written inside the element: the image and the fallback.',
    'accessibility.keyboard.none': 'Avatar is neither focusable nor interactive — it follows the tab order of the container around it.',
    'accessibility.keyboard.tab': 'When Avatar sits inside a link or a button, the container is what takes focus and draws the ring.',
    'accessibility.keyboard.enter': 'Activates the clickable container — link or button — wrapping the Avatar.',
  },
  es: {
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base. Para el tamaño, usa la propiedad de tamaño.',
    'props.table.children': 'Contenido, escrito dentro del elemento: la imagen y el fallback.',
    'accessibility.keyboard.none': 'El Avatar no es enfocable ni interactivo — sigue el orden de tabulación del contenedor que lo envuelve.',
    'accessibility.keyboard.tab': 'Cuando el Avatar está dentro de un enlace o un botón, es el contenedor el que recibe el foco y dibuja el anillo.',
    'accessibility.keyboard.enter': 'Activa el contenedor clicable — enlace o botón — que envuelve al Avatar.',
  },
});

// Placeholder inline: a docs page não depende de rede, e a foto que falha
// falha por decodificação, não por DNS.
const FOTO =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect width='128' height='128' fill='%2394a3b8'/%3E%3C/svg%3E";
const FOTO_QUEBRADA = 'data:image/png;base64,AAAA';

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'estados',      labelKey: 'nav.states'   },
    { id: 'propriedades', labelKey: 'nav.props'    },
    { id: 'tokens',       labelKey: 'nav.tokens'   },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

// A estrutura é escrita aqui e não lida de `anatomy.structureCode`: a variante
// `angular` do conteúdo compartilhado descreve um elemento `<nds-avatar>` que
// este stack não tem — todas as partes são diretiva de atributo em elemento
// nativo, para o DOM sair igual ao das outras stacks. Enquanto o conteúdo não
// for corrigido, o snippet correto é este.
const ANATOMY_CODE = `<span ndsAvatar size="md">             <!-- Container circular -->
  <img ndsAvatarImage src="…" alt="…" />   <!-- Imagem com alt -->
  <span ndsAvatarFallback>MR</span>        <!-- Iniciais ou ícone -->
  <span ndsAvatarBadge></span>             <!-- Status, opcional -->
</span>`;

const INTERFACE_CODE = `// Uma diretiva de atributo por parte do Avatar.
@Directive({ selector: 'span[ndsAvatar]', hostDirectives: [RdxAvatarRootDirective] })
export class NdsAvatar {
  readonly size = input<AvatarSize>('md');   // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

// img[ndsAvatarImage]  — expõe do primitivo: src, srcSet, sizes, crossOrigin,
//                        referrerPolicy e o evento onLoadingStatusChange
// span[ndsAvatarFallback] — expõe do primitivo: delayMs
// span[ndsAvatarBadge] · div[ndsAvatarGroup] · div[ndsAvatarGroupCount] — sem input
// svg[ndsAvatarIcon]   — ícone genérico para o fallback (conveniência do stack)

// NDS_AVATAR exporta todas de uma vez para o \`imports\` de quem compõe.`;

const IMPORT_CODE = `import { NDS_AVATAR } from '@/components/ui/avatar';`;

const IMPORT_ICON_CODE = `import { NDS_AVATAR } from '@/components/ui/avatar';

// O ícone já vem no conjunto — <svg ndsAvatarIcon> dentro do fallback.
// Fallback com desenho precisa de nome acessível próprio:
// <span ndsAvatarFallback role="img" aria-label="Usuário genérico">`;

const CODE_IMAGE = `<span ndsAvatar>
  <img
    ndsAvatarImage
    src="https://exemplo.com/maria.jpg"
    alt="Foto de perfil de Maria Rodrigues"
  />
  <span ndsAvatarFallback [delayMs]="600">MR</span>
</span>`;

const CODE_INITIALS = `<span ndsAvatar>
  <span ndsAvatarFallback>JP</span>
</span>`;

const CODE_ICON = `<span ndsAvatar>
  <span ndsAvatarFallback role="img" aria-label="Usuário genérico">
    <svg ndsAvatarIcon></svg>
  </span>
</span>`;

const CODE_GROUP = `<div ndsAvatarGroup role="group" aria-label="Participantes">
  <span ndsAvatar>
    <img ndsAvatarImage src="/maria.jpg" alt="" />
    <span ndsAvatarFallback>MR</span>
  </span>
  <div ndsAvatarGroupCount aria-hidden="true">+3</div>
</div>`;

const CODE_STATUS = `<span ndsAvatar>
  <img ndsAvatarImage src="/maria.jpg" alt="" />
  <span ndsAvatarFallback>MR</span>
  <span ndsAvatarBadge role="img" aria-label="online"></span>
</span>`;

@Component({
  selector: 'nds-avatar-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_AVATAR,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="foto" [alt]="t('demonstration.labels.withImageAlt')" />
        <span ndsAvatarFallback [delayMs]="600">MR</span>
      </span>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="fotoQuebrada" [alt]="t('demonstration.labels.withImageAlt')" />
      </span>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback>MR</span>
      </span>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback>mar</span>
      </span>
    </ng-template>

    <ng-template #tplVarImage>
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="foto" [alt]="t('demonstration.labels.withImageAlt')" />
        <span ndsAvatarFallback [delayMs]="600">MR</span>
      </span>
    </ng-template>
    <ng-template #tplVarInitials>
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback>JP</span>
      </span>
    </ng-template>
    <ng-template #tplVarIcon>
      <span ndsAvatar size="lg">
        <span ndsAvatarFallback role="img" [attr.aria-label]="t('demonstration.labels.withIcon')">
          <svg ndsAvatarIcon></svg>
        </span>
      </span>
    </ng-template>
    <ng-template #tplVarGroup>
      <div ndsAvatarGroup role="group" [attr.aria-label]="t('demonstration.labels.groupTitle')">
        <span ndsAvatar>
          <img ndsAvatarImage [src]="foto" alt="" />
          <span ndsAvatarFallback>MR</span>
        </span>
        <span ndsAvatar>
          <img ndsAvatarImage [src]="foto" alt="" />
          <span ndsAvatarFallback>JP</span>
        </span>
        <span ndsAvatar>
          <span ndsAvatarFallback>AS</span>
        </span>
        <div ndsAvatarGroupCount aria-hidden="true">+3</div>
      </div>
    </ng-template>
    <ng-template #tplVarStatus>
      <span ndsAvatar size="lg">
        <img ndsAvatarImage [src]="foto" alt="" />
        <span ndsAvatarFallback>MR</span>
        <span ndsAvatarBadge role="img" [attr.aria-label]="t('demonstration.labels.statusOnline')"></span>
      </span>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="avatar"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-cluster nds-w-full" data-spacing="xl">
            <div class="nds-stack" data-spacing="xs">
              <span ndsAvatar size="lg">
                <img ndsAvatarImage [src]="foto" [alt]="t('demonstration.labels.withImageAlt')" />
                <span ndsAvatarFallback [delayMs]="600">MR</span>
              </span>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.withImage') }}
              </p>
            </div>

            <div class="nds-stack" data-spacing="xs">
              <span ndsAvatar size="lg">
                <span ndsAvatarFallback>{{ t('demonstration.labels.withFallbackInitials') }}</span>
              </span>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.withFallback') }}
              </p>
            </div>

            <div class="nds-stack" data-spacing="xs">
              <span ndsAvatar size="lg">
                <span ndsAvatarFallback role="img" [attr.aria-label]="t('demonstration.labels.withIcon')">
                  <svg ndsAvatarIcon></svg>
                </span>
              </span>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.withIcon') }}
              </p>
            </div>

            <div class="nds-stack" data-spacing="xs">
              <div ndsAvatarGroup role="group" [attr.aria-label]="t('demonstration.labels.groupTitle')">
                <span ndsAvatar size="lg">
                  <img ndsAvatarImage [src]="foto" alt="" />
                  <span ndsAvatarFallback>MR</span>
                </span>
                <span ndsAvatar size="lg">
                  <img ndsAvatarImage [src]="foto" alt="" />
                  <span ndsAvatarFallback>JP</span>
                </span>
                <span ndsAvatar size="lg">
                  <span ndsAvatarFallback>AS</span>
                </span>
                <div ndsAvatarGroupCount aria-hidden="true">+3</div>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.groupTitle') }}
              </p>
            </div>

            <div class="nds-stack" data-spacing="xs">
              <span ndsAvatar size="lg">
                <img ndsAvatarImage [src]="foto" alt="" />
                <span ndsAvatarFallback>MR</span>
                <span
                  ndsAvatarBadge
                  role="img"
                  [attr.aria-label]="t('demonstration.labels.statusOnline')"
                ></span>
              </span>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.statusTitle') }}
              </p>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="anatomyCode"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withIcon')"
          [secondaryCode]="importIconCode"
          componentSlug="avatar"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="variantsNote()"
          [items]="variantItems()"
          componentSlug="avatar"
          id="variantes"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="avatar"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="avatar" />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsAvatarDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importIconCode = IMPORT_ICON_CODE;
  protected readonly foto = FOTO;
  protected readonly fotoQuebrada = FOTO_QUEBRADA;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarImage = viewChild.required<TemplateRef<unknown>>('tplVarImage');
  private readonly tplVarInitials = viewChild.required<TemplateRef<unknown>>('tplVarInitials');
  private readonly tplVarIcon = viewChild.required<TemplateRef<unknown>>('tplVarIcon');
  private readonly tplVarGroup = viewChild.required<TemplateRef<unknown>>('tplVarGroup');
  private readonly tplVarStatus = viewChild.required<TemplateRef<unknown>>('tplVarStatus');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['alt', 'initials', 'status', 'decorative'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3].map((i) => stripHtml(t(`usage.dont.item${i}`))),
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly variantsNote = computed(() => {
    dict();
    return toPlainText(t('variants.note'));
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'image',      code: CODE_IMAGE,    tpl: this.tplVarImage()    },
      { key: 'initials',   code: CODE_INITIALS, tpl: this.tplVarInitials() },
      { key: 'icon',       code: CODE_ICON,     tpl: this.tplVarIcon()     },
      { key: 'group',      code: CODE_GROUP,    tpl: this.tplVarGroup()    },
      { key: 'withStatus', code: CODE_STATUS,   tpl: this.tplVarStatus()   },
    ].map(({ key, code, tpl }) => ({
      name: key,
      description: toPlainText(t(`variants.items.${key}`)),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    // Este componente nomeia as configurações (loaded/loading/failed/noImage)
    // em vez de numerá-las como item1..N.
    return ['loaded', 'loading', 'failed', 'noImage'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const sim = tNav('common.yes');
    const not = tNav('common.no');
    const className = {
      name: 'class',
      type: 'string',
      defaultValue: '—',
      required: not,
      description: toPlainText(t('props.table.className')),
    };

    return [
      {
        title: t('props.avatarTitle'),
        cols,
        items: [
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg' | 'xl' | '2xl'",
            defaultValue: "'md'",
            required: not,
            description: toPlainText(t('props.table.size')),
          },
          className,
          {
            name: '(conteúdo)',
            type: 'HTML',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('props.table.children')),
          },
        ],
      },
      {
        title: t('props.avatarImageTitle'),
        cols,
        items: [
          {
            name: 'src',
            type: 'string',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('props.table.src')),
          },
          {
            name: 'alt',
            type: 'string',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('props.table.alt')),
          },
          {
            name: 'onLoadingStatusChange',
            type: "EventEmitter<'idle' | 'loading' | 'loaded' | 'error'>",
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onLoadingStatusChange')),
          },
          className,
        ],
      },
      {
        title: t('props.avatarFallbackTitle'),
        cols,
        items: [
          {
            name: 'delayMs',
            type: 'number',
            defaultValue: '0',
            required: not,
            description: toPlainText(t('props.table.delayMs')),
          },
          className,
          {
            name: '(conteúdo)',
            type: 'HTML',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.children')),
          },
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: t('tokens.table.part'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      { token: '--avatar-size',      value: '.nds-avatar',             k: 'avatarSize'      },
      { token: '--radius-full',      value: '.nds-avatar',             k: 'radius'          },
      { token: '--muted',            value: '.nds-avatar-fallback',    k: 'muted'           },
      { token: '--muted-foreground', value: '.nds-avatar-fallback',    k: 'mutedForeground' },
      { token: '--background',       value: '.nds-avatar-group',       k: 'background'      },
      { token: '--border',           value: '.nds-avatar',             k: 'border'          },
      { token: '--primary',          value: '.nds-avatar-badge',       k: 'primary'         },
      { token: '--ring',             value: '.nds-focus-ring',         k: 'ring'            },
    ].map(({ token, value, k }) => ({
      token,
      value,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: '—',     description: toPlainText(t('accessibility.keyboard.none')) },
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'badge',       name: 'Badge',       path: '?path=/docs/ui-badge--docs'       },
      { key: 'aspectRatio', name: 'AspectRatio', path: '?path=/docs/ui-aspectratio--docs' },
      { key: 'tooltip',     name: 'Tooltip',     path: '?path=/docs/ui-tooltip--docs'     },
      { key: 'card',        name: 'Card',        path: '?path=/docs/ui-card--docs'        },
    ].map(({ key, name, path }) => ({
      name: name,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['profileClick', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'avatar',
      });
      track('docs_page_view', {
        component_name: 'avatar',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'avatar',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
