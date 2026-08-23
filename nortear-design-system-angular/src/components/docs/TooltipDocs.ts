import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NDS_TOOLTIP } from '@/components/ui/tooltip';
import { NdsButton } from '@/components/ui/button';
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';
import { NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle } from '@/components/ui/card';
import uiTranslations from '@/i18n/ui.json';
import tooltipTranslations from '@shared/content/tooltip/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);
const { t, dict } = useTranslation(tooltipTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, não do conteúdo do componente:
// `tooltip/translations.json` não tem `nav.compositions`, e ler de lá deixaria a
// seção Composições com a própria chave impressa como título.
const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
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

// A variante `angular` de `anatomy.structureCode` no conteúdo compartilhado
// descreve `<nds-tooltip-provider>` e `<nds-tooltip>` — dois elementos que este
// stack não tem. As quatro peças são diretivas de ATRIBUTO sobre elementos
// nativos, para o markup bater com o do Vanilla e o CSS `.nds-tooltip-*` casar
// sem wrapper. Enquanto o conteúdo não for corrigido, a estrutura mostrada aqui
// é a que compila.
const ANATOMY_CODE = `<!-- Uma vez, no root da app -->
<div ndsTooltipProvider [delay]="400">
  <router-outlet />
</div>

<!-- Onde precisar -->
<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
</span>`;

const IMPORT_CODE = `import { NDS_TOOLTIP } from '@/components/ui/tooltip';

// ou, peça a peça:
import {
  NdsTooltipProvider,
  NdsTooltip,
  NdsTooltipTrigger,
  NdsTooltipContent,
} from '@/components/ui/tooltip';`;

const IMPORT_CODE_BUTTON = `import { NDS_TOOLTIP } from '@/components/ui/tooltip';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_TOOLTIP, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// As quatro peças compõem os primitivos do Radix NG.
@Directive({
  selector: '[ndsTooltipProvider]',
  hostDirectives: [
    // delay/closeDelay em ms; timeout é a janela em que o vizinho abre na hora
    { directive: RdxTooltipProvider, inputs: ['delay', 'closeDelay', 'timeout'] },
  ],
})
export class NdsTooltipProvider {}

@Component({
  selector: '[ndsTooltip]',
  hostDirectives: [
    { directive: RdxTooltip,
      inputs:  ['open', 'defaultOpen', 'delay', 'closeDelay',
                'disabled', 'disableHoverablePopup'],
      outputs: ['openChange', 'onOpenChange'] },
  ],
})
export class NdsTooltip {}

@Directive({
  selector: 'button[ndsTooltipTrigger]',
  hostDirectives: [
    { directive: RdxTooltipTrigger,
      inputs: ['id', 'delay', 'closeDelay', 'closeOnClick'] },
  ],
})
export class NdsTooltipTrigger {}

@Directive({ selector: 'ng-template[ndsTooltipContent]' })
export class NdsTooltipContent {
  readonly side = input<TooltipSide>('top');
  readonly align = input<TooltipAlign>('center');
  readonly sideOffset = input(4, { transform: numberAttribute });
}`;

// `props.className` do conteúdo compartilhado ensina a acrescentar classe ao
// balão — o que aqui não existe: o balão é criado pelo componente dentro do
// portal, e quem escreve é dono do TEMPLATE, não do elemento. A
// extensibilidade real deste stack é o delay por gatilho e o conteúdo rico
// dentro do template.
const EXTENSIBILITY_CODE = `<!-- delay por gatilho: vence o do provider só neste botão -->
<span ndsTooltip>
  <button
    ndsTooltipTrigger
    ndsButton
    variant="ghost"
    size="icon"
    aria-label="Salvar"
    [delay]="0"
  >
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent side="bottom"
    ><span>Salvar</span
    ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
    ><kbd class="nds-kbd" data-slot="kbd">S</kbd
  ></ng-template>
</span>`;

const TOKENS_CODE = `/* Tokens que o balão consome */
:root {
  --primary: 0 0% 9%;              /* fundo do balão */
  --primary-foreground: 0 0% 98%;  /* texto do balão */
  --radius: 0.5rem;                /* base do --radius-sm do balão */
  --z-tooltip: 1070;               /* camada do portal */
}

/* Respiro, largura máxima e sombra moram em .nds-tooltip-content, na folha
   compartilhada. O posicionamento em pixels é escrito pelo primitivo em
   runtime — é dado virando posição, não CSS de autoria. */`;

const VARIANT_CODE = {
  default: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent>Salvar</ng-template>
</span>`,
  withShortcut: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent
    ><span>Salvar</span
    ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
    ><kbd class="nds-kbd" data-slot="kbd">S</kbd
  ></ng-template>
</span>`,
  longText: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>

  <ng-template ndsTooltipContent side="bottom"
    >Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo</ng-template
  >
</span>`,
  positioningSides: `@for (lado of ['top', 'right', 'bottom', 'left']; track lado) {
  <span ndsTooltip>
    <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="lado">
      {{ lado }}
    </button>

    <ng-template ndsTooltipContent [side]="lado">Tooltip {{ lado }}</ng-template>
  </span>
}`,
};

const COMPOSITION_CODE = {
  iconButtonWithShortcut: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent
    ><span>Salvar</span
    ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
    ><kbd class="nds-kbd" data-slot="kbd">S</kbd
  ></ng-template>
</span>`,
  formFieldHelp: `<div class="nds-cluster" data-spacing="xs">
  <label ndsLabel for="token-api">Token da API</label>

  <span ndsTooltip>
    <button
      ndsTooltipTrigger
      ndsButton
      variant="ghost"
      size="icon-sm"
      aria-label="Onde encontrar o token da API"
    >
      <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
    </button>

    <ng-template ndsTooltipContent side="right"
      >Gere em Configurações › Acesso › Tokens</ng-template
    >
  </span>
</div>

<input ndsInput id="token-api" placeholder="ndsk_..." />`,
  metricDescription: `<div ndsCard class="nds-p-4">
  <div ndsCardHeader>
    <div class="nds-cluster" data-spacing="xs">
      <span ndsCardTitle>LCP</span>

      <span ndsTooltip>
        <button ndsTooltipTrigger ndsButton variant="ghost" size="icon-sm" aria-label="O que é LCP">
          <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
        </button>

        <ng-template ndsTooltipContent>LCP — Largest Contentful Paint</ng-template>
      </span>
    </div>
  </div>

  <div ndsCardContent>
    <p class="nds-text-h3 nds-m-0">1,8 s</p>
  </div>
</div>`,
};

@Component({
  selector: 'nds-tooltip-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_TOOLTIP, NdsButton, NdsInput, NdsLabel,
    NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle, NgTemplateOutlet,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- Ícones do lucide desenhados à mão: o mapa do NdsButtonIcon não tem
         save, share, help nem info, e aqui todos são decorativos — quem nomeia
         o botão é o aria-label. -->
    <ng-template #tplIconeSalvar>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0"
      >
        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
        <path d="M7 3v4a1 1 0 0 0 1 1h7" />
      </svg>
    </ng-template>

    <ng-template #tplIconeExcluir>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </ng-template>

    <ng-template #tplIconeCompartilhar>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
      </svg>
    </ng-template>

    <ng-template #tplIconeAjuda>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    </ng-template>

    <ng-template #tplIconeInfo>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </ng-template>

    <!-- Do & Don't: os quatro quadros são TEXTO, não componente vivo.
         O "don't" do primeiro par é justamente um botão sem nome acessível —
         renderizá-lo de verdade colocaria uma violação de button-name dentro
         da própria página que ensina a evitá-la. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
        {{ uxIcone().good }}
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
        {{ uxIcone().bad }}
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-text-caption nds-text-muted-foreground">
        {{ uxTexto().good }}
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-text-caption nds-text-muted-foreground nds-italic">
        {{ uxTexto().bad }}
      </div>
    </ng-template>

    <!-- Variantes -->
    <ng-template #tplVarDefault>
      <span ndsTooltip>
        <button
          ndsTooltipTrigger
          ndsButton
          variant="ghost"
          size="icon"
          [attr.aria-label]="t('demonstration.labels.saveButton')"
        >
          <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
        </button>
        <ng-template ndsTooltipContent>{{ t('demonstration.labels.saveButton') }}</ng-template>
      </span>
    </ng-template>

    <ng-template #tplVarComAtalho>
      <span ndsTooltip>
        <button
          ndsTooltipTrigger
          ndsButton
          variant="ghost"
          size="icon"
          [attr.aria-label]="t('demonstration.labels.saveButton')"
        >
          <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
        </button>
        <ng-template ndsTooltipContent
          ><span>{{ t('demonstration.labels.saveButton') }}</span
          ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
          ><kbd class="nds-kbd" data-slot="kbd">S</kbd
        ></ng-template>
      </span>
    </ng-template>

    <ng-template #tplVarTextoLongo>
      <span ndsTooltip>
        <button ndsTooltipTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.shareButton') }}
        </button>
        <ng-template ndsTooltipContent side="bottom">{{ textoLongo() }}</ng-template>
      </span>
    </ng-template>

    <ng-template #tplVarLados>
      <div class="nds-grid nds-w-full" data-cols="2" data-spacing="xl">
        @for (lado of lados; track lado) {
          <span ndsTooltip>
            <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="lado">
              {{ lado }}
            </button>
            <ng-template ndsTooltipContent [side]="lado">Tooltip {{ lado }}</ng-template>
          </span>
        }
      </div>
    </ng-template>

    <!-- Composições -->
    <ng-template #tplCompAtalho>
      <span ndsTooltip>
        <button
          ndsTooltipTrigger
          ndsButton
          variant="ghost"
          size="icon"
          [attr.aria-label]="t('demonstration.labels.saveButton')"
        >
          <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
        </button>
        <ng-template ndsTooltipContent
          ><span>{{ t('demonstration.labels.saveButton') }}</span
          ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
          ><kbd class="nds-kbd" data-slot="kbd">S</kbd
        ></ng-template>
      </span>
    </ng-template>

    <ng-template #tplCompCampo>
      <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-spacing="xs">
          <label ndsLabel for="tooltip-token-api">{{ rotuloCampo() }}</label>
          <span ndsTooltip>
            <button
              ndsTooltipTrigger
              ndsButton
              variant="ghost"
              size="icon-sm"
              [attr.aria-label]="rotuloCampo()"
            >
              <ng-container [ngTemplateOutlet]="tplIconeAjuda" />
            </button>
            <ng-template ndsTooltipContent side="right">{{ ajudaCampo() }}</ng-template>
          </span>
        </div>
        <input ndsInput id="tooltip-token-api" placeholder="ndsk_..." />
      </div>
    </ng-template>

    <ng-template #tplCompMetrica>
      <div ndsCard class="nds-p-4 nds-w-full nds-max-w-xs">
        <div ndsCardHeader>
          <div class="nds-cluster" data-spacing="xs">
            <span ndsCardTitle>LCP</span>
            <span ndsTooltip>
              <button
                ndsTooltipTrigger
                ndsButton
                variant="ghost"
                size="icon-sm"
                [attr.aria-label]="metricaRotulo()"
              >
                <ng-container [ngTemplateOutlet]="tplIconeInfo" />
              </button>
              <ng-template ndsTooltipContent>{{ metricaTexto() }}</ng-template>
            </span>
          </div>
        </div>
        <div ndsCardContent>
          <p class="nds-text-h3 nds-m-0">1,8 s</p>
        </div>
      </div>
    </ng-template>

    <!-- O provider mora aqui, no elemento mais externo da página: é o exemplo
         vivo do que a anatomia manda fazer no root da app, e faz os tooltips
         desta página compartilharem uma espera só. -->
    <nds-docs-page-layout
      ndsTooltipProvider
      [delay]="300"
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="tooltip"
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
          <div class="nds-cluster" data-spacing="sm" data-justify="center">
            <span ndsTooltip (openChange)="aoAlternar('save', $event)">
              <button
                ndsTooltipTrigger
                ndsButton
                variant="ghost"
                size="icon"
                [attr.aria-label]="t('demonstration.labels.saveButton')"
              >
                <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
              </button>
              <ng-template ndsTooltipContent>{{ t('demonstration.labels.save') }}</ng-template>
            </span>

            <span ndsTooltip (openChange)="aoAlternar('delete', $event)">
              <button
                ndsTooltipTrigger
                ndsButton
                variant="ghost"
                size="icon"
                [attr.aria-label]="t('demonstration.labels.deleteButton')"
              >
                <ng-container [ngTemplateOutlet]="tplIconeExcluir" />
              </button>
              <ng-template ndsTooltipContent>{{ t('demonstration.labels.delete') }}</ng-template>
            </span>

            <span ndsTooltip (openChange)="aoAlternar('share', $event)">
              <button
                ndsTooltipTrigger
                ndsButton
                variant="ghost"
                size="icon"
                [attr.aria-label]="t('demonstration.labels.shareButton')"
              >
                <ng-container [ngTemplateOutlet]="tplIconeCompartilhar" />
              </button>
              <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.share') }}</ng-template>
            </span>
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
          [code]="importCode"
          [secondaryCode]="importCodeButton"
          componentSlug="tooltip"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="tooltip"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="tooltip"
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
          [extensibilityCode]="extensibilityCode"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCode"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="tooltip"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="tooltip"
        />

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
export class NdsTooltipDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeButton = IMPORT_CODE_BUTTON;
  protected readonly tokensCode = TOKENS_CODE;

  /** Os quatro lados, para o exemplo de posicionamento. */
  protected readonly lados = ['top', 'right', 'bottom', 'left'] as const;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarComAtalho = viewChild.required<TemplateRef<unknown>>('tplVarComAtalho');
  private readonly tplVarTextoLongo = viewChild.required<TemplateRef<unknown>>('tplVarTextoLongo');
  private readonly tplVarLados = viewChild.required<TemplateRef<unknown>>('tplVarLados');
  private readonly tplCompAtalho = viewChild.required<TemplateRef<unknown>>('tplCompAtalho');
  private readonly tplCompCampo = viewChild.required<TemplateRef<unknown>>('tplCompCampo');
  private readonly tplCompMetrica = viewChild.required<TemplateRef<unknown>>('tplCompMetrica');

  /**
   * Analytics de exibição.
   *
   * Sai do handler da página, não de dentro do primitivo: evento disparado por
   * componente de UI é o que a regra `analytics_in_ui_primitive` proíbe. O
   * payload leva o id do gatilho, valor estável — o texto traduzido viraria três
   * eventos diferentes no GA4, um por idioma.
   */
  protected aoAlternar(gatilho: string, isOpen: boolean): void {
    if (!isOpen) return;
    track('tooltip_view', {
      component: 'tooltip',
      trigger_id: gatilho,
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return stringsFromDict(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: stringsFromDict(d, 'usage.guidelines') };
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

  /**
   * Linhas da tabela de UX Writing.
   *
   * As chaves são nomeadas (`content`, `shortcut`, `icon`) e não `itemN`, então
   * a lista sai do próprio objeto do idioma: acrescentar uma quarta linha ao
   * conteúdo compartilhado passa a aparecer aqui sem editar este arquivo.
   */
  private readonly uxRows = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = tooltipTranslations as unknown as Record<
      string,
      { usage?: { uxWriting?: { table?: Record<string, unknown> } } }
    >;
    const tabela = byLocale[locale]?.usage?.uxWriting?.table ?? {};
    return Object.values(tabela).filter(
      (v): v is { name: string; format: string; good: string; bad: string } =>
        typeof v === 'object' && v !== null && 'name' in (v as object),
    );
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
      items: this.uxRows().map((l) => ({
        element: toPlainText(l.name),
        rules: toPlainText(l.format),
        do: toPlainText(l.good),
        dont: toPlainText(l.bad),
      })),
    };
  });

  /** Par "gatilho icon-only" da tabela de UX Writing — vira o Do & Don't 1. */
  protected readonly uxIcone = computed(() => {
    const line = this.uxRows().find((l) => /aria-label/i.test(l.format));
    return {
      good: toPlainText(line?.good ?? ''),
      bad: toPlainText(line?.bad ?? ''),
    };
  });

  /** Par "texto do balão" da tabela de UX Writing — vira o Do & Don't 2. */
  protected readonly uxTexto = computed(() => {
    const line = this.uxRows()[0];
    return {
      good: toPlainText(line?.good ?? ''),
      bad: toPlainText(line?.bad ?? ''),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: stringsFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: stringsFromDict(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  /**
   * Texto longo do exemplo.
   *
   * Sai da própria descrição do componente, e não de uma frase escrita aqui:
   * literal em português apareceria igual nas versões en e es da página. É
   * comprida o bastante para a quebra acontecer, que é o que a variante mostra.
   */
  protected readonly textoLongo = computed(() => {
    dict();
    return toPlainText(t('description'));
  });

  // Os três textos abaixo saem da entrada da composição no conteúdo
  // compartilhado. Não existe chave dedicada ao rótulo do campo nem ao nome do
  // botão de ajuda, e inventá-la em português deixaria a página trilíngue com
  // um pedaço só em pt-BR.
  protected readonly rotuloCampo = computed(() => {
    dict();
    return toPlainText(t('variants.compositions.formFieldHelp.name'));
  });

  protected readonly ajudaCampo = computed(() => {
    dict();
    return toPlainText(t('variants.compositions.formFieldHelp.description'));
  });

  protected readonly metricaRotulo = computed(() => {
    dict();
    return toPlainText(t('variants.compositions.metricDescription.name'));
  });

  protected readonly metricaTexto = computed(() => {
    dict();
    return toPlainText(t('variants.compositions.metricDescription.description'));
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.items.default'),
        description: t('variants.styles.default'),
        code: VARIANT_CODE.default,
        trackId: 'default',
        preview: this.tplVarDefault(),
      },
      {
        name: t('variants.items.withShortcut'),
        description: t('variants.styles.withShortcut'),
        code: VARIANT_CODE.withShortcut,
        trackId: 'withShortcut',
        preview: this.tplVarComAtalho(),
      },
      {
        name: t('variants.items.longText'),
        description: t('variants.styles.longText'),
        code: VARIANT_CODE.longText,
        trackId: 'longText',
        preview: this.tplVarTextoLongo(),
      },
      {
        name: t('variants.items.positioningSides.name'),
        // Mesmo formato que o container de Composições monta para o `useWhen`:
        // a seção de Variantes não tem esse campo, e o texto de "quando usar"
        // do conteúdo compartilhado não pode simplesmente sumir.
        description:
          `${t('variants.items.positioningSides.description')}<br><br>` +
          `<strong>${tNav('common.useWhen')}</strong> ` +
          `${t('variants.items.positioningSides.use')}`,
        code: VARIANT_CODE.positioningSides,
        trackId: 'positioningSides',
        preview: this.tplVarLados(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: {
      key: 'iconButtonWithShortcut' | 'formFieldHelp' | 'metricDescription';
      tpl: TemplateRef<unknown>;
    }[] = [
      { key: 'iconButtonWithShortcut', tpl: this.tplCompAtalho()  },
      { key: 'formFieldHelp',          tpl: this.tplCompCampo()   },
      { key: 'metricDescription',      tpl: this.tplCompMetrica() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code: COMPOSITION_CODE[key],
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
    // `states.delayed` fica de fora: ele descreve `data-state="delayed-open"`,
    // que este stack não emite — durante a espera não existe balão nenhum no
    // DOM, então não há atributo a inspecionar. Documentar seria descrever um
    // gancho de CSS que não vai casar.
    return ['closed', 'open', 'hover', 'focus'].map((k) => ({
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
    const not = tNav('common.no');
    return [
      {
        title: 'NdsTooltipProvider',
        cols,
        items: [
          {
            name: 'delay',
            type: 'number',
            // 600 e não 0: sem valor no provider, o primitivo cai na
            // configuração global do Radix NG, que é 600 ms.
            defaultValue: '600',
            required: not,
            description: toPlainText(t('props.table.delay.description')),
          },
        ],
      },
      {
        title: 'NdsTooltip',
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.open.description')),
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: t('props.table.defaultOpen.default'),
            required: not,
            description: toPlainText(t('props.table.defaultOpen.description')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onOpenChange.description')),
          },
        ],
      },
      {
        title: 'NdsTooltipContent',
        cols,
        items: [
          {
            name: 'side',
            type: t('props.table.side.type'),
            defaultValue: t('props.table.side.default'),
            required: not,
            description: toPlainText(t('props.table.side.description')),
          },
          {
            name: 'align',
            type: t('props.table.align.type'),
            defaultValue: t('props.table.align.default'),
            required: not,
            description: toPlainText(t('props.table.align.description')),
          },
          {
            name: 'sideOffset',
            type: 'number',
            defaultValue: t('props.table.sideOffset.default'),
            required: not,
            description: toPlainText(t('props.table.sideOffset.description')),
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
    // `tokens.table.fill` (cor da seta) fica de fora: este stack não compõe a
    // Arrow — ver a nota no fim de components/ui/tooltip.ts.
    return [
      { token: '--primary',            className: 'nds-tooltip-content',    k: 'foreground' },
      { token: '--primary-foreground', className: 'nds-tooltip-content',    k: 'background' },
      { token: '--radius-sm',          className: 'nds-tooltip-content',    k: 'radius'     },
      { token: '--z-tooltip',          className: 'nds-tooltip-positioner', k: 'zIndex'     },
    ].map(({ token, className, k }) => ({
      token,
      value: className,
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return stringsFromDict(d, 'accessibility.items');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = tooltipTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const bloco = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista.
    return Object.entries(bloco).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { k: 'popover',   path: '?path=/docs/ui-popover--docs'    },
      { k: 'hoverCard', path: '?path=/docs/ui-hover-card--docs' },
      { k: 'button',    path: '?path=/docs/ui-button--docs'     },
      { k: 'kbd',       path: '?path=/docs/ui-kbd--docs'        },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    // `notes.item1` lista as libs de React, Vue, Svelte e Vanilla. Não entra:
    // cada stack lê a própria documentação isolada, e citar as outras pelo nome
    // vaza comparação cross-stack (regra da raiz) — além de não valer aqui, que
    // roda em @radix-ng/primitives.
    return stringsFromDict(d, 'notes').slice(1).map((content) => ({ title: '', content }));
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
    return [
      {
        // O nome do evento é identificador do GA4, não texto de tela: fica
        // igual nos três idiomas de propósito.
        event: 'tooltip_view',
        trigger: toPlainText(t('analytics.table.tooltip_view.trigger')),
        payload: toPlainText(t('analytics.table.tooltip_view.payload')),
      },
    ];
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
        result: toPlainText(r.result),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    // Aqui os itens são frases soltas, não objetos com critério/nível/como —
    // o formato varia entre componentes. O nível e a ferramenta são fixos
    // porque são identificadores (número de critério WCAG, nome do verificador),
    // e identificador não se traduz.
    const levels = ['AA', '1.4.3', '4.1.2', '4.1.2', '1.1.1'];
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: stringsFromDict(d, 'testes.accessibility').map((criterion, i) => ({
        criterion: toPlainText(criterion),
        level: levels[i] ?? 'AA',
        how: 'axe-core',
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
        componentSlug: 'tooltip',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'tooltip',
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
          component_name: 'tooltip',
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

/**
 * `base.item1`, `base.item2`, … enquanto existirem.
 *
 * Contar à mão (`[1, 2, 3, 4].map(...)`) trava a lista no tamanho de hoje: o
 * conteúdo compartilhado ganha um item e ele some da página, ou perde um e a
 * chave crua aparece na tela.
 */
function stringsFromDict(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
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
