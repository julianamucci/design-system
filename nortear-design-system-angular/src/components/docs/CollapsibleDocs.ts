import { NgTemplateOutlet } from '@angular/common';
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
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';
import { NdsButton } from '@/components/ui/button';
import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import collapsibleTranslations from '@shared/content/collapsible/translations.json';

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
const { t, dict } = useTranslation(collapsibleTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, não do conteúdo do componente:
// `collapsible/translations.json` não tem `nav.compositions`, e ler de lá
// deixaria a seção Composições com a própria chave impressa como título.
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

const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';

// A variante `angular` de `anatomy.structureCode` no conteúdo compartilhado
// descreve um elemento `<nds-collapsible>` que este stack não tem: as três
// peças são diretivas de ATRIBUTO sobre elementos nativos, para o markup bater
// com o do Vanilla e o CSS `.nds-collapsible` casar sem wrapper. Enquanto o
// conteúdo não for corrigido, a estrutura mostrada aqui é a que compila.
const ANATOMY_CODE = `<div ndsCollapsible [(open)]="aberto">
  <button ndsCollapsibleTrigger ndsButton variant="ghost">
    Exibir detalhes
  </button>

  <div ndsCollapsiblePanel>
    <!-- conteúdo colapsável -->
  </div>
</div>`;

const IMPORT_CODE = `import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';

// ou, peça a peça:
import {
  NdsCollapsible,
  NdsCollapsibleTrigger,
  NdsCollapsiblePanel,
} from '@/components/ui/collapsible';`;

const IMPORT_CODE_BUTTON = `import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_COLLAPSIBLE, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// As três peças compõem os primitivos do Radix NG.
@Directive({
  selector: 'div[ndsCollapsible]',
  hostDirectives: [
    { directive: RdxCollapsibleRootDirective,
      inputs:  ['open', 'defaultOpen', 'panelId'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsCollapsible {}

@Directive({
  selector: 'button[ndsCollapsibleTrigger]',
  hostDirectives: [RdxCollapsibleTriggerDirective],
})
export class NdsCollapsibleTrigger {}

@Directive({
  selector: 'div[ndsCollapsiblePanel]',
  hostDirectives: [
    // id       — id explícito do painel; o trigger aponta para ele
    // keepMounted      — mantém o elemento no DOM enquanto fechado
    // hiddenUntilFound — usa hidden="until-found", achável pela busca do navegador
    { directive: RdxCollapsiblePanelDirective,
      inputs: ['id', 'keepMounted', 'hiddenUntilFound'] },
  ],
})
export class NdsCollapsiblePanel {}`;

// `props.extensibility` do conteúdo compartilhado ensina `className` e o repasse
// de comportamento para um filho — nenhum dos dois existe aqui: o Angular já
// mescla a classe escrita no elemento, e o trigger É o botão, não o pai dele.
// A extensibilidade real deste stack é escrever as duas diretivas no mesmo
// `<button>`.
const EXTENSIBILITY_CODE = `<!-- O trigger e o botão do design system são o MESMO elemento.
     A classe escrita aqui convive com a que o componente declara. -->
<button
  ndsCollapsibleTrigger
  ndsButton
  variant="ghost"
  class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
  data-justify="between"
>
  <span>Exibir filtros avançados</span>
</button>`;

const TOKENS_CODE = `/* Tokens que o painel e o trigger consomem */
:root {
  --border: 214 32% 91%;    /* borda do painel */
  --muted: 210 40% 96%;     /* fundo do painel */
  --radius: 0.5rem;         /* raio do painel */
  --accent: 210 40% 96%;    /* fundo do trigger em hover */
  --ring: 222 47% 11%;      /* anel de foco do trigger */
}

/* A animação de altura mora em .nds-collapsible e lê a medida que o
   primitivo publica em --collapsible-panel-height. */`;

const VARIANT_CODE = {
  uncontrolled: `<div ndsCollapsible class="nds-w-full nds-max-w-sm" [defaultOpen]="false">
  <button
    ndsCollapsibleTrigger
    ndsButton
    variant="ghost"
    class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
    data-justify="between"
  >
    <span>Exibir filtros avançados</span>
    <svg class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron" aria-hidden="true">…</svg>
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <p>Filtro avançado 1</p>
  </div>
</div>`,
  controlled: `aberto = signal(false);

<div ndsCollapsible class="nds-w-full" [open]="aberto()" (openChange)="aberto.set($event)">
  <button
    ndsCollapsibleTrigger
    ndsButton
    variant="ghost"
    class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
    data-justify="between"
    [attr.aria-label]="aberto() ? 'Ocultar filtros avançados' : 'Exibir filtros avançados'"
  >
    <span>{{ aberto() ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}</span>
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <p>Filtro avançado 1</p>
  </div>
</div>`,
  customButton: `<div ndsCollapsible class="nds-w-full nds-max-w-sm">
  <button ndsCollapsibleTrigger ndsButton variant="outline">
    Exibir opções avançadas
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <p>Opção avançada 1</p>
    <p>Opção avançada 2</p>
  </div>
</div>`,
};

const COMPOSITION_CODE = {
  iconTrigger: `<div ndsCollapsible class="nds-w-full nds-max-w-sm">
  <button ndsCollapsibleTrigger ndsButton variant="outline">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
    Filtros avançados
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <p>Filtro por categoria</p>
  </div>
</div>`,
  rotatingChevron: `<!-- A rotação é 100% CSS: .nds-chevron gira sob [data-state="open"]
     e sob [aria-expanded="true"], os dois presentes no trigger. -->
<div ndsCollapsible class="nds-w-full nds-max-w-sm">
  <button
    ndsCollapsibleTrigger
    ndsButton
    variant="outline"
    class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
    data-justify="between"
  >
    <span>Configurações avançadas</span>
    <svg class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron" aria-hidden="true">…</svg>
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Notificações</span>
      <span class="nds-font-medium">Ativadas</span>
    </div>
  </div>
</div>`,
  richContent: `<div ndsCollapsible class="nds-w-full nds-max-w-sm">
  <button ndsCollapsibleTrigger ndsButton variant="outline">
    <svg class="nds-icon nds-shrink-0" aria-hidden="true">…</svg>
    Configurações do sistema
  </button>

  <div ndsCollapsiblePanel class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-stack nds-mt-2" data-spacing="sm">
    <div class="nds-cluster" data-spacing="sm">
      <button ndsCheckbox id="depuracao"></button>
      <label ndsLabel for="depuracao">Habilitar modo de depuração</label>
    </div>
  </div>
</div>`,
};

@Component({
  selector: 'nds-collapsible-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    // `NgTemplateOutlet` faltava e a página inteira renderizava mesmo assim: o
    // `[ngTemplateOutlet]` virava um binding para propriedade inexistente de
    // `<ng-container>` — NG0303 no console, nenhum erro de compilação, e as dez
    // setas de expansão dos previews simplesmente não apareciam. O `tsc` não
    // valida template Angular, então só o log do teste denunciava.
    NgTemplateOutlet,
    ...NDS_COLLAPSIBLE, NdsButton, NdsCheckbox, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- Chevron do lucide desenhado à mão: o mapa do NdsButtonIcon não tem
         chevron-down, e o ícone aqui é decorativo — o estado quem conta é o
         aria-expanded. -->
    <ng-template #tplChevron>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </ng-template>

    <ng-template #tplDoDont1Do>
      <div ndsCollapsible class="nds-w-full nds-max-w-xs">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
          data-justify="between"
        >
          <span>{{ t('demonstration.labels.triggerClosed') }}</span>
          <ng-container [ngTemplateOutlet]="tplChevron" />
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O "don't" é o rótulo genérico. O aria-label mantém um nome acessível
           no controle (axe: button-name) sem alterar o pixel do exemplo. -->
      <div ndsCollapsible class="nds-w-full nds-max-w-xs">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
          data-justify="between"
          [attr.aria-label]="rotuloGenerico()"
        >
          <span>{{ rotuloGenerico() }}</span>
          <ng-container [ngTemplateOutlet]="tplChevron" />
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsCollapsible class="nds-w-full nds-max-w-xs">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
          data-justify="between"
        >
          <span>{{ t('demonstration.labels.headerLabel') }}</span>
          <ng-container [ngTemplateOutlet]="tplChevron" />
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="sm">
        @for (section of secoesRepetidas(); track section.id) {
          <div ndsCollapsible class="nds-w-full">
            <button
              ndsCollapsibleTrigger
              ndsButton
              variant="ghost"
              class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
              data-justify="between"
            >
              <span>{{ section.label }}</span>
              <ng-container [ngTemplateOutlet]="tplChevron" />
            </button>
            <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
              <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
            </div>
          </div>
        }
      </div>
    </ng-template>

    <ng-template #tplVarUncontrolled>
      <div ndsCollapsible class="nds-w-full nds-max-w-sm" [defaultOpen]="false">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
          data-justify="between"
        >
          <span>{{ t('demonstration.labels.triggerClosed') }}</span>
          <ng-container [ngTemplateOutlet]="tplChevron" />
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
          <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarControlled>
      <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <div ndsCollapsible
          class="nds-w-full"
          [open]="varControlado()"
          (openChange)="varControlado.set($event)"
        >
          <button
            ndsCollapsibleTrigger
            ndsButton
            variant="ghost"
            class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
            data-justify="between"
            [attr.aria-label]="rotuloAlternado(varControlado())"
          >
            <span>{{ rotuloAlternado(varControlado()) }}</span>
            <ng-container [ngTemplateOutlet]="tplChevron" />
          </button>
          <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
            <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
            <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarCustomButton>
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.triggerClosed') }}
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
          <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompIconTrigger>
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
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
            <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
          </svg>
          {{ t('demonstration.labels.headerLabel') }}
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
          <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompRotatingChevron>
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="outline"
          class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
          data-justify="between"
        >
          <span>{{ t('demonstration.labels.headerLabel') }}</span>
          <ng-container [ngTemplateOutlet]="tplChevron" />
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
          <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompRichContent>
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
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
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ t('demonstration.labels.headerLabel') }}
        </button>
        <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
          @for (opcao of opcoesRicas(); track opcao.id) {
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox [id]="opcao.id"></button>
              <label ndsLabel [attr.for]="opcao.id">{{ opcao.label }}</label>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="collapsible"
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
          <div class="nds-stack nds-w-full" data-spacing="xl">
            <!-- Não-controlado -->
            <div ndsCollapsible
              class="nds-w-full nds-max-w-sm"
              (openChange)="aoAlternar('nao_controlado', $event)"
            >
              <button
                ndsCollapsibleTrigger
                ndsButton
                variant="ghost"
                class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
                data-justify="between"
              >
                <span>{{ t('demonstration.labels.headerLabel') }}</span>
                <ng-container [ngTemplateOutlet]="tplChevron" />
              </button>
              <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
                <p>{{ t('demonstration.labels.basicFilter') }}</p>
                <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
                <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
              </div>
            </div>

            <!-- Controlado -->
            <div ndsCollapsible
              class="nds-w-full nds-max-w-sm"
              [open]="demoControlado()"
              (openChange)="aoAlternarControlado($event)"
            >
              <button
                ndsCollapsibleTrigger
                ndsButton
                variant="ghost"
                class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
                data-justify="between"
                [attr.aria-label]="rotuloAlternado(demoControlado())"
              >
                <span>{{ rotuloAlternado(demoControlado()) }}</span>
                <ng-container [ngTemplateOutlet]="tplChevron" />
              </button>
              <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
                <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
                <p>{{ t('demonstration.labels.advancedFilter2') }}</p>
              </div>
            </div>

            <!-- Desabilitado -->
            <div ndsCollapsible class="nds-w-full nds-max-w-sm">
              <button
                ndsCollapsibleTrigger
                ndsButton
                variant="ghost"
                class="nds-cluster nds-w-full nds-px-4" data-spacing="md"
                data-justify="between"
                [disabled]="true"
              >
                <span>{{ t('demonstration.labels.headerLabel') }}</span>
                <ng-container [ngTemplateOutlet]="tplChevron" />
              </button>
              <div ndsCollapsiblePanel [class]="painelClasses" data-spacing="sm">
                <p>{{ t('demonstration.labels.advancedFilter1') }}</p>
              </div>
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withButton')"
          [secondaryCode]="importCodeButton"
          componentSlug="collapsible"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="collapsible"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="collapsible"
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
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="collapsible"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="collapsible"
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
export class NdsCollapsibleDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeButton = IMPORT_CODE_BUTTON;
  protected readonly tokensCode = TOKENS_CODE;
  protected readonly painelClasses = PANEL_CLASSES;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // Estado dos exemplos. São signals porque o `collapsible_toggle` sai do
  // handler, não do componente: analytics dentro de primitivo de UI é o que a
  // regra `analytics_in_ui_primitive` proíbe.
  protected readonly demoControlado = signal(false);
  protected readonly varControlado = signal(false);

  private readonly tplChevronRef = viewChild.required<TemplateRef<unknown>>('tplChevron');
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarUncontrolled = viewChild.required<TemplateRef<unknown>>('tplVarUncontrolled');
  private readonly tplVarControlled = viewChild.required<TemplateRef<unknown>>('tplVarControlled');
  private readonly tplVarCustomButton = viewChild.required<TemplateRef<unknown>>('tplVarCustomButton');
  private readonly tplCompIconTrigger = viewChild.required<TemplateRef<unknown>>('tplCompIconTrigger');
  private readonly tplCompRotatingChevron = viewChild.required<TemplateRef<unknown>>('tplCompRotatingChevron');
  private readonly tplCompRichContent = viewChild.required<TemplateRef<unknown>>('tplCompRichContent');

  /** O chevron é reaproveitado por sete exemplos — um template só, sete usos. */
  protected readonly tplChevron = this.tplChevronRef;

  /**
   * Rótulo alternado pelo estado, que é a regra do primeiro "do".
   *
   * `String(...)` e afins não existem numa expressão de template Angular, então
   * a escolha mora aqui e o template só chama o método.
   */
  protected rotuloAlternado(isOpen: boolean): string {
    return isOpen
      ? t('demonstration.labels.triggerOpen')
      : t('demonstration.labels.triggerClosed');
  }

  /**
   * Rótulo ruim do primeiro "don't": a primeira palavra do rótulo bom, sem o
   * objeto. Derivar do conteúdo traduzido evita literal em português numa
   * página trilíngue.
   */
  protected readonly rotuloGenerico = computed(() => {
    dict();
    const completo = t('demonstration.labels.triggerClosed');
    return completo.split(' ')[0];
  });

  /** As três seções repetidas do segundo "don't" — o caso que pede Accordion. */
  protected readonly secoesRepetidas = computed(() => {
    dict();
    const base = t('demonstration.labels.headerLabel');
    return [1, 2, 3].map((i) => ({ id: `dd2-${i}`, label: `${base} ${i}` }));
  });

  /** Os três controles do exemplo de conteúdo rico. */
  protected readonly opcoesRicas = computed(() => {
    dict();
    return [
      { id: 'comp-rico-1', label: t('demonstration.labels.basicFilter') },
      { id: 'comp-rico-2', label: t('demonstration.labels.advancedFilter1') },
      { id: 'comp-rico-3', label: t('demonstration.labels.advancedFilter2') },
    ];
  });

  protected aoAlternar(qual: string, isOpen: boolean): void {
    track('collapsible_toggle', {
      // Valor estável, nunca o texto traduzido: o mesmo evento viraria três
      // valores no GA4, um por idioma.
      label: qual,
      value: isOpen ? 'open' : 'closed',
      location: 'docs_demo',
    });
  }

  protected aoAlternarControlado(isOpen: boolean): void {
    this.demoControlado.set(isOpen);
    this.aoAlternar('controlado', isOpen);
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`anatomy.item${i}`));
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

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: [1, 2, 3].map((i) => t(`usage.dont.item${i}`)) };
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

  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        // O conteúdo compartilhado guarda os dois modos como frase única
        // ("Modo controlado: estado externo…"). O nome é o trecho antes dos dois
        // pontos — trilíngue de graça, sem literal em português aqui.
        name: firstSegment(t('variants.items.uncontrolled')),
        description: stripHtml(t('variants.items.uncontrolled')),
        code: VARIANT_CODE.uncontrolled,
        trackId: 'uncontrolled',
        preview: this.tplVarUncontrolled(),
      },
      {
        name: firstSegment(t('variants.items.controlled')),
        description: stripHtml(t('variants.items.controlled')),
        code: VARIANT_CODE.controlled,
        trackId: 'controlled',
        preview: this.tplVarControlled(),
      },
      {
        name: t('variants.items.customButton.name'),
        description: t('variants.items.customButton.description'),
        code: VARIANT_CODE.customButton,
        trackId: 'customButton',
        preview: this.tplVarCustomButton(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: {
      key: 'iconTrigger' | 'rotatingChevron' | 'richContent';
      tpl: TemplateRef<unknown>;
    }[] = [
      { key: 'iconTrigger',     tpl: this.tplCompIconTrigger()     },
      { key: 'rotatingChevron', tpl: this.tplCompRotatingChevron() },
      { key: 'richContent',     tpl: this.tplCompRichContent()     },
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
    return ['closed', 'open', 'defaultOpen', 'disabled'].map((k) => ({
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
        title: t('props.collapsibleTitle'),
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.open')),
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.defaultOpen')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onOpenChange')),
          },
        ],
      },
      {
        title: t('props.triggerTitle'),
        cols,
        items: [
          {
            // `disabled` mora no botão porque é ele quem tem o atributo nativo.
            name: 'disabled',
            type: 'boolean (NdsButton)',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.disabled')),
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
      { token: '--border',  className: 'nds-border-default', k: 'border'       },
      { token: '--muted',   className: 'nds-bg-muted-soft',  k: 'background'   },
      // `.nds-rounded-md` lê `--radius-md`, não `--radius`.
      { token: '--radius-md', className: 'nds-rounded-md',   k: 'radius'       },
      // O trigger é um Button ghost: hover e foco vêm de `button.css`. O
      // utilitário `.nds-focus-ring` existe, mas não é ele que o trigger usa.
      { token: '--accent',  className: 'nds-button-ghost',   k: 'triggerHover' },
      { token: '--ring',    className: 'nds-button:focus-visible', k: 'triggerFocus' },
      // A transição de altura está no painel, não na raiz.
      { token: '--duration-base', className: 'nds-collapsible [data-slot="collapsible-content"]', k: 'transition' },
    ].map(({ token, className, k }) => ({
      token,
      value: className,
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
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space', description: toPlainText(t('accessibility.keyboard.space')) },
      { key: '—',     description: toPlainText(t('accessibility.keyboard.noArrow')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = collapsibleTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title`, quando existe, é o cabeçalho da seção e não uma linha da lista.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'Accordion', k: 'accordion', path: '?path=/docs/components-disclosure-accordion--docs' },
      { name: 'Sheet',     k: 'sheet',     path: '?path=/docs/components-overlay-sheet--docs'     },
      { name: 'Button',    k: 'button',    path: '?path=/docs/components-form-button--docs'    },
      { name: 'Tabs',      k: 'tabs',      path: '?path=/docs/components-navigation-tabs--docs'      },
    ].map(({ name, k, path }) => ({
      name,
      description: toPlainText(t(`related.${k}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // `tip2` e `tip3` do conteúdo compartilhado ensinam classes utilitárias que
    // não existem neste sistema (`[[data-state=open]_&]:rotate-180`,
    // `motion-reduce:transition-none`) — e o que elas pedem já está resolvido no
    // CSS compartilhado: `.nds-chevron` gira sozinho e `.nds-collapsible`
    // desliga a transição sob prefers-reduced-motion.
    return [{ title: '', content: t('notes.tip1') }];
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
        event: t('analytics.table.toggle'),
        trigger: toPlainText(t('analytics.table.toggleTrigger')),
        payload: toPlainText(t('analytics.table.togglePayload')),
      },
      {
        event: t('analytics.table.pageView'),
        trigger: toPlainText(t('analytics.table.pageViewTrigger')),
        payload: toPlainText(t('analytics.table.pageViewPayload')),
      },
      {
        event: t('analytics.table.sectionViewed'),
        trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
        payload: toPlainText(t('analytics.table.sectionViewedPayload')),
      },
      {
        event: t('analytics.table.langSwitch'),
        trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
        payload: toPlainText(t('analytics.table.langSwitchPayload')),
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
        componentSlug: 'collapsible',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'collapsible',
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
          component_name: 'collapsible',
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

/** Trecho antes dos dois pontos — "Modo controlado: estado externo…" → "Modo controlado". */
function firstSegment(frase: string): string {
  const limpo = stripHtml(frase);
  const corte = limpo.indexOf(':');
  return corte > 0 ? limpo.slice(0, corte).trim() : limpo;
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
