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
// `props.extensibilityNotes` não existe no conteúdo compartilhado: é nota
// própria desta stack. A tabela de propriedades tem uma linha a menos que a
// das outras quatro porque `className` não existe aqui, e o motivo vivia só
// num comentário de `ui/tooltip.ts` — invisível para quem lê a docs page.
const { t, dict } = useTranslation(tooltipTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.extensibilityNotes':
      'Não há propriedade de classe no balão. O conteúdo é declarado como <code>ng-template</code> e o elemento do balão é criado e destruído pelo portal, então quem escreve o template não é dono desse elemento. Classe extra ali seria API nova: enquanto não houver caso concreto, o balão carrega apenas a classe do design system.',
  },
  en: {
    'props.extensibilityNotes':
      'There is no class property on the bubble. The content is declared as an <code>ng-template</code> and the bubble element is created and destroyed by the portal, so whoever writes the template does not own that element. An extra class there would be new API: until there is a concrete case, the bubble carries only the design system class.',
  },
  es: {
    'props.extensibilityNotes':
      'No hay propiedad de clase en el globo. El contenido se declara como <code>ng-template</code> y el elemento del globo lo crea y destruye el portal, así que quien escribe la plantilla no es dueño de ese elemento. Una clase extra allí sería API nueva: mientras no haya un caso concreto, el globo lleva solo la clase del design system.',
  },
});

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
    variant="outline"
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
  <button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent>Salvar</ng-template>
</span>`,
  withShortcut: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">
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
  positioningSides: `@for (lado of lados(); track lado.side) {
  <span ndsTooltip>
    <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="lado.label">
      {{ lado.label }}
    </button>

    <ng-template ndsTooltipContent [side]="lado.side">Tooltip {{ lado.side }}</ng-template>
  </span>
}`,
};

// Os snippets das composições saem de FUNÇÃO, e não de constante de módulo: os
// dois últimos mostram textos que o preview renderiza a partir do conteúdo
// compartilhado, e constante congelaria o idioma da primeira leitura. Quem
// chama é o `compositionItems`, que já depende de `dict()`.
function buildCompositionCode(): Record<
  'actionBar' | 'iconButtonWithShortcut' | 'formFieldHelp' | 'metricDescription',
  string
> {
  return {
  actionBar: `<div ndsTooltipProvider [delay]="400" [skipDelay]="200" class="nds-cluster">
  @for (acao of acoes; track acao.id) {
    <span ndsTooltip>
      <button ndsTooltipTrigger ndsButton variant="outline" size="icon" [attr.aria-label]="acao.label">
        <svg ndsButtonIcon [kind]="acao.icon" aria-hidden="true"></svg>
      </button>
      <ng-template ndsTooltipContent side="bottom">{{ acao.texto }}</ng-template>
    </span>
  }
</div>`,
  iconButtonWithShortcut: `<span ndsTooltip>
  <button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
  </button>

  <ng-template ndsTooltipContent
    ><span>Salvar</span
    ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
    ><kbd class="nds-kbd" data-slot="kbd">S</kbd
  ></ng-template>
</span>`,
  formFieldHelp: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <label ndsLabel for="token-api">${t('demonstration.labels.apiTokenLabel')}</label>

    <span ndsTooltip>
      <button
        ndsTooltipTrigger
        ndsButton
        variant="outline"
        size="icon-sm"
        aria-label="${t('demonstration.labels.apiTokenHelp')}"
      >?</button>

      <ng-template ndsTooltipContent side="right"
        >${t('demonstration.labels.apiTokenHint')}</ng-template
      >
    </span>
  </div>

  <input ndsInput id="token-api" placeholder="ndsk_..." />
</div>`,
  metricDescription: `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster" data-spacing="sm">
    <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
      ${t('demonstration.labels.lcpLabel')}
    </p>

    <span ndsTooltip>
      <button
        ndsTooltipTrigger
        ndsButton
        variant="outline"
        size="icon-sm"
        aria-label="${t('demonstration.labels.lcpHelp')}"
      >i</button>

      <ng-template ndsTooltipContent>${t('demonstration.labels.lcpHint')}</ng-template>
    </span>
  </div>

  <p class="nds-text-h3 nds-m-0">${t('demonstration.labels.lcpValue')}</p>
</div>`,
  };
}

@Component({
  selector: 'nds-tooltip-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_TOOLTIP, NdsButton, NdsInput, NdsLabel, NgTemplateOutlet,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport,
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

    <!-- Do & Don't: os quatro quadros são componente VIVO, e não texto — o
         leitor passa o ponteiro e vê o balão que cada quadro defende ou
         desaconselha. O "don't" do primeiro par carrega aria-label mesmo
         sendo anti-padrão: sem ele o botão icon-only não teria nome acessível
         e a própria página que ensina a evitá-lo reprovaria em button-name. A
         lição vive no CONTEÚDO do balão. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-cluster nds-w-full nds-min-h-20" data-justify="center" data-align="center">
        <span ndsTooltip (openChange)="aoAlternar('docs_do_dont', 'pair1-do', $event)">
          <button ndsTooltipTrigger ndsButton variant="outline" size="icon" [attr.aria-label]="t('demonstration.labels.saveButton')">
            <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
          </button>
          <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.save') }}</ng-template>
        </span>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-cluster nds-w-full nds-min-h-20" data-justify="center" data-align="center">
        <!-- Anti-padrão didático: o balão no lugar do rótulo. O aria-label fica
             para o axe — sem ele o botão icon-only não tem nome acessível e a
             docs page reprova —, e a lição continua no CONTEUDO do balão, que
             só repete o rótulo em vez de acrescentar. -->
        <span ndsTooltip (openChange)="aoAlternar('docs_do_dont', 'pair1-dont', $event)">
          <button ndsTooltipTrigger ndsButton variant="outline" size="icon" [attr.aria-label]="t('demonstration.labels.saveButton')">
            <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
          </button>
          <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.saveButton') }}</ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-cluster nds-w-full nds-min-h-20" data-justify="center" data-align="center">
        <span ndsTooltip (openChange)="aoAlternar('docs_do_dont', 'pair2-do', $event)">
          <button ndsTooltipTrigger ndsButton variant="outline" size="icon" [attr.aria-label]="t('demonstration.labels.saveButton')">
            <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
          </button>
          <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.save') }}</ng-template>
        </span>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-cluster nds-w-full nds-min-h-20" data-justify="center" data-align="center">
        <!-- Vivo de propósito: a lição é o TAMANHO do balão, e só renderizado
             ele mostra o que o texto longo faz. -->
        <span ndsTooltip (openChange)="aoAlternar('docs_do_dont', 'pair2-dont', $event)">
          <button ndsTooltipTrigger ndsButton variant="outline" size="icon" [attr.aria-label]="t('demonstration.labels.saveButton')">
            <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
          </button>
          <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.longBalloonDont') }}</ng-template>
        </span>
      </div>
    </ng-template>

    <!-- Variantes -->
    <ng-template #tplVarDefault>
      <span ndsTooltip (openChange)="aoAlternar('docs_variantes', 'default', $event)">
        <button
          ndsTooltipTrigger
          ndsButton
          variant="outline"
          size="icon"
          [attr.aria-label]="t('demonstration.labels.saveButton')"
        >
          <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
        </button>
        <ng-template ndsTooltipContent>{{ t('demonstration.labels.saveButton') }}</ng-template>
      </span>
    </ng-template>

    <ng-template #tplVarComAtalho>
      <span ndsTooltip (openChange)="aoAlternar('docs_variantes', 'withShortcut', $event)">
        <button
          ndsTooltipTrigger
          ndsButton
          variant="outline"
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
      <span ndsTooltip (openChange)="aoAlternar('docs_variantes', 'longText', $event)">
        <button ndsTooltipTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.shareButton') }}
        </button>
        <ng-template ndsTooltipContent side="bottom">{{ textoLongo() }}</ng-template>
      </span>
    </ng-template>

    <ng-template #tplVarLados>
      <div class="nds-grid nds-w-full nds-min-h-40" data-cols="4" data-spacing="xl">
        @for (lado of lados(); track lado.side) {
          <span ndsTooltip (openChange)="aoAlternar('docs_variantes', 'positioningSides-' + lado.side, $event)">
            <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="lado.label">
              {{ lado.label }}
            </button>
            <ng-template ndsTooltipContent [side]="lado.side">Tooltip {{ lado.side }}</ng-template>
          </span>
        }
      </div>
    </ng-template>

    <!-- Composições -->
    <ng-template #tplCompBarraAcoes>
      <div class="nds-cluster" data-spacing="lg" data-justify="center" data-align="center">
              <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'actionBar-save', $event)">
                <button
                  ndsTooltipTrigger
                  ndsButton
                  variant="outline"
                  size="icon"
                  [attr.aria-label]="t('demonstration.labels.saveButton')"
                >
                  <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
                </button>
                <ng-template ndsTooltipContent>{{ t('demonstration.labels.save') }}</ng-template>
              </span>
  
              <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'actionBar-delete', $event)">
                <button
                  ndsTooltipTrigger
                  ndsButton
                  variant="outline"
                  size="icon"
                  [attr.aria-label]="t('demonstration.labels.deleteButton')"
                >
                  <ng-container [ngTemplateOutlet]="tplIconeExcluir" />
                </button>
                <ng-template ndsTooltipContent>{{ t('demonstration.labels.delete') }}</ng-template>
              </span>
  
              <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'actionBar-share', $event)">
                <button
                  ndsTooltipTrigger
                  ndsButton
                  variant="outline"
                  size="icon"
                  [attr.aria-label]="t('demonstration.labels.shareButton')"
                >
                  <ng-container [ngTemplateOutlet]="tplIconeCompartilhar" />
                </button>
                <ng-template ndsTooltipContent side="bottom">{{ t('demonstration.labels.share') }}</ng-template>
              </span>
      </div>
    </ng-template>
    <ng-template #tplCompAtalho>
      <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'iconButtonWithShortcut', $event)">
        <button
          ndsTooltipTrigger
          ndsButton
          variant="outline"
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
        <div class="nds-cluster" data-spacing="sm">
          <label ndsLabel for="tooltip-token-api">{{ t('demonstration.labels.apiTokenLabel') }}</label>
          <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'formFieldHelp', $event)">
            <!-- Glifo de texto, e não ícone: é o que as outras quatro mostram
                 neste cartão, e um "?" desenhado dispensa entrada nova no mapa
                 de ícones de botão. Quem nomeia o botão é o aria-label. -->
            <button
              ndsTooltipTrigger
              ndsButton
              variant="outline"
              size="icon-sm"
              [attr.aria-label]="t('demonstration.labels.apiTokenHelp')"
            >
              ?
            </button>
            <ng-template ndsTooltipContent side="right">{{ t('demonstration.labels.apiTokenHint') }}</ng-template>
          </span>
        </div>
        <input ndsInput id="tooltip-token-api" placeholder="ndsk_..." />
      </div>
    </ng-template>

    <!-- Sem cartão: a composição é a MÉTRICA com balão de explicação, e as
         outras quatro stacks a mostram solta. O cartão daqui era moldura extra
         que nenhuma outra tinha. -->
    <ng-template #tplCompMetrica>
      <div class="nds-stack" data-spacing="xs">
        <div class="nds-cluster" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
            {{ t('demonstration.labels.lcpLabel') }}
          </p>
          <span ndsTooltip (openChange)="aoAlternar('docs_composicoes', 'metricDescription', $event)">
            <button
              ndsTooltipTrigger
              ndsButton
              variant="outline"
              size="icon-sm"
              [attr.aria-label]="t('demonstration.labels.lcpHelp')"
            >
              i
            </button>
            <ng-template ndsTooltipContent>{{ t('demonstration.labels.lcpHint') }}</ng-template>
          </span>
        </div>
        <p class="nds-text-h3 nds-m-0">{{ t('demonstration.labels.lcpValue') }}</p>
      </div>
    </ng-template>

    <!-- O provider mora aqui, no elemento mais externo da página: é o exemplo
         vivo do que a anatomia manda fazer no root da app, e faz os tooltips
         desta página compartilharem uma espera só. -->
    <nds-docs-page-layout
      ndsTooltipProvider
      [delay]="400"
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
          <!-- O MESMO exemplo do Playground da story — guideline 08 §15. Uma
               fonte, dois lugares. A barra de três ações que morava aqui virou
               a composição actionBar, que é o que ela sempre foi. Sem crase
               aqui: o template inteiro é um template literal, e crase o encerra.

               A moldura é a mesma das outras quatro: largura cheia, altura
               mínima para o balão caber sem empurrar a página, e centragem nos
               dois eixos. -->
          <div
            class="nds-cluster nds-w-full nds-min-h-30"
            data-justify="center"
            data-align="center"
            data-spacing="lg"
          >
            <span ndsTooltip (openChange)="aoAlternar('docs_demo', 'save', $event)">
              <button
                ndsTooltipTrigger
                ndsButton
                variant="outline"
                size="icon"
                [attr.aria-label]="t('demonstration.labels.saveButton')"
              >
                <ng-container [ngTemplateOutlet]="tplIconeSalvar" />
              </button>
              <ng-template ndsTooltipContent>{{ t('demonstration.labels.save') }}</ng-template>
            </span>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
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

        <!-- O container de COMPOSIÇÕES com id="variantes", como nas outras
             quatro: é ele que monta a linha "Quando usar:" a partir do campo
             useWhen, e a variante de posicionamento tem esse texto no conteúdo
             compartilhado. Com o container de Variantes a página montava a
             mesma linha na mão, com marcação escrita à unha. -->
        <nds-docs-compositions
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="tooltip"
          id="variantes"
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
          [extensibilityNotes]="t('props.extensibilityNotes')"
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
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeButton = IMPORT_CODE_BUTTON;
  protected readonly tokensCode = TOKENS_CODE;

  /**
   * Os quatro lados, para o exemplo de posicionamento.
   *
   * O rótulo do gatilho é texto de tela e sai de chave, como o resto da página;
   * o valor do atributo continua minúsculo, porque ele é da API e não se
   * traduz.
   */
  protected readonly lados = computed(() => {
    dict();
    return [
      { side: 'top'    as const, label: t('demonstration.labels.sideTop')    },
      { side: 'right'  as const, label: t('demonstration.labels.sideRight')  },
      { side: 'bottom' as const, label: t('demonstration.labels.sideBottom') },
      { side: 'left'   as const, label: t('demonstration.labels.sideLeft')   },
    ];
  });

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarComAtalho = viewChild.required<TemplateRef<unknown>>('tplVarComAtalho');
  private readonly tplVarTextoLongo = viewChild.required<TemplateRef<unknown>>('tplVarTextoLongo');
  private readonly tplVarLados = viewChild.required<TemplateRef<unknown>>('tplVarLados');
  private readonly tplCompBarraAcoes = viewChild.required<TemplateRef<unknown>>('tplCompBarraAcoes');
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
  /**
   * `tooltip_view` de QUALQUER seção que renderize um tooltip vivo.
   *
   * O `location` vem de quem chama, e não de constante: ele existe para dizer
   * de ONDE veio o evento, e cravá-lo em `docs_demo` fazia toda a página
   * responder a mesma coisa. Vocabulário na guideline 07 de analytics.
   *
   * E o alcance não era só o `location`: dos 10 tooltips VIVOS desta página,
   * só os 3 da demonstração disparavam evento. Variantes e Composições
   * renderizam o componente de verdade, e um hover ali é tão real quanto na
   * demo. O Do & Dont daqui não tem tooltip vivo — no vue e no svelte tem.
   */
  protected aoAlternar(location: string, trigger: string, isOpen: boolean): void {
    if (!isOpen) return;
    track('tooltip_view', { component: 'tooltip', trigger_id: trigger, location });
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
    const table = byLocale[locale]?.usage?.uxWriting?.table ?? {};
    return Object.values(table).filter(
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
   * Texto longo do balão da variante de texto longo.
   *
   * Ele saía de `t('description')` — a descrição do COMPONENTE, texto escrito
   * para quem LÊ a página. Recortada para dentro do balão, ela fazia o exemplo
   * exibir a explicação em vez do exemplo. Agora vem da chave de preview
   * `demonstration.labels.shareHint`, que é a mesma que as outras stacks leem.
   */
  protected readonly textoLongo = computed(() => {
    dict();
    return t('demonstration.labels.shareHint');
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
        description: t('variants.items.positioningSides.description'),
        // Quem monta a linha "Quando usar:" é o container — a concatenação de
        // `<br><br><strong>` que morava aqui duplicava, à mão, o que ele já faz.
        useWhen: t('variants.items.positioningSides.use'),
        code: VARIANT_CODE.positioningSides,
        trackId: 'positioningSides',
        preview: this.tplVarLados(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const code = buildCompositionCode();
    const mapa: {
      key: 'iconButtonWithShortcut' | 'actionBar' | 'formFieldHelp' | 'metricDescription';
      tpl: TemplateRef<unknown>;
    }[] = [
      { key: 'iconButtonWithShortcut', tpl: this.tplCompAtalho()  },
      { key: 'actionBar',              tpl: this.tplCompBarraAcoes() },
      { key: 'formFieldHelp',          tpl: this.tplCompCampo()   },
      { key: 'metricDescription',      tpl: this.tplCompMetrica() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code: code[key],
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
    // A linha de `tokens.table.fill` (cor da seta) ficava de fora com motivo
    // declarado — este stack não compunha a Arrow. Ele passou a compor em
    // 2026-09-04, e a exceção caiu junto: era das cinco a única tabela com
    // quatro linhas, e a única a mapear `--primary` para o balão em vez da seta.
    return [
      { token: '--primary',            className: 'nds-tooltip-content',    k: 'foreground' },
      { token: '--primary-foreground', className: 'nds-tooltip-content',    k: 'background' },
      { token: '--primary',            className: 'nds-tooltip-arrow',      k: 'fill'       },
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
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { k: 'popover',   path: '?path=/docs/components-overlay-popover--docs'    },
      { k: 'hoverCard', path: '?path=/docs/components-overlay-hovercard--docs' },
      { k: 'button',    path: '?path=/docs/components-form-button--docs'     },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    // As QUATRO notas entram, e o `.slice(1)` que descartava a primeira saiu.
    //
    // A exclusão tinha motivo escrito e verdadeiro quando foi feita: o
    // `notes.item1` de então listava as libs de React, Vue, Svelte e Vanilla, e
    // citar outra stack pelo nome vaza comparação cross-stack — regra da raiz.
    // O texto foi neutralizado depois, e hoje fala de comportamento e visual em
    // camadas separadas: atraso de abertura, exibição por foco, descarte por
    // Escape, posicionamento ancorado e ligação por `aria-describedby`. Tudo
    // isso vale aqui.
    //
    // Exclusão declarada precisa da premissa verificável, senão ela sobrevive ao
    // motivo — foi o que aconteceu: esta stack mostrava três notas e as outras
    // quatro, e o comentário defendia um texto que não existe mais.
    return stringsFromDict(d, 'notes').map((content) => ({ title: '', content }));
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
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/overlay' },
          { name: t('title') },
        ],
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
