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
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_HOVER_CARD } from '@/components/ui/hover-card';
import { NDS_AVATAR } from '@/components/ui/avatar';
import uiTranslations from '@/i18n/ui.json';
import hoverCardTranslations from '@shared/content/hover-card/translations.json';

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

// Overrides do conteúdo compartilhado. Sobrou UM motivo, e ele é de API:
// `props.table.label` e `props.table.contentClass` são propriedades que só
// este stack tem — o painel nasce dentro do portal, então não existe elemento
// em que quem compõe escrevesse rótulo ou classe — e o conteúdo compartilhado
// não as descreve.
//
// Os outros dois overrides saíram daqui na revisão do componente: o conteúdo
// compartilhado descrevia a espera padrão de outra lib (700ms) e uma largura de
// 256px, e agora traz os 600ms e os 20rem que as cinco stacks aplicam de fato.
// Correção no compartilhado vale para as cinco; override valia só para esta.
const { t, dict } = useTranslation(hoverCardTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.label.description':
      'Nome acessível do painel. Sem ele, o nome vem do texto do gatilho.',
    'props.table.contentClass.description':
      'Classes extras do painel, para o que a folha do cartão não define.',
  },
  en: {
    'props.table.label.description':
      'Accessible name for the panel. Without it, the name comes from the trigger text.',
    'props.table.contentClass.description':
      'Extra classes for the panel, for whatever the card stylesheet does not set.',
  },
  es: {
    'props.table.label.description':
      'Nombre accesible del panel. Sin él, el nombre viene del texto del gatillo.',
    'props.table.contentClass.description':
      'Clases extra del panel, para lo que la hoja de la tarjeta no define.',
  },
});

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

const CLASSES_TRIGGER = 'nds-text-primary nds-font-medium nds-hover-underline';
// Botão sem moldura para gatilhos que não navegam (termo, métrica): as classes
// zeram o cromo nativo do `<button>` sem uma linha de CSS inline.
const CLASSES_TRIGGER_BUTTON =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

// As três peças são diretivas de ATRIBUTO sobre elementos nativos
// (`span[ndsHoverCard]`, `a|button[ndsHoverCardTrigger]`,
// `ng-template[ndsHoverCardContent]`), para o markup bater com o do Vanilla e o
// CSS `.nds-hover-card-*` casar sem wrapper. É a mesma estrutura que a variante
// `angular` de `anatomy.structureCode` mostra no conteúdo compartilhado.
const ANATOMY_CODE = `<p>
  Comentário de
  <span ndsHoverCard>
    <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">
      &#64;joana
    </a>

    <!-- O conteúdo é um template: o painel vive num portal no body, e
         declará-lo assim não deixa elemento nenhum no meio da frase. -->
    <ng-template ndsHoverCardContent side="bottom" align="start">
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <span ndsAvatar>
          <span ndsAvatarFallback aria-hidden="true">JS</span>
        </span>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body nds-font-medium">Joana Silva</p>
          <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
        </div>
      </div>
    </ng-template>
  </span>
  há 2 horas.
</p>`;

const IMPORT_CODE = `import { NDS_HOVER_CARD } from '@/components/ui/hover-card';

// ou, peça a peça:
import {
  NdsHoverCard,
  NdsHoverCardTrigger,
  NdsHoverCardContent,
} from '@/components/ui/hover-card';`;

const IMPORT_CODE_AVATAR = `import { NDS_HOVER_CARD } from '@/components/ui/hover-card';
import { NDS_AVATAR } from '@/components/ui/avatar';

@Component({
  imports: [...NDS_HOVER_CARD, ...NDS_AVATAR],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// As três peças compõem os primitivos do Radix NG (rdxPreviewCard*).
@Component({
  selector: 'span[ndsHoverCard]',
  hostDirectives: [
    { directive: RdxPreviewCardRoot,
      inputs:  ['open', 'defaultOpen'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsHoverCard {}

@Directive({
  selector: 'a[ndsHoverCardTrigger], button[ndsHoverCardTrigger]',
  hostDirectives: [
    // openDelay — espera antes de abrir, no ponteiro e no foco
    // closeDelay — espera antes de fechar depois que o ponteiro sai
    { directive: RdxPreviewCardTrigger,
      inputs: ['delay: openDelay', 'closeDelay', 'disabled'] },
  ],
})
export class NdsHoverCardTrigger {}

@Directive({ selector: 'ng-template[ndsHoverCardContent]' })
export class NdsHoverCardContent {
  side = input<HoverCardSide>('bottom');
  align = input<HoverCardAlign>('center');
  sideOffset = input(8);
  alignOffset = input(0);
  label = input('');         // nome acessível do painel
  contentClass = input('');  // classes extras do painel
}`;

// `props.extensibility` do conteúdo compartilhado ensina `className` no Content
// e `class` no `<ng-template>` — o primeiro não existe aqui, e o segundo é
// INERTE: um `<ng-template>` não renderiza elemento, então a classe escrita
// nele não chega a lugar nenhum. A extensibilidade real é o input `contentClass`.
const EXTENSIBILITY_CODE = `<!-- Espera curta, outro lado e uma classe no painel.
     A classe vai no INPUT, não no <ng-template>: o painel é criado dentro
     do portal, e não existe elemento em que escrevê-la. A largura, essa, vem
     da folha compartilhada — trocá-la pede uma regra própria (ver Tokens). -->
<span ndsHoverCard>
  <a
    ndsHoverCardTrigger
    href="/users/joana"
    class="nds-text-primary nds-font-medium"
    [openDelay]="500"
    [closeDelay]="200"
  >&#64;joana</a>

  <ng-template
    ndsHoverCardContent
    side="right"
    align="start"
    contentClass="nds-text-center"
  >
    <!-- conteúdo -->
  </ng-template>
</span>`;

const VARIANT_CODE = {
  default: `<span ndsHoverCard>
  <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">&#64;joana</a>

  <ng-template ndsHoverCardContent>
    <!-- conteúdo do cartão -->
  </ng-template>
</span>`,
  withDelay: `<span ndsHoverCard>
  <a
    ndsHoverCardTrigger
    href="/users/joana"
    class="nds-text-primary nds-font-medium"
    [openDelay]="500"
    [closeDelay]="200"
  >&#64;joana</a>

  <ng-template ndsHoverCardContent>
    <!-- conteúdo do cartão -->
  </ng-template>
</span>`,
  userProfile: `<span ndsHoverCard>
  <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">&#64;joana</a>

  <ng-template ndsHoverCardContent>
    <div class="nds-cluster" data-spacing="sm" data-align="start">
      <span ndsAvatar>
        <span ndsAvatarFallback aria-hidden="true">JS</span>
      </span>
      <div class="nds-stack" data-spacing="xs">
        <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
        <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
      </div>
    </div>
  </ng-template>
</span>`,
  linkPreview: `<span ndsHoverCard>
  <a
    ndsHoverCardTrigger
    href="https://design-system.dev"
    class="nds-text-primary nds-font-medium"
    [openDelay]="500"
  >design-system.dev</a>

  <ng-template ndsHoverCardContent>
    <div class="nds-stack" data-spacing="sm">
      <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
        <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
        <span class="nds-truncate">design-system.dev/overlays</span>
      </div>
      <p class="nds-text-body nds-font-medium">Guia de overlays acessíveis</p>
    </div>
  </ng-template>
</span>`,
  definitionTooltip: `<span ndsHoverCard>
  <!-- Botão, não link: não há para onde navegar. O glossário continua sendo
       o caminho alternativo obrigatório. -->
  <button
    ndsHoverCardTrigger
    class="nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0"
  >WCAG 2.2 AA</button>

  <ng-template ndsHoverCardContent>
    <div class="nds-stack" data-spacing="xs">
      <p class="nds-text-body nds-font-medium">WCAG 2.2 nível AA</p>
      <p class="nds-text-caption nds-text-muted-foreground">Definição em uma ou duas frases.</p>
    </div>
  </ng-template>
</span>`,
  metricExplainer: `<span ndsHoverCard>
  <button
    ndsHoverCardTrigger
    class="nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0"
  >LCP 1.8s</button>

  <ng-template ndsHoverCardContent>
    <div class="nds-stack" data-spacing="xs">
      <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
        <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
        <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
      </div>
      <p class="nds-text-caption nds-text-muted-foreground">Bom até 2,5s; ruim acima de 4s.</p>
    </div>
  </ng-template>
</span>`,
};

@Component({
  selector: 'nds-hover-card-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_HOVER_CARD, ...NDS_AVATAR, NgTemplateOutlet,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews do Do & Don't ──────────────────────────────────────────
         Estáticos de propósito: os dois lados de um par precisam ser
         DISTINGUÍVEIS lado a lado, e dois cartões fechados seriam idênticos na
         tela. O componente vivo está na demonstração e nas variantes. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack" data-spacing="xs">
        <p class="nds-text-body">
          <a href="?path=/docs/primitives-display-avatar--docs" [class]="classesGatilho">{{ mencao }}</a>
        </p>
        <p class="nds-text-caption nds-text-muted-foreground">
          {{ t('variants.items.userProfile.name') }} · /users/joana
        </p>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack" data-spacing="xs">
        <!-- Sem link nenhum: no toque, o conteúdo do cartão simplesmente não
             existe para quem lê. -->
        <p class="nds-text-body"><span [class]="classesGatilho">{{ mencao }}</span></p>
        <p class="nds-text-caption nds-text-muted-foreground nds-italic">
          {{ t('usage.dont.item3') }}
        </p>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <p class="nds-text-body nds-font-mono">openDelay = 500</p>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <p class="nds-text-body nds-font-mono">openDelay = 0</p>
    </ng-template>

    <!-- ── Previews das variantes ──────────────────────────────────────────
         Vivos e FECHADOS: o cartão é conteúdo sob demanda, e mostrá-lo aberto
         aqui cobriria a seção seguinte com um painel flutuante. Passe o cursor
         (ou o Tab) sobre a menção para abrir. -->
    <ng-template #tplVarDefault>
      <p class="nds-text-body">
        {{ t('demonstration.labels.userProfile') }}:
        <span ndsHoverCard>
          <a ndsHoverCardTrigger href="?path=/docs/primitives-display-avatar--docs" [class]="classesGatilho">{{ mencao }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </p>
    </ng-template>

    <ng-template #tplVarWithDelay>
      <p class="nds-text-body">
        {{ t('demonstration.labels.userProfile') }}:
        <span ndsHoverCard>
          <a
            ndsHoverCardTrigger
            href="?path=/docs/primitives-display-avatar--docs"
            [class]="classesGatilho"
            [openDelay]="500"
            [closeDelay]="200"
          >{{ mencao }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </p>
    </ng-template>

    <ng-template #tplVarUserProfile>
      <p class="nds-text-body">
        {{ t('usage.scenarios.item1.s') }}
        <span ndsHoverCard>
          <a ndsHoverCardTrigger href="?path=/docs/primitives-display-avatar--docs" [class]="classesGatilho">{{ mencao }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </p>
    </ng-template>

    <ng-template #tplVarLinkPreview>
      <p class="nds-text-body">
        {{ t('demonstration.labels.linkPreview') }}:
        <span ndsHoverCard>
          <a
            ndsHoverCardTrigger
            href="?path=/docs/primitives-layout-card--docs"
            [class]="classesGatilho"
            [openDelay]="500"
          >design-system.dev</a>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
                <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
                <span class="nds-truncate">design-system.dev/overlays</span>
              </div>
              <p class="nds-text-body nds-font-medium nds-leading-none">
                {{ t('related.items.popover.name') }} · {{ t('related.items.tooltip.name') }}
              </p>
              <p class="nds-text-caption nds-text-muted-foreground">{{ resumoLinkPreview() }}</p>
            </div>
          </ng-template>
        </span>
      </p>
    </ng-template>

    <ng-template #tplVarDefinition>
      <p class="nds-text-body">
        {{ t('demonstration.labels.definitionTooltip') }}:
        <span ndsHoverCard>
          <button ndsHoverCardTrigger [class]="classesGatilhoBotao">WCAG 2.2 AA</button>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 AA</p>
              <p class="nds-text-caption nds-text-muted-foreground">{{ resumoDefinicao() }}</p>
            </div>
          </ng-template>
        </span>
      </p>
    </ng-template>

    <ng-template #tplVarMetric>
      <p class="nds-text-body">
        {{ t('demonstration.labels.metricExplainer') }}:
        <span ndsHoverCard>
          <button ndsHoverCardTrigger [class]="classesGatilhoBotao">LCP 1.8s</button>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
                <!-- A cor semântica fica no número; a descrição segue na cor de
                     corpo, que é o que garante o contraste do texto corrido. -->
                <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">{{ resumoMetrica() }}</p>
            </div>
          </ng-template>
        </span>
      </p>
    </ng-template>

    <!-- O cartão de perfil é reaproveitado por três exemplos — um template só. -->
    <ng-template #cartaoPerfil>
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <span ndsAvatar>
          <!-- aria-hidden: o nome logo ao lado já identifica a pessoa. -->
          <span ndsAvatarFallback aria-hidden="true">JS</span>
        </span>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
          <p class="nds-text-caption nds-text-muted-foreground">{{ subtituloPerfil }}</p>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="hover-card"
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
          <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="lg">
            <p class="nds-text-body">
              {{ t('demonstration.labels.userProfile') }}:
              <span ndsHoverCard>
                <a ndsHoverCardTrigger href="?path=/docs/primitives-display-avatar--docs" [class]="classesGatilho">{{ mencao }}</a>
                <ng-template ndsHoverCardContent>
                  <ng-container [ngTemplateOutlet]="cartaoPerfil" />
                </ng-template>
              </span>
            </p>

            <p class="nds-text-body">
              {{ t('demonstration.labels.linkPreview') }}:
              <span ndsHoverCard>
                <a ndsHoverCardTrigger href="?path=/docs/primitives-layout-card--docs" [class]="classesGatilho">design-system.dev</a>
                <ng-template ndsHoverCardContent>
                  <div class="nds-stack" data-spacing="sm">
                    <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
                      <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
                      <span class="nds-truncate">design-system.dev/overlays</span>
                    </div>
                    <p class="nds-text-caption nds-text-muted-foreground">{{ resumoLinkPreview() }}</p>
                  </div>
                </ng-template>
              </span>
            </p>

            <p class="nds-text-body">
              {{ t('demonstration.labels.definitionTooltip') }}:
              <span ndsHoverCard>
                <button ndsHoverCardTrigger [class]="classesGatilhoBotao">WCAG 2.2 AA</button>
                <ng-template ndsHoverCardContent>
                  <p class="nds-text-caption nds-text-muted-foreground">{{ resumoDefinicao() }}</p>
                </ng-template>
              </span>
            </p>

            <p class="nds-text-body">
              {{ t('demonstration.labels.metricExplainer') }}:
              <span ndsHoverCard>
                <button ndsHoverCardTrigger [class]="classesGatilhoBotao">LCP 1.8s</button>
                <ng-template ndsHoverCardContent>
                  <p class="nds-text-caption nds-text-muted-foreground">{{ resumoMetrica() }}</p>
                </ng-template>
              </span>
            </p>
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
          [secondaryCode]="importCodeAvatar"
          componentSlug="hover-card"
          language="ts"
        />

        <nds-docs-compositions
          id="variantes"
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="hover-card"
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
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="hover-card"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="hover-card"
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
export class NdsHoverCardDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeAvatar = IMPORT_CODE_AVATAR;
  protected readonly classesGatilho = CLASSES_TRIGGER;
  protected readonly classesGatilhoBotao = CLASSES_TRIGGER_BUTTON;

  /**
   * A menção é dado de exemplo, não texto de interface: um `@` mais um nome
   * próprio se lê igual nos três idiomas, então fica fora do conteúdo
   * traduzido — o mesmo critério das outras stacks.
   */
  protected readonly mencao = '@joana';

  /**
   * Mesma linha das outras quatro stacks, propositalmente idêntica: a
   * regressão visual compara o mesmo cartão em cinco portas, e um texto
   * diferente viraria diferença sem que nada tivesse mudado.
   */
  protected readonly subtituloPerfil = 'Designer · 142 seguidores';

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarWithDelay = viewChild.required<TemplateRef<unknown>>('tplVarWithDelay');
  private readonly tplVarUserProfile = viewChild.required<TemplateRef<unknown>>('tplVarUserProfile');
  private readonly tplVarLinkPreview = viewChild.required<TemplateRef<unknown>>('tplVarLinkPreview');
  private readonly tplVarDefinition = viewChild.required<TemplateRef<unknown>>('tplVarDefinition');
  private readonly tplVarMetric = viewChild.required<TemplateRef<unknown>>('tplVarMetric');

  /** Primeira frase de uma descrição do conteúdo — cabe numa linha do cartão. */
  private primeiraFrase(key: string): string {
    const limpo = stripHtml(t(key));
    const corte = limpo.indexOf('.');
    return corte > 0 ? limpo.slice(0, corte + 1) : limpo;
  }

  protected readonly resumoLinkPreview = computed(() => {
    dict();
    return this.primeiraFrase('variants.items.linkPreview.description');
  });

  protected readonly resumoDefinicao = computed(() => {
    dict();
    return this.primeiraFrase('variants.items.definitionTooltip.description');
  });

  protected readonly resumoMetrica = computed(() => {
    dict();
    return this.primeiraFrase('variants.items.metricExplainer.description');
  });

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
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
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
      items: ['trigger', 'content', 'delay'].map((k) => ({
        element: t(`usage.uxWriting.table.${k}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)) };
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
        // As duas primeiras são configurações de TEMPO: o conteúdo compartilhado
        // guarda o nome em `variants.items` e a descrição em `variants.styles`.
        name: t('variants.items.default'),
        description: stripHtml(t('variants.styles.default')),
        code: VARIANT_CODE.default,
        trackId: 'default',
        preview: this.tplVarDefault(),
      },
      {
        name: t('variants.items.withDelay'),
        description: stripHtml(t('variants.styles.withDelay')),
        code: VARIANT_CODE.withDelay,
        trackId: 'withDelay',
        preview: this.tplVarWithDelay(),
      },
      ...(
        [
          { key: 'userProfile',       tpl: this.tplVarUserProfile()  },
          { key: 'linkPreview',       tpl: this.tplVarLinkPreview()  },
          { key: 'definitionTooltip', tpl: this.tplVarDefinition()   },
          { key: 'metricExplainer',   tpl: this.tplVarMetric()       },
        ] as const
      ).map(({ key, tpl }) => ({
        name: t(`variants.items.${key}.name`),
        description: t(`variants.items.${key}.description`),
        useWhen: t(`variants.items.${key}.use`),
        code: VARIANT_CODE[key],
        trackId: key,
        preview: tpl,
      })),
    ];
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
    return ['closed', 'open', 'controlled'].map((k) => ({
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
        title: 'NdsHoverCard',
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
        title: 'NdsHoverCardTrigger',
        cols,
        items: [
          {
            // Os delays moram no gatilho porque é ele quem os informa à raiz no
            // momento do ponteiro ou do foco — o padrão é 600ms, e não os 700ms
            // que o conteúdo compartilhado descreve para outra lib.
            name: 'openDelay',
            type: 'number',
            defaultValue: '600',
            required: not,
            description: toPlainText(t('props.table.openDelay.description')),
          },
          {
            name: 'closeDelay',
            type: 'number',
            defaultValue: t('props.table.closeDelay.default'),
            required: not,
            description: toPlainText(t('props.table.closeDelay.description')),
          },
        ],
      },
      {
        title: 'NdsHoverCardContent',
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
            name: 'label',
            type: 'string',
            defaultValue: '—',
            required: not,
            description: t('props.table.label.description'),
          },
          {
            name: 'contentClass',
            type: 'string',
            defaultValue: '—',
            required: not,
            description: t('props.table.contentClass.description'),
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
    // A coluna do meio traz a PROPRIEDADE CSS que consome o token, lida linha a
    // linha de `docs/shared/styles/nds/hover-card.css`. Todas moram em
    // `.nds-hover-card-content`, menos a camada, que é do positioner.
    return [
      { token: '--popover',            propriedade: 'background-color', k: 'background' },
      { token: '--popover-foreground', propriedade: 'color',            k: 'foreground' },
      { token: '--border',             propriedade: 'border',           k: 'border'     },
      { token: '--elevation-xl',       propriedade: 'box-shadow',       k: 'shadow'     },
      { token: '--radius',             propriedade: 'border-radius',    k: 'rounded'    },
      { token: '--spacing-4',          propriedade: 'padding',          k: 'padding'    },
      { token: '--hover-card-width',   propriedade: 'width',            k: 'width'      },
      { token: '--z-popover',          propriedade: 'z-index',          k: 'layer'      },
    ].map(({ token, propriedade, k }) => ({
      token,
      value: propriedade,
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [
      ...[1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.items.item${i}`)),
      // As três linhas de ARIA fecham a lista: o conteúdo compartilhado as
      // guarda num bloco próprio, e a seção genérica só tem uma lista.
      t('accessibility.aria.content'),
      t('accessibility.aria.expanded'),
      t('accessibility.aria.trigger'),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = hoverCardTranslations as unknown as Record<
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
      { k: 'tooltip',      path: '?path=/docs/primitives-overlay-tooltip--docs'      },
      { k: 'popover',      path: '?path=/docs/primitives-overlay-popover--docs'      },
      { k: 'dropdownMenu', path: '?path=/docs/primitives-overlay-dropdownmenu--docs' },
      { k: 'card',         path: '?path=/docs/primitives-layout-card--docs'         },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // `notes.item1` nomeia as libs das outras quatro stacks — citar stack por
    // nome dentro da doc de outra stack é justamente o que a convenção proíbe,
    // então a nota da lib fica de fora e as quatro restantes valem aqui sem
    // adaptação.
    return [2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: tNav('common.event'),
      trigger: tNav('common.eventTrigger'),
      payload: tNav('common.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // O conteúdo compartilhado do HoverCard não tem tabela de eventos, só a
    // descrição — e é ela que diz quais são e o que carregam. Nenhum evento
    // sai desta página: abrir um cartão é intenção baixa demais para virar
    // evento, e é o próprio conteúdo que recomenda usar o delay como filtro.
    return [
      {
        event: 'hover_card_open / hover_card_close',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component, location, label',
      },
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('states.closed.trigger')),
        payload: 'component_name, locale, page_title',
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
    dict();
    // Aqui os itens são frases soltas (e não objetos com critério/nível/como),
    // então o nível WCAG e a ferramenta de verificação vêm desta lista — sem
    // texto solto em português: são nomes de critério e de ferramenta.
    const lines: { level: string; how: string }[] = [
      { level: 'AA',     how: 'axe-core' },
      { level: '4.1.2',  how: 'Storybook Test' },
      { level: '1.4.13', how: 'Storybook Test' },
      { level: '1.4.13', how: 'Storybook Test' },
      { level: '1.4.3',  how: 'Storybook Test' },
      { level: 'AA',     how: 'Storybook Test' },
    ];
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: lines.map((line, i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i + 1}`)),
        level: line.level,
        how: line.how,
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
        componentSlug: 'hover-card',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'hover-card',
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
          component_name: 'hover-card',
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
