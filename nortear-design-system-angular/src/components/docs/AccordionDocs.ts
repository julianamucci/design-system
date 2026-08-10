import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, useTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsAccordion,
  NdsAccordionContent,
  NdsAccordionItem,
  NdsAccordionTrigger,
} from '@/components/ui/accordion';
import { NdsBadge } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import accordionTranslations from '@shared/content/accordion/translations.json';

import {
  NdsDocsAccessibility,
  NdsDocsAnalytics,
  NdsDocsAnatomy,
  NdsDocsCompositions,
  NdsDocsDemonstration,
  NdsDocsDoDont,
  NdsDocsHeader,
  NdsDocsImport,
  NdsDocsNotes,
  NdsDocsPageLayout,
  NdsDocsProps,
  NdsDocsRelated,
  NdsDocsStates,
  NdsDocsTestes,
  NdsDocsTokens,
  NdsDocsVariants,
  NdsDocsWhenToUse,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Sobrescritas locais. Todas por motivo declarado — nenhuma por gosto.
const { t, dict } = useTranslation(accordionTranslations as Record<string, unknown>, {
  'pt-BR': {
    // Chave que o conteúdo compartilhado não tem: a raiz deste stack aceita
    // `disabled`, que desliga o accordion inteiro de uma vez.
    'props.accordion.items.disabled.description':
      'Desabilita todos os itens de uma vez. Os gatilhos continuam focáveis e anunciam o estado.',
    // Idem: o item emite a mudança de abertura, e é dela que sai o analytics
    // desta própria página.
    'props.item.items.onOpenChange.description':
      'Emite a mudança de abertura do item, com o novo estado. É por aqui que esta página registra os eventos de analytics.',
    // O texto compartilhado fala de `className` em todos os subcomponentes.
    // Aqui não existe input de classe: o Angular mescla sozinho o `class`
    // escrito no elemento com o que o componente declara — criar um input
    // seria duplicar o framework. E o conteúdo não tem propriedades próprias:
    // o estado dele vem do item.
    'props.extensibility':
      '<code>class</code> — escreva a classe direto no elemento; o Angular mescla com a do componente, sem input dedicado. Use tokens semânticos para customizar, nunca cores fixas. O conteúdo não expõe propriedades: abertura, id e visibilidade vêm do item.',
  },
  en: {
    'props.accordion.items.disabled.description':
      'Disables every item at once. Triggers stay focusable and announce the state.',
    'props.item.items.onOpenChange.description':
      'Emits the item open-state change with the new value. This page reads it to send its analytics events.',
    'props.extensibility':
      '<code>class</code> — write the class straight on the element; the framework merges it with the component’s own, with no dedicated input. Use semantic tokens for customization, never hardcoded colors. The content part exposes no properties: open state, id and visibility all come from the item.',
  },
  es: {
    'props.accordion.items.disabled.description':
      'Deshabilita todos los ítems a la vez. Los disparadores siguen enfocables y anuncian el estado.',
    'props.item.items.onOpenChange.description':
      'Emite el cambio de apertura del ítem con el nuevo estado. Esta página lo lee para enviar sus eventos de analytics.',
    'props.extensibility':
      '<code>class</code> — escribe la clase directamente en el elemento; el framework la fusiona con la del componente, sin input dedicado. Usa tokens semánticos para personalizar, nunca colores fijos. El contenido no expone propiedades: apertura, id y visibilidad vienen del ítem.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
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
    { id: 'composicoes',  labelKey: 'nav.compositions' },
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

// A anatomia do conteúdo compartilhado descreve `<nds-accordion>` e
// `<nds-accordion-item>`, elementos que não existem: aqui os seletores são de
// atributo, para o markup ficar idêntico ao das outras stacks (`div` + `h3` +
// `button`). Mesmo precedente do Card, do Checkbox e do Slider.
const ANATOMY_CODE = `<div ndsAccordion defaultValue="item-1">
  <div ndsAccordionItem value="item-1">
    <button ndsAccordionTrigger>Título</button>
    <div ndsAccordionContent>Conteúdo</div>
  </div>
</div>

<!-- Vários itens abertos ao mesmo tempo -->
<div ndsAccordion [multiple]="true" [defaultValue]="['item-1', 'item-2']">
  <!-- … -->
</div>`;

const INTERFACE_CODE = `// A raiz compõe o primitivo headless; o modo é um booleano,
// como no Base UI — no modo único o item ativo sempre fecha ao
// ser clicado de novo, então não existe um \`collapsible\` à parte.
@Component({
  selector: 'div[ndsAccordion]',
  hostDirectives: [
    { directive: RdxAccordionRootDirective,
      inputs: ['multiple', 'value', 'defaultValue', 'disabled'],
      outputs: ['valueChange', 'onValueChange'] },
  ],
})
export class NdsAccordion {}

// O item projeta o gatilho dentro de um <h3>, então quem consome
// escreve só gatilho e conteúdo — o cabeçalho semântico não fica
// na mão de quem lembrar dele.
@Component({
  selector: 'div[ndsAccordionItem]',
  hostDirectives: [
    { directive: RdxAccordionItemDirective,
      inputs: ['value', 'disabled'], outputs: ['onOpenChange'] },
  ],
})
export class NdsAccordionItem {}`;

const CODE_SINGLE = `<div ndsAccordion defaultValue="item-1">
  <div ndsAccordionItem value="item-1">
    <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
    <div ndsAccordionContent>
      Acesse a tela de login e clique em Esqueci minha senha.
    </div>
  </div>
  <div ndsAccordionItem value="item-2">
    <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
    <div ndsAccordionContent>Cartão de crédito, Pix e boleto bancário.</div>
  </div>
</div>`;

const CODE_MULTIPLE = `<div ndsAccordion [multiple]="true">
  <div ndsAccordionItem value="especificacoes">
    <button ndsAccordionTrigger>Especificações técnicas</button>
    <div ndsAccordionContent>CPU: Intel i7, RAM: 16GB</div>
  </div>
  <div ndsAccordionItem value="compatibilidade">
    <button ndsAccordionTrigger>Compatibilidade</button>
    <div ndsAccordionContent>Windows 11, macOS 14+</div>
  </div>
</div>`;

const CODE_CONTROLLED = `// aberto = signal('item-1')
<div ndsAccordion [(value)]="aberto">
  <div ndsAccordionItem value="item-1">
    <button ndsAccordionTrigger>Item controlado</button>
    <div ndsAccordionContent>Estado gerenciado externamente.</div>
  </div>
</div>`;

const CODE_DEFAULT_OPEN = `<!-- Modo único guarda uma string; múltiplo, um array -->
<div ndsAccordion defaultValue="item-1">
  <div ndsAccordionItem value="item-1">
    <button ndsAccordionTrigger>Item aberto por padrão</button>
    <div ndsAccordionContent>Este item inicia expandido.</div>
  </div>
</div>`;

const CODE_ICON_TRIGGER = `<div ndsAccordion>
  <div ndsAccordionItem value="info">
    <button ndsAccordionTrigger>
      <span class="nds-cluster" data-spacing="xs">
        <svg class="nds-icon-sm nds-shrink-0" aria-hidden="true"><!-- … --></svg>
        Informação
      </span>
    </button>
    <div ndsAccordionContent>Ícones ajudam a identificar o tipo de conteúdo.</div>
  </div>
</div>`;

const CODE_BADGE_TRIGGER = `<div ndsAccordion>
  <div ndsAccordionItem value="novo">
    <button ndsAccordionTrigger>
      <span class="nds-cluster" data-spacing="xs">
        Novidades da versão 3.0
        <span ndsBadge>Novo</span>
      </span>
    </button>
    <div ndsAccordionContent>Confira o que mudou nesta release.</div>
  </div>
</div>`;

const CODE_RICH_CONTENT = `<div ndsAccordion [multiple]="true">
  <div ndsAccordionItem value="specs">
    <button ndsAccordionTrigger>Especificações técnicas</button>
    <div ndsAccordionContent>
      <table class="nds-w-full nds-text-body nds-border-collapse">
        <tbody>
          <tr class="nds-border-b">
            <td class="nds-py-1 nds-pr-4">CPU</td>
            <td class="nds-py-1">Intel Core i7-12700</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;

const CODE_FAQ = `<h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
<div ndsAccordion>
  <div ndsAccordionItem value="senha">
    <button ndsAccordionTrigger>Como redefinir minha senha?</button>
    <div ndsAccordionContent>
      Acesse a tela de login e clique em Esqueci minha senha.
    </div>
  </div>
  <div ndsAccordionItem value="pagamento">
    <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
    <div ndsAccordionContent>Cartão de crédito, Pix e boleto bancário.</div>
  </div>
</div>`;

@Component({
  selector: 'nds-accordion-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsAccordion, NdsAccordionItem, NdsAccordionTrigger, NdsAccordionContent, NdsBadge,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div ndsAccordion class="nds-max-w-xs nds-text-body">
        <div ndsAccordionItem value="dd1-do">
          <button ndsAccordionTrigger>{{ t('demonstration.labels.q1') }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a1') }}</div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsAccordion class="nds-max-w-xs nds-text-body">
        <div ndsAccordionItem value="dd1-dont">
          <button ndsAccordionTrigger>{{ rotuloAmbiguo() }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a1') }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsAccordion class="nds-max-w-xs nds-text-body" [multiple]="true">
        <div ndsAccordionItem value="dd2-spec">
          <button ndsAccordionTrigger>{{ rotulos().especificacoes }}</button>
          <div ndsAccordionContent>{{ rotulos().cpu }}</div>
        </div>
        <div ndsAccordionItem value="dd2-compat">
          <button ndsAccordionTrigger>{{ rotulos().compatibilidade }}</button>
          <div ndsAccordionContent>{{ rotulos().sistemas }}</div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsAccordion class="nds-max-w-xs nds-text-body">
        <div ndsAccordionItem value="dd2-unico">
          <button ndsAccordionTrigger>{{ rotulos().secaoUnica }}</button>
          <div ndsAccordionContent>{{ rotulos().useCollapsible }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarSingle>
      <div ndsAccordion class="nds-max-w-sm nds-text-body" defaultValue="var-single-1">
        <div ndsAccordionItem value="var-single-1">
          <button ndsAccordionTrigger>{{ t('demonstration.labels.q2') }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a2') }}</div>
        </div>
        <div ndsAccordionItem value="var-single-2">
          <button ndsAccordionTrigger>{{ t('demonstration.labels.q3') }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a3') }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarMultiple>
      <div ndsAccordion class="nds-max-w-sm nds-text-body" [multiple]="true">
        <div ndsAccordionItem value="var-spec">
          <button ndsAccordionTrigger>{{ rotulos().especificacoes }}</button>
          <div ndsAccordionContent>{{ rotulos().cpu }}</div>
        </div>
        <div ndsAccordionItem value="var-compat">
          <button ndsAccordionTrigger>{{ rotulos().compatibilidade }}</button>
          <div ndsAccordionContent>{{ rotulos().sistemas }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarControlled>
      <div class="nds-stack nds-w-full nds-max-w-sm nds-text-body" data-spacing="sm">
        <p class="nds-text-caption nds-text-muted-foreground">
          {{ rotulos().itemAberto }} <code>{{ itemControlado() || rotulos().nenhum }}</code>
        </p>
        <div ndsAccordion [value]="itemControlado()" (valueChange)="definirControlado($event)">
          <div ndsAccordionItem value="ctrl-1">
            <button ndsAccordionTrigger>{{ t('demonstration.labels.q1') }}</button>
            <div ndsAccordionContent>{{ t('demonstration.labels.a1') }}</div>
          </div>
          <div ndsAccordionItem value="ctrl-2">
            <button ndsAccordionTrigger>{{ t('demonstration.labels.q4') }}</button>
            <div ndsAccordionContent>{{ t('demonstration.labels.a4') }}</div>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarDefaultOpen>
      <div ndsAccordion class="nds-max-w-sm nds-text-body" defaultValue="var-default-1">
        <div ndsAccordionItem value="var-default-1">
          <button ndsAccordionTrigger>{{ t('demonstration.labels.q3') }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a3') }}</div>
        </div>
        <div ndsAccordionItem value="var-default-2">
          <button ndsAccordionTrigger>{{ t('demonstration.labels.q4') }}</button>
          <div ndsAccordionContent>{{ t('demonstration.labels.a4') }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompIcone>
      <div ndsAccordion class="nds-max-w-lg nds-text-body">
        @for (item of itensComIcone(); track item.value) {
          <div ndsAccordionItem [value]="item.value">
            <button ndsAccordionTrigger>
              <span class="nds-cluster" data-spacing="xs">
                <svg
                  class="nds-icon-sm nds-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path [attr.d]="item.path" />
                </svg>
                {{ item.label }}
              </span>
            </button>
            <div ndsAccordionContent>{{ item.conteudo }}</div>
          </div>
        }
      </div>
    </ng-template>

    <ng-template #tplCompBadge>
      <div ndsAccordion class="nds-max-w-lg nds-text-body">
        <div ndsAccordionItem value="comp-novo">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              {{ rotulos().novidades }}
              <span ndsBadge>{{ rotulos().novo }}</span>
            </span>
          </button>
          <div ndsAccordionContent>{{ rotulos().novidadesTexto }}</div>
        </div>
        <div ndsAccordionItem value="comp-beta">
          <button ndsAccordionTrigger>
            <span class="nds-cluster" data-spacing="xs">
              {{ rotulos().recursosBeta }}
              <span ndsBadge variant="secondary">Beta</span>
            </span>
          </button>
          <div ndsAccordionContent>{{ rotulos().betaTexto }}</div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompRico>
      <div ndsAccordion class="nds-max-w-lg nds-text-body" [multiple]="true">
        <div ndsAccordionItem value="comp-specs">
          <button ndsAccordionTrigger>{{ rotulos().especificacoes }}</button>
          <div ndsAccordionContent>
            <!-- Tabela de verdade, não grid: dado tabular pede semântica de
                 tabela, e o grid de duas colunas colapsa para uma dentro do
                 accordion. -->
            <table class="nds-w-full nds-text-body nds-border-collapse">
              <tbody>
                @for (linha of linhasDeEspecificacao(); track linha.rotulo) {
                  <tr class="nds-border-b">
                    <td class="nds-py-1 nds-pr-4">{{ linha.rotulo }}</td>
                    <td class="nds-py-1">{{ linha.valor }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <div ndsAccordionItem value="comp-inclui">
          <button ndsAccordionTrigger>{{ rotulos().incluso }}</button>
          <div ndsAccordionContent>
            <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
              @for (linha of itensInclusos(); track linha) {
                <li>{{ linha }}</li>
              }
            </ul>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompFaq>
      <div class="nds-stack nds-w-full nds-max-w-lg" data-spacing="xs">
        <h2 class="nds-text-base nds-font-semibold">{{ rotulos().perguntasFrequentes }}</h2>
        <div ndsAccordion class="nds-text-body">
          @for (p of perguntas(); track p.value) {
            <div ndsAccordionItem [value]="'faq-' + p.value">
              <button ndsAccordionTrigger>{{ p.pergunta }}</button>
              <div ndsAccordionContent>{{ p.resposta }}</div>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="accordion"
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
          <div ndsAccordion class="nds-max-w-lg" defaultValue="demo-1">
            @for (p of perguntas(); track p.value) {
              <div
                ndsAccordionItem
                [value]="'demo-' + p.value"
                (onOpenChange)="aoMudarItemDaDemo($event, p.pergunta)"
              >
                <button ndsAccordionTrigger>{{ p.pergunta }}</button>
                <div ndsAccordionContent>{{ p.resposta }}</div>
              </div>
            }
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
          [description]="t('import.note')"
          [code]="importCode"
          componentSlug="accordion"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="accordion"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="accordion"
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
          [contrast]="t('accessibility.contrast')"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="accordion"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="accordion" />

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
export class NdsAccordionDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode =
    `import {\n` +
    `  NdsAccordion,\n` +
    `  NdsAccordionItem,\n` +
    `  NdsAccordionTrigger,\n` +
    `  NdsAccordionContent,\n` +
    `} from '@/components/ui/accordion';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Estado do exemplo controlado. Modo único guarda uma string. */
  protected readonly itemControlado = signal<string>('ctrl-1');

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarMultiple = viewChild.required<TemplateRef<unknown>>('tplVarMultiple');
  private readonly tplVarControlled = viewChild.required<TemplateRef<unknown>>('tplVarControlled');
  private readonly tplVarDefaultOpen = viewChild.required<TemplateRef<unknown>>('tplVarDefaultOpen');
  private readonly tplCompIcone = viewChild.required<TemplateRef<unknown>>('tplCompIcone');
  private readonly tplCompBadge = viewChild.required<TemplateRef<unknown>>('tplCompBadge');
  private readonly tplCompRico = viewChild.required<TemplateRef<unknown>>('tplCompRico');
  private readonly tplCompFaq = viewChild.required<TemplateRef<unknown>>('tplCompFaq');

  /**
   * Rótulos de exemplo que não vivem no conteúdo compartilhado: são nomes de
   * produto fictício dentro dos previews. Ficam num só lugar para o template
   * não carregar literal solto — e porque o contexto de template não tem
   * globais para montá-los.
   */
  protected readonly rotulos = computed(() => {
    const l = getLocale();
    const dicionario = {
      'pt-BR': {
        especificacoes: 'Especificações técnicas',
        compatibilidade: 'Compatibilidade',
        cpu: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe',
        sistemas: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS',
        secaoUnica: 'Mostrar informações',
        useCollapsible: 'Uma seção só pede Collapsible, não Accordion.',
        itemAberto: 'Item aberto:',
        nenhum: 'nenhum',
        novidades: 'Novidades da versão 3.0',
        novo: 'Novo',
        novidadesTexto: 'Confira o que mudou nesta release.',
        recursosBeta: 'Funcionalidades em beta',
        betaTexto: 'Recursos em teste — sujeitos a mudanças.',
        incluso: 'O que está incluso',
        perguntasFrequentes: 'Perguntas frequentes',
        informacao: 'Informação',
        aviso: 'Aviso',
        confirmacao: 'Confirmação',
        informacaoTexto: 'Ícones facilitam a identificação rápida do tipo de conteúdo.',
        avisoTexto: 'Sinalize categorias distintas com ícones semânticos.',
        confirmacaoTexto: 'Use ícones consistentes entre itens do mesmo accordion.',
        inclusos: ['Cabo de alimentação', 'Manual do usuário', 'Garantia de 24 meses'],
      },
      en: {
        especificacoes: 'Technical specifications',
        compatibilidade: 'Compatibility',
        cpu: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe',
        sistemas: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS',
        secaoUnica: 'Show information',
        useCollapsible: 'A single section calls for Collapsible, not Accordion.',
        itemAberto: 'Open item:',
        nenhum: 'none',
        novidades: 'What is new in 3.0',
        novo: 'New',
        novidadesTexto: 'See what changed in this release.',
        recursosBeta: 'Beta features',
        betaTexto: 'Features under test — subject to change.',
        incluso: 'What is included',
        perguntasFrequentes: 'Frequently asked questions',
        informacao: 'Information',
        aviso: 'Warning',
        confirmacao: 'Confirmation',
        informacaoTexto: 'Icons speed up recognition of the content type.',
        avisoTexto: 'Use semantic icons to signal distinct categories.',
        confirmacaoTexto: 'Keep icons consistent across items of the same accordion.',
        inclusos: ['Power cable', 'User manual', '24-month warranty'],
      },
      es: {
        especificacoes: 'Especificaciones técnicas',
        compatibilidade: 'Compatibilidad',
        cpu: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe',
        sistemas: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS',
        secaoUnica: 'Mostrar información',
        useCollapsible: 'Una sola sección pide Collapsible, no Accordion.',
        itemAberto: 'Ítem abierto:',
        nenhum: 'ninguno',
        novidades: 'Novedades de la versión 3.0',
        novo: 'Nuevo',
        novidadesTexto: 'Mira lo que cambió en esta release.',
        recursosBeta: 'Funciones en beta',
        betaTexto: 'Recursos en prueba — sujetos a cambios.',
        incluso: 'Qué incluye',
        perguntasFrequentes: 'Preguntas frecuentes',
        informacao: 'Información',
        aviso: 'Aviso',
        confirmacao: 'Confirmación',
        informacaoTexto: 'Los íconos facilitan identificar el tipo de contenido.',
        avisoTexto: 'Señala categorías distintas con íconos semánticos.',
        confirmacaoTexto: 'Usa íconos consistentes entre ítems del mismo accordion.',
        inclusos: ['Cable de alimentación', 'Manual del usuario', 'Garantía de 24 meses'],
      },
    } as const;
    return dicionario[l] ?? dicionario['pt-BR'];
  });

  /** O "não faça": frase nominal ambígua no lugar da pergunta completa. */
  protected readonly rotuloAmbiguo = computed(() => {
    dict();
    // O próprio conteúdo compartilhado traz o exemplo do que evitar.
    return toPlainText(t('usage.uxWriting.table.trigger.bad')).split(',')[0].replace(/"/g, '');
  });

  protected readonly perguntas = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({
      value: String(i),
      pergunta: t(`demonstration.labels.q${i}`),
      resposta: t(`demonstration.labels.a${i}`),
    }));
  });

  protected readonly itensComIcone = computed(() => {
    const r = this.rotulos();
    return [
      { value: 'comp-info',    label: r.informacao,   conteudo: r.informacaoTexto,   path: 'M12 16v-4M12 8h.01' },
      { value: 'comp-aviso',   label: r.aviso,        conteudo: r.avisoTexto,        path: 'M12 8v4M12 16h.01' },
      { value: 'comp-sucesso', label: r.confirmacao,  conteudo: r.confirmacaoTexto,  path: 'm9 12 2 2 4-4' },
    ];
  });

  protected readonly linhasDeEspecificacao = computed(() => {
    const r = this.rotulos();
    return r.cpu.split(', ').map((parte) => {
      const [rotulo, ...resto] = parte.split(': ');
      return { rotulo, valor: resto.join(': ') };
    });
  });

  protected readonly itensInclusos = computed(() => [...this.rotulos().inclusos]);

  protected definirControlado(valor: unknown): void {
    this.itemControlado.set(typeof valor === 'string' ? valor : '');
  }

  /**
   * Analytics do exemplo da demonstração.
   *
   * O evento sai da mudança de abertura do ITEM, não de um clique lido do DOM:
   * qual atributo carrega o estado varia por biblioteca headless, e a ordem
   * entre o listener da página e o do primitivo não é garantida — ler o DOM no
   * clique inverteria expand e collapse em silêncio. O payload leva o rótulo
   * traduzido porque é o que identifica a seção nesta página de demonstração.
   */
  protected aoMudarItemDaDemo(evento: { open: boolean }, rotulo: string): void {
    track(evento.open ? 'accordion_expand' : 'accordion_collapse', {
      component: 'accordion',
      label: rotulo,
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: g.labelKey === 'nav.compositions' ? tNav(g.labelKey) : t(g.labelKey),
      sections: g.sections.map((s) => ({
        id: s.id,
        label: s.labelKey === 'nav.compositions' ? tNav(s.labelKey) : t(s.labelKey),
      })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        s: t(`usage.scenarios.item${i}.s`),
        u: t(`usage.scenarios.item${i}.u`),
        a: t(`usage.scenarios.item${i}.a`),
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
      items: ['trigger', 'triggerDoc', 'content'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
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
    const pares: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pares.map(([doTpl, dontTpl], i) => ({
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
        name: t('variants.items.single.label'),
        description: stripHtml(t('variants.items.single.description')),
        code: CODE_SINGLE,
        trackId: 'single',
        preview: this.tplVarSingle(),
      },
      {
        name: t('variants.items.multiple.label'),
        description: stripHtml(t('variants.items.multiple.description')),
        code: CODE_MULTIPLE,
        trackId: 'multiple',
        preview: this.tplVarMultiple(),
      },
      {
        name: t('variants.items.controlled.label'),
        description: stripHtml(t('variants.items.controlled.description')),
        code: CODE_CONTROLLED,
        trackId: 'controlled',
        preview: this.tplVarControlled(),
      },
      {
        name: t('variants.items.defaultOpen.label'),
        description: stripHtml(t('variants.items.defaultOpen.description')),
        code: CODE_DEFAULT_OPEN,
        trackId: 'defaultOpen',
        preview: this.tplVarDefaultOpen(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; code: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'iconTrigger',  code: CODE_ICON_TRIGGER,  tpl: this.tplCompIcone() },
      { key: 'badgeTrigger', code: CODE_BADGE_TRIGGER, tpl: this.tplCompBadge() },
      { key: 'richContent',  code: CODE_RICH_CONTENT,  tpl: this.tplCompRico()  },
      { key: 'faq',          code: CODE_FAQ,           tpl: this.tplCompFaq()   },
    ];
    return mapa.map(({ key, code, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
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
    return ['closed', 'open', 'disabled', 'focused'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.accordion.prop'),
      type: t('props.accordion.type'),
      default: t('props.accordion.default'),
      required: t('props.accordion.required'),
      description: t('props.accordion.description'),
    };
    const sim = tNav('common.yes');
    const nao = tNav('common.no');
    const desc = (chave: string) => toPlainText(t(chave));

    return [
      {
        title: t('props.accordion.title'),
        cols,
        items: [
          // `type` do conteúdo compartilhado vira `multiple`: é o nome do
          // primitivo e o mesmo da stack React. E `collapsible` não existe —
          // no modo único o item ativo sempre fecha ao ser clicado de novo.
          {
            name: 'multiple',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: desc('props.accordion.items.type.description'),
          },
          {
            name: 'defaultValue',
            type: 'string | string[]',
            defaultValue: '—',
            required: nao,
            description: desc('props.accordion.items.defaultValue.description'),
          },
          {
            name: 'value',
            type: 'model<string | string[]>',
            defaultValue: '—',
            required: nao,
            description: desc('props.accordion.items.value.description'),
          },
          {
            name: 'valueChange',
            type: 'output<string | string[]>',
            defaultValue: '—',
            required: nao,
            description: desc('props.accordion.items.onValueChange.description'),
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: desc('props.accordion.items.disabled.description'),
          },
        ],
      },
      {
        title: t('props.item.title'),
        cols,
        items: [
          {
            name: 'value',
            type: 'string',
            defaultValue: '—',
            required: sim,
            description: desc('props.item.items.value.description'),
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: desc('props.item.items.disabled.description'),
          },
          {
            name: 'onOpenChange',
            type: 'output<{ open: boolean }>',
            defaultValue: '—',
            required: nao,
            description: desc('props.item.items.onOpenChange.description'),
          },
        ],
      },
      {
        title: t('props.trigger.title'),
        cols,
        items: [
          {
            name: '(click)',
            type: '(event: MouseEvent) => void',
            defaultValue: '—',
            required: nao,
            description: desc('props.trigger.items.onClick.description'),
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
      'border', 'foreground', 'mutedForeground', 'ring', 'spacing',
      'animateExpand', 'animateCollapse',
    ].map((k) => ({
      token: t(`tokens.items.${k}.token`),
      value: toPlainText(t(`tokens.items.${k}.class`)),
      description: toPlainText(t(`tokens.items.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return ['ariaExpanded', 'ariaControls', 'hiddenUntilFound', 'noRegion'].map((k) =>
      t(`accessibility.aria.${k}`),
    );
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab',  description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',      description: toPlainText(t('accessibility.keyboard.space')) },
      { key: '↓',          description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',          description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Home',       description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',        description: toPlainText(t('accessibility.keyboard.end')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['closed', 'open', 'disabled'].map((k) => t(`accessibility.screenReader.${k}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return ['collapsible', 'tabs', 'sidebar'].map((k) => ({
      name: t(`related.${k}.name`),
      description: toPlainText(t(`related.${k}.description`)),
      path: `?path=/docs/${t(`related.${k}.href`)}`,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
    return ['expand', 'collapse'].map((k) => ({
      event: t(`analytics.events.${k}.event`),
      trigger: toPlainText(t(`analytics.events.${k}.trigger`)),
      payload: toPlainText(t(`analytics.events.${k}.payload`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        action: toPlainText(t(`testes.functional.item${i}.action`)),
        result: stripHtml(toPlainText(t(`testes.functional.item${i}.result`))),
        priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
        level: t(`testes.accessibility.item${i}.level`),
        how: t(`testes.accessibility.item${i}.how`),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: [1, 2, 3, 4, 5].map((i) => ({
        story: toPlainText(t(`testes.visual.item${i}.story`)),
        priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
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
        componentSlug: 'accordion',
      });
      track('docs_page_view', {
        component_name: 'accordion',
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
          component_name: 'accordion',
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
