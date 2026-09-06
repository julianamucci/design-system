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
import type { RdxPreviewCardOpenChange } from '@radix-ng/primitives/preview-card';
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
        <span class="nds-truncate">design-system.dev</span>
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
      <p class="nds-text-body nds-font-medium">WCAG 2.2</p>
      <p class="nds-text-caption nds-text-muted-foreground">Definição em uma ou duas frases.</p>
    </div>
  </ng-template>
</span>`,
  metricExplainer: `<span ndsHoverCard>
  <button
    ndsHoverCardTrigger
    class="nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0"
  >3,42%</button>

  <ng-template ndsHoverCardContent>
    <div class="nds-stack" data-spacing="xs">
      <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
        <p class="nds-text-body nds-font-medium">Conversão (últimos 30d)</p>
        <span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>
      </div>
      <p class="nds-text-caption nds-text-muted-foreground">Cliques no CTA / usuários únicos</p>
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
         Os quatro são o componente VIVO e FECHADO (§15 da guideline 08):
         imitação em markup não recebe as classes reais, não responde a tema
         nem a densidade, e não dispara evento nenhum — a seção ficava
         invisível no GA4 tendo interação.

         O "don't" do par 1 mantém o DEFEITO: o gatilho é uma âncora SEM href,
         ou seja texto simples, sem papel de link e fora da ordem de tabulação.
         É ele que ensina — quem usa toque não tem para onde ir, e a
         informação do cartão fica inalcançável. O par 2 contrasta a espera de
         abertura, e cada lado carrega o valor que a legenda descreve.

         O par 1 NÃO declara espera: ali a lição é o gatilho, e o cartão usa o
         padrão do sistema (600ms para abrir, 300ms para fechar). Um valor
         curto ali demonstraria justamente o "dont" do par 2. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('par1-do', 'docs_do_dont', $event)">
          <a
            ndsHoverCardTrigger
            href="?path=/docs/components-display-avatar--docs"
            [class]="classesGatilho"
          >{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('par1-dont', 'docs_do_dont', $event)">
          <!-- Sem href de propósito: a diretiva de gatilho só casa com âncora e
               com botão, e uma âncora sem href não é link — não navega e não
               recebe foco. O defeito é justamente esse. -->
          <a
            ndsHoverCardTrigger
            [class]="classesGatilho"
          >{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('par2-do', 'docs_do_dont', $event)">
          <a
            ndsHoverCardTrigger
            href="?path=/docs/components-display-avatar--docs"
            [class]="classesGatilho"
            [openDelay]="500"
            [closeDelay]="200"
          >{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('par2-dont', 'docs_do_dont', $event)">
          <a
            ndsHoverCardTrigger
            href="?path=/docs/components-display-avatar--docs"
            [class]="classesGatilho"
            [openDelay]="0"
            [closeDelay]="200"
          >{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>

    <!-- ── Previews das variantes ──────────────────────────────────────────
         Vivos e FECHADOS: o cartão é conteúdo sob demanda, e mostrá-lo aberto
         aqui cobriria a seção seguinte com um painel flutuante. Passe o cursor
         (ou o Tab) sobre a menção para abrir. -->
    <ng-template #tplVarDefault>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('default', 'docs_variantes', $event)">
          <a ndsHoverCardTrigger href="?path=/docs/components-display-avatar--docs" [class]="classesGatilho">{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarWithDelay>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('with-delay', 'docs_variantes', $event)">
          <a
            ndsHoverCardTrigger
            href="?path=/docs/components-display-avatar--docs"
            [class]="classesGatilho"
            [openDelay]="500"
            [closeDelay]="200"
          >{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarUserProfile>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('user-profile', 'docs_variantes', $event)">
          <a ndsHoverCardTrigger href="?path=/docs/components-display-avatar--docs" [class]="classesGatilho">{{ mencao() }}</a>
          <ng-template ndsHoverCardContent>
            <ng-container [ngTemplateOutlet]="cartaoPerfil" />
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarLinkPreview>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('link-preview', 'docs_variantes', $event)">
          <a
            ndsHoverCardTrigger
            href="?path=/docs/components-layout-card--docs"
            [class]="classesGatilho"
            [openDelay]="500"
          >{{ t('variants.items.linkPreview.cardDomain') }}</a>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
                <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
                <span class="nds-truncate">{{ t('variants.items.linkPreview.cardDomain') }}</span>
              </div>
              <p class="nds-text-body nds-font-medium nds-leading-none">
                {{ t('variants.items.linkPreview.cardTitle') }}
              </p>
            </div>
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarDefinition>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('definition-tooltip', 'docs_variantes', $event)">
          <button ndsHoverCardTrigger [class]="classesGatilhoBotao">
            {{ t('variants.items.definitionTooltip.cardTerm') }}
          </button>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">
                {{ t('variants.items.definitionTooltip.cardTerm') }}
              </p>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('variants.items.definitionTooltip.cardMeaning') }}
              </p>
            </div>
          </ng-template>
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarMetric>
      <div class="nds-min-h-40" style="contain: layout; position: relative">
        <span ndsHoverCard (onOpenChange)="onChange('metric-explainer', 'docs_variantes', $event)">
          <button ndsHoverCardTrigger [class]="classesGatilhoBotao">3,42%</button>
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">
                  {{ t('variants.items.metricExplainer.cardMetric') }}
                </p>
                <!-- A cor semântica fica no número; a fórmula segue na cor de
                     corpo, que é o que garante o contraste do texto corrido. -->
                <span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('variants.items.metricExplainer.cardFormula') }}
              </p>
            </div>
          </ng-template>
        </span>
      </div>
    </ng-template>

    <!-- O cartão de perfil é reaproveitado por três exemplos — um template só. -->
    <ng-template #cartaoPerfil>
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <span ndsAvatar>
          <!-- aria-hidden: o nome logo ao lado já identifica a pessoa. -->
          <span ndsAvatarFallback aria-hidden="true">JS</span>
        </span>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body nds-font-medium nds-leading-none">
            {{ t('variants.items.userProfile.cardName') }}
          </p>
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ t('variants.items.userProfile.cardMeta') }}
          </p>
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
        <!-- UM gatilho, o mesmo do Playground da story (§15 da guideline 08):
             a menção dentro de uma frase, revelando o cartão de perfil. Os
             outros três exemplos que moravam aqui SÃO as variantes de preview
             de link, de definição e de métrica, e cada uma já tem preview vivo
             na seção Variantes — repeti-los aqui fazia a página abrir ensinando
             quatro coisas e a story exercitar uma. -->
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <p
            class="nds-text-body nds-max-w-sm nds-min-h-50"
            style="contain: layout; position: relative"
          >
            {{ t('demonstration.sentenceBefore') }}
            <span ndsHoverCard (onOpenChange)="onChange('user-profile', 'docs_demo', $event)">
              <a ndsHoverCardTrigger href="?path=/docs/components-display-avatar--docs" [class]="classesGatilho">{{ mencao() }}</a>
              <ng-template ndsHoverCardContent>
                <ng-container [ngTemplateOutlet]="cartaoPerfil" />
              </ng-template>
            </span>
            {{ t('demonstration.sentenceAfter') }}
          </p>
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
   * A menção TEM chave no conteúdo compartilhado (`demonstration.mention`), e
   * é a mesma que a frase do Playground cerca. Literal aqui seria texto de
   * página nascido dentro da stack: invisível para quem edita o conteúdo, e
   * igual nos três idiomas por acaso, não por decisão.
   */
  protected readonly mencao = computed(() => {
    dict();
    return t('demonstration.mention');
  });

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

  /**
   * Abertura e fechamento de QUALQUER cartão desta página.
   *
   * O evento sai do handler da docs page, nunca de dentro do primitivo de UI —
   * é o que a regra `analytics_in_ui_primitive` proíbe. O rótulo é um id
   * ESTÁVEL em kebab-case (`user-profile`, `link-preview`, …), o mesmo nas
   * cinco stacks para que a série junte no GA4, e nunca o texto do gatilho, que
   * viraria um valor por idioma.
   *
   * A seção vem do CALL SITE: a Demonstração e as Variantes renderizam o
   * componente vivo, e uma abertura ali é tão real numa quanto na outra — com a
   * seção cravada aqui dentro, as seis responderiam "veio da demonstração".
   * `docs_demo` é herança do vocabulário do GA4, não exceção de estilo.
   *
   * O output escolhido é `onOpenChange`, não `openChange`: o segundo é o model
   * do `open` e entrega só o booleano, enquanto o primeiro traz a CAUSA
   * (`trigger-hover`, `escape-key`, `outside-press`) — que é justamente o que
   * `hover_card_close.reason` existe para registrar.
   */
  protected onChange(triggerId: string, section: string, event: RdxPreviewCardOpenChange): void {
    if (event.open) {
      track('hover_card_open', {
        component: 'hover-card',
        trigger_label: triggerId,
        location: section,
      });
      return;
    }
    track('hover_card_close', {
      component: 'hover-card',
      reason: event.reason,
      location: section,
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
      { k: 'tooltip',      path: '?path=/docs/components-overlay-tooltip--docs'      },
      { k: 'popover',      path: '?path=/docs/components-overlay-popover--docs'      },
      { k: 'dropdownMenu', path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { k: 'card',         path: '?path=/docs/components-layout-card--docs'         },
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
    // descrição — e é ela que diz quais são e para que servem. Os dois SAEM
    // desta página: todo cartão vivo, na Demonstração e nas Variantes, passa
    // pelo handler `onChange`. O payload aqui é o que o evento tipado carrega
    // de fato — `trigger_label` é id estável do gatilho, nunca o texto dele.
    return [
      {
        event: 'hover_card_open',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component, trigger_label, location',
      },
      {
        event: 'hover_card_close',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component, reason, location',
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
