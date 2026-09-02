import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_INPUT_GROUP } from '@/components/ui/input-group';
import { NgTemplateOutlet } from '@angular/common';
import { NdsButton, NdsButtonIcon } from '@/components/ui/button';
import { inputGroupSnippet } from '@/components/ui/input-group.source';
import uiTranslations from '@/i18n/ui.json';
import inputGroupTranslations from '@shared/content/input-group/translations.json';

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

const SLUG = 'input-group';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides: só texto DESCRITIVO que muda nesta stack. Nenhum snippet `*Code`
// entra aqui — snippet em override fica preso a uma stack e some do conteúdo
// compartilhado.
//
// `props.table.ariaLabel.description` — o nome do grupo é ATRIBUTO nativo, não
//   entrada de diretiva; a diferença muda o que a pessoa escreve.
// `props.table.text.description` — o texto é CONTEÚDO projetado, não prop.
// `props.table.size.description` e `props.table.variant.description` — as duas
//   são entradas do `ndsButton`, escritas no MESMO elemento.
// `props.table.class.description` — aqui não existe prop de classe.
// `notes.item6` e `notes.item7` — as divergências desta stack.
const { t, dict } = useTranslation(inputGroupTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.ariaLabel.description':
      'Nome acessível do grupo, escrito como atributo nativo na raiz. Use quando a moldura tiver mais de um controle dentro; com um campo só ele repete o rótulo do campo.',
    'props.table.text.description':
      'O texto do compartimento é conteúdo projetado entre as tags, não uma entrada.',
    'props.table.size.description':
      'Medida do botão dentro da moldura, escrita no ndsButton do MESMO elemento. As duas de ícone são para o botão sem texto.',
    'props.table.variant.description':
      'Aparência do botão, escrita no ndsButton do mesmo elemento.',
    'props.table.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'notes.item6':
      '<strong>A medida do botão é do <code>ndsButton</code>, e não desta diretiva.</strong> As duas ficam no mesmo elemento, então uma entrada <code>size</code> aqui seria a segunda com esse nome no mesmo lugar — e só produziria um atributo que nenhuma folha lê. Escreva <code>size</code> no <code>ndsButton</code>: <code>&lt;button ndsButton size="icon-xs" ndsInputGroupButton&gt;</code>.',
    'notes.item7':
      '<strong>Não há forma declarada para somente-leitura.</strong> A folha compartilhada não desenha esse estado, e inventar aqui uma classe que ela não tem seria cravar o valor. Use o atributo <code>readonly</code> nativo no campo: ele é anunciado pelo leitor de tela e não gasta cor nenhuma.',
  },
  en: {
    'props.table.ariaLabel.description':
      'Accessible name of the group, written as a native attribute on the root. Use it when the frame holds more than one control; with a single field it repeats the field label.',
    'props.table.text.description':
      'The text of the slot is content projected between the tags, not an input.',
    'props.table.size.description':
      'Size of the button inside the frame, written on the ndsButton of the SAME element. The two icon sizes are for the button without text.',
    'props.table.variant.description':
      'Appearance of the button, written on the ndsButton of the same element.',
    'props.table.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'notes.item6':
      '<strong>The button size belongs to <code>ndsButton</code>, not to this directive.</strong> Both sit on the same element, so a <code>size</code> input here would be the second one with that name in the same place — and it would only produce an attribute no stylesheet reads. Write <code>size</code> on the <code>ndsButton</code>: <code>&lt;button ndsButton size="icon-xs" ndsInputGroupButton&gt;</code>.',
    'notes.item7':
      '<strong>There is no declared shape for read-only.</strong> The shared stylesheet does not draw that state, and inventing a class it does not have would be hardcoding the value. Use the native <code>readonly</code> attribute on the field: it is announced by the screen reader and spends no colour.',
  },
  es: {
    'props.table.ariaLabel.description':
      'Nombre accesible del grupo, escrito como atributo nativo en la raíz. Úsalo cuando el marco tenga más de un control dentro; con un solo campo repite la etiqueta del campo.',
    'props.table.text.description':
      'El texto del compartimento es contenido proyectado entre las etiquetas, no una entrada.',
    'props.table.size.description':
      'Medida del botón dentro del marco, escrita en el ndsButton del MISMO elemento. Las dos de icono son para el botón sin texto.',
    'props.table.variant.description':
      'Apariencia del botón, escrita en el ndsButton del mismo elemento.',
    'props.table.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'notes.item6':
      '<strong>La medida del botón es del <code>ndsButton</code>, no de esta directiva.</strong> Ambas viven en el mismo elemento, así que una entrada <code>size</code> aquí sería la segunda con ese nombre en el mismo lugar — y solo produciría un atributo que ninguna hoja lee. Escribe <code>size</code> en el <code>ndsButton</code>: <code>&lt;button ndsButton size="icon-xs" ndsInputGroupButton&gt;</code>.',
    'notes.item7':
      '<strong>No hay forma declarada para solo lectura.</strong> La hoja compartida no dibuja ese estado, e inventar aquí una clase que no tiene sería fijar el valor. Usa el atributo <code>readonly</code> nativo en el campo: lo anuncia el lector de pantalla y no gasta color.',
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

const IMPORT_CODE = `import {
  NdsInputGroup,
  NdsInputGroupAddon,
  NdsInputGroupText,
  NdsInputGroupButton,
  NdsInputGroupInput,
  NdsInputGroupTextarea,
} from '@/components/ui/input-group';

// Ou o barril com as seis partes, para o \`imports\` de quem compõe:
import { NDS_INPUT_GROUP } from '@/components/ui/input-group';`;

const INTERFACE_CODE = `// <div ndsInputGroup> › <div ndsInputGroupAddon> + <input ndsInputGroupInput>
@Directive({ selector: 'div[ndsInputGroup]' })
export class NdsInputGroup {}   // role="group" e a classe da moldura, no host

@Directive({ selector: 'div[ndsInputGroupAddon], span[ndsInputGroupAddon]' })
export class NdsInputGroupAddon {
  readonly align = input<InputGroupAlign>('inline-start');
}

@Directive({ selector: 'span[ndsInputGroupText]' })
export class NdsInputGroupText {}

// A medida vem do \`ndsButton\`, no MESMO elemento — esta diretiva só aperta.
@Directive({ selector: 'button[ndsInputGroupButton]' })
export class NdsInputGroupButton {}

@Directive({ selector: 'input[ndsInputGroupInput]' })
export class NdsInputGroupInput {}

@Directive({ selector: 'textarea[ndsInputGroupTextarea]' })
export class NdsInputGroupTextarea {}

export type InputGroupAlign =
  | 'inline-start' | 'inline-end' | 'block-start' | 'block-end';`;

/** Id do campo rotulado da demonstração e das composições. */
const DEMO_FIELD_ID = 'input-group-docs-password';
const COMPOSITION_FIELD_ID = 'input-group-docs-composition-password';
const AFFIX_FIELD_ID = 'input-group-docs-site';
const DO_DONT_FIELD_ID = 'input-group-docs-do-dont-site';
const INVALID_MESSAGE_ID = 'input-group-docs-error';

/** As quatro posições do addon — chave do conteúdo, e id estável do tracking. */
const ALIGNMENT_KEYS = ['inlineStart', 'inlineEnd', 'blockStart', 'blockEnd'] as const;

/** As quatro composições — a chave do conteúdo É o `trackId`, verbatim. */
const COMPOSITION_KEYS = ['search', 'password', 'affix', 'textareaToolbar'] as const;

/** Chave do conteúdo → token real, conferidos um a um contra a folha. */
const TOKEN_ROWS: Array<[string, string]> = [
  ['border', '--input'],
  ['radius', '--radius'],
  ['transition', '--duration-fast'],
  ['ring', '--ring'],
  ['destructive', '--destructive'],
  ['disabledBg', '--muted'],
  ['controlRadius', '--radius-none'],
  ['textareaPadding', '--spacing-2'],
  ['addonPadding', '--spacing-1-5'],
  ['addonGap', '--spacing-2'],
  ['addonSize', '--text-control'],
  ['addonWeight', '--font-weight-medium'],
  ['addonColor', '--muted-foreground'],
  ['addonInline', '--spacing-2'],
  ['addonBlock', '--spacing-2-5'],
  ['iconSize', '--spacing-4'],
  ['buttonRadius', '--radius-md'],
  ['buttonGap', '--spacing-1'],
  ['buttonPadding', '--spacing-1-5'],
];

@Component({
  selector: 'nds-input-group-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_INPUT_GROUP, NdsButton, NdsButtonIcon, NgTemplateOutlet,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- ── Ícones ─────────────────────────────────────────────────────── -->
    <!--
      Desenhados à mão, e não pelo NdsButtonIcon: o mapa daquele componente não
      tem lupa nem o par de olhos. Ficam em ng-template porque o par aparece em
      dois lugares — a demonstração e o cartão de composição — e cópia de
      marcação diverge sem ninguém notar. Todos são decoração: quem nomeia o
      botão é o aria-label.
    -->
    <ng-template #tplIconSearch>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m21 21-4.34-4.34" />
        <circle cx="11" cy="11" r="8" />
      </svg>
    </ng-template>

    <ng-template #tplIconReveal>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </ng-template>

    <ng-template #tplIconHide>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
        <path d="m2 2 20 20" />
      </svg>
    </ng-template>

    <!-- ── Do & Don't ─────────────────────────────────────────────────── -->

    <ng-template #tplDoDont1Do>
      <div ndsInputGroup [attr.aria-label]="t('demonstration.labels.searchGroup')">
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.searchField')" />
        <div ndsInputGroupAddon align="inline-end">
          <button
            ndsButton
            variant="ghost"
            size="icon-xs"
            ndsInputGroupButton
            [attr.aria-label]="t('demonstration.labels.clear')"
          ><svg ndsButtonIcon kind="x"></svg></button>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O painel mostra o FORMATO do defeito sem plantá-lo: o acompanhamento
           é texto inerte, e a legenda é quem conta que a forma errada é
           pendurar um clique num bloco desses. Um clique de verdade num
           contêiner aqui deixaria a PRÓPRIA página com um controle inalcançável
           por teclado. -->
      <div ndsInputGroup>
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.searchField')" />
        <div ndsInputGroupAddon align="inline-end">
          <span ndsInputGroupText>{{ t('demonstration.labels.clear') }}</span>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsInputGroup>
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
          </div>
          <!-- O nome do campo é do CAMPO, e não do texto de exemplo. Este é o
               lado "faça" de um par sobre erro acessível: mostrar a mensagem
               ligada e deixar o campo sem nome ensinaria metade certa. -->
          <input
            ndsInputGroupInput
            [attr.aria-label]="t('demonstration.labels.siteGroup')"
            [placeholder]="t('demonstration.labels.siteField')"
            aria-invalid="true"
            [attr.aria-describedby]="invalidMessageId"
          />
        </div>
        <p [id]="invalidMessageId" class="nds-text-caption nds-text-destructive">
          {{ t('demonstration.labels.invalidMsg') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- Só a moldura vermelha: quem não distingue a cor não fica sabendo de
           nada. O atributo está lá — é ele que pinta —, mas não há texto
           nenhum ligado a ele. -->
      <div ndsInputGroup>
        <div ndsInputGroupAddon align="inline-start">
          <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
        </div>
        <input
          ndsInputGroupInput
          [placeholder]="t('demonstration.labels.siteField')"
          aria-invalid="true"
        />
      </div>
    </ng-template>

    <ng-template #tplDoDont3Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" [attr.for]="doDontFieldId">
          {{ t('demonstration.labels.siteGroup') }}
        </label>
        <div ndsInputGroup>
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
          </div>
          <input
            ndsInputGroupInput
            [id]="doDontFieldId"
            [placeholder]="t('demonstration.labels.siteField')"
          />
          <div ndsInputGroupAddon align="inline-end">
            <span ndsInputGroupText>.com</span>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont3Dont>
      <!-- Sem rótulo: o campo fica sem nome, e o fragmento de formato não é o
           assunto dele. O leitor de tela anuncia só "campo de edição". -->
      <div ndsInputGroup>
        <div ndsInputGroupAddon align="inline-start">
          <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
        </div>
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.siteField')" />
        <div ndsInputGroupAddon align="inline-end">
          <span ndsInputGroupText>.com</span>
        </div>
      </div>
    </ng-template>

    <!-- ── Variantes ──────────────────────────────────────────────────── -->

    <ng-template #tplVariantInlineStart>
      <div ndsInputGroup>
        <div ndsInputGroupAddon align="inline-start">
          <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
        </div>
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.siteField')" />
      </div>
    </ng-template>

    <ng-template #tplVariantInlineEnd>
      <div ndsInputGroup>
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.siteField')" />
        <div ndsInputGroupAddon align="inline-end">
          <span ndsInputGroupText>.com</span>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVariantBlockStart>
      <div ndsInputGroup>
        <div ndsInputGroupAddon align="block-start">
          <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
        </div>
        <textarea
          ndsInputGroupTextarea
          rows="2"
          [placeholder]="t('demonstration.labels.note')"
        ></textarea>
      </div>
    </ng-template>

    <ng-template #tplVariantBlockEnd>
      <div ndsInputGroup>
        <textarea
          ndsInputGroupTextarea
          rows="2"
          [placeholder]="t('demonstration.labels.note')"
        ></textarea>
        <div ndsInputGroupAddon align="block-end">
          <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>
            {{ t('demonstration.labels.send') }}
          </button>
        </div>
      </div>
    </ng-template>

    <!-- ── Composições ────────────────────────────────────────────────── -->

    <ng-template #tplCompSearch>
      <div ndsInputGroup [attr.aria-label]="t('demonstration.labels.searchGroup')">
        <div ndsInputGroupAddon align="inline-start">
          <ng-container [ngTemplateOutlet]="tplIconSearch" />
        </div>
        <input ndsInputGroupInput [placeholder]="t('demonstration.labels.searchField')" />
        <div ndsInputGroupAddon align="inline-end">
          <span ndsInputGroupText>{{ t('demonstration.labels.shortcut') }}</span>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompPassword>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" [attr.for]="compositionFieldId">
          {{ t('demonstration.labels.password') }}
        </label>
        <div ndsInputGroup [attr.aria-label]="t('demonstration.labels.password')">
          <input
            ndsInputGroupInput
            [id]="compositionFieldId"
            [type]="compositionRevealed() ? 'text' : 'password'"
          />
          <div ndsInputGroupAddon align="inline-end">
            <button
              ndsButton
              variant="ghost"
              size="icon-xs"
              ndsInputGroupButton
              [attr.aria-label]="compositionRevealed()
                ? t('demonstration.labels.hide')
                : t('demonstration.labels.reveal')"
              (click)="toggleComposition()"
            >
              @if (compositionRevealed()) {
                <ng-container [ngTemplateOutlet]="tplIconHide" />
              } @else {
                <ng-container [ngTemplateOutlet]="tplIconReveal" />
              }
            </button>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompAffix>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" [attr.for]="affixFieldId">
          {{ t('demonstration.labels.siteGroup') }}
        </label>
        <div ndsInputGroup>
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>{{ t('demonstration.labels.prefix') }}</span>
          </div>
          <input
            ndsInputGroupInput
            [id]="affixFieldId"
            [placeholder]="t('demonstration.labels.siteField')"
          />
          <div ndsInputGroupAddon align="inline-end">
            <span ndsInputGroupText>.com</span>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompTextareaToolbar>
      <div ndsInputGroup [attr.aria-label]="t('demonstration.labels.note')">
        <textarea
          ndsInputGroupTextarea
          rows="3"
          [placeholder]="t('demonstration.labels.note')"
        ></textarea>
        <div ndsInputGroupAddon align="block-end">
          <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>
            {{ t('demonstration.labels.send') }}
          </button>
        </div>
      </div>
    </ng-template>

    <!-- ── Página ─────────────────────────────────────────────────────── -->

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="input-group"
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
          <!-- A composição que prova a decisão que mais custa quando se erra: o
               que age dentro da moldura é um BOTÃO, e o que ele fez é contado
               pela PALAVRA, não pelo desenho do ícone. -->
          <div class="nds-stack nds-w-full" data-spacing="sm">
            <label class="nds-label" [attr.for]="demoFieldId">
              {{ t('demonstration.labels.password') }}
            </label>
            <div ndsInputGroup [attr.aria-label]="t('demonstration.labels.password')">
              <input
                ndsInputGroupInput
                [id]="demoFieldId"
                [type]="demoRevealed() ? 'text' : 'password'"
              />
              <div ndsInputGroupAddon align="inline-end">
                <button
                  ndsButton
                  variant="ghost"
                  size="icon-xs"
                  ndsInputGroupButton
                  [attr.aria-label]="demoRevealed()
                    ? t('demonstration.labels.hide')
                    : t('demonstration.labels.reveal')"
                  (click)="toggleDemo()"
                >
                  @if (demoRevealed()) {
                    <ng-container [ngTemplateOutlet]="tplIconHide" />
                  } @else {
                    <ng-container [ngTemplateOutlet]="tplIconReveal" />
                  }
                </button>
              </div>
            </div>
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
          [description]="importDescription()"
          [code]="importCode"
          componentSlug="input-group"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="input-group"
          language="ts"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="input-group"
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
          [extensibilityCode]="t('props.extensibilityCode')"
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
          componentSlug="input-group"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="input-group"
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
export class NdsInputGroupDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly demoFieldId = DEMO_FIELD_ID;
  protected readonly compositionFieldId = COMPOSITION_FIELD_ID;
  protected readonly affixFieldId = AFFIX_FIELD_ID;
  protected readonly doDontFieldId = DO_DONT_FIELD_ID;
  protected readonly invalidMessageId = INVALID_MESSAGE_ID;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Estado da demonstração e o do cartão de composição, separados de
   *  propósito: brincar com o exemplo não deve empurrar a demonstração. */
  protected readonly demoRevealed = signal(false);
  protected readonly compositionRevealed = signal(false);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');

  private readonly tplVariantInlineStart =
    viewChild.required<TemplateRef<unknown>>('tplVariantInlineStart');
  private readonly tplVariantInlineEnd =
    viewChild.required<TemplateRef<unknown>>('tplVariantInlineEnd');
  private readonly tplVariantBlockStart =
    viewChild.required<TemplateRef<unknown>>('tplVariantBlockStart');
  private readonly tplVariantBlockEnd =
    viewChild.required<TemplateRef<unknown>>('tplVariantBlockEnd');

  private readonly tplCompSearch = viewChild.required<TemplateRef<unknown>>('tplCompSearch');
  private readonly tplCompPassword = viewChild.required<TemplateRef<unknown>>('tplCompPassword');
  private readonly tplCompAffix = viewChild.required<TemplateRef<unknown>>('tplCompAffix');
  private readonly tplCompTextareaToolbar =
    viewChild.required<TemplateRef<unknown>>('tplCompTextareaToolbar');

  /**
   * A demonstração é produto: quem alterna aqui dispara o mesmo evento que o
   * componente dispararia num app. O payload leva valores ESTÁVEIS — o rótulo
   * traduzido partiria um evento em três no GA4.
   */
  protected toggleDemo(): void {
    const next = !this.demoRevealed();
    this.demoRevealed.set(next);
    track('button_click', {
      component: SLUG,
      variant: next ? 'reveal' : 'hide',
      location: 'docs_demo',
    });
  }

  protected toggleComposition(): void {
    const next = !this.compositionRevealed();
    this.compositionRevealed.set(next);
    track('button_click', {
      component: SLUG,
      variant: next ? 'reveal' : 'hide',
      location: 'docs_composition',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly importDescription = computed(() => {
    dict();
    return stripHtml(t('description'));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`anatomy.item${i}`));
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
      items: [1, 2, 3, 4].map((i) => ({
        s: toPlainText(t(`usage.scenarios.item${i}.s`)),
        u: toPlainText(t(`usage.scenarios.item${i}.u`)),
        a: toPlainText(t(`usage.scenarios.item${i}.a`)),
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
      items: ['prefix', 'suffix', 'addonButton', 'groupName'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  // O container renderiza cada item por `innerHTML` sanitizado, então o
  // `<code>` do conteúdo compartilhado chega como marcação — passar por
  // `toPlainText` aqui imprimiria a tag literal.
  protected readonly usageDo = computed(() => {
    dict();
    return {
      title: t('usage.do.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
    };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
      [this.tplDoDont3Do(), this.tplDoDont3Dont()],
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
    const previews: Record<(typeof ALIGNMENT_KEYS)[number], TemplateRef<unknown>> = {
      inlineStart: this.tplVariantInlineStart(),
      inlineEnd: this.tplVariantInlineEnd(),
      blockStart: this.tplVariantBlockStart(),
      blockEnd: this.tplVariantBlockEnd(),
    };
    // O mesmo construtor de snippet que alimenta o painel Code das stories:
    // snippet escrito à mão aqui divergiria da demo, e cada metade estaria
    // certa sozinha.
    const snippets: Record<(typeof ALIGNMENT_KEYS)[number], string> = {
      inlineStart: inputGroupSnippet({
        placeholder: t('demonstration.labels.siteField'),
        addons: [{ align: 'inline-start', text: t('demonstration.labels.prefix') }],
      }),
      inlineEnd: inputGroupSnippet({
        placeholder: t('demonstration.labels.siteField'),
        addons: [{ align: 'inline-end', text: '.com' }],
      }),
      blockStart: inputGroupSnippet({
        placeholder: t('demonstration.labels.note'),
        multiline: true,
        addons: [{ align: 'block-start', text: t('demonstration.labels.prefix') }],
      }),
      blockEnd: inputGroupSnippet({
        placeholder: t('demonstration.labels.note'),
        multiline: true,
        addons: [
          {
            align: 'block-end',
            buttonLabel: t('demonstration.labels.send'),
            buttonHandler: 'send',
          },
        ],
      }),
    };

    return ALIGNMENT_KEYS.map((key) => ({
      name: t(`variants.items.${key}.name`),
      description: t(`variants.items.${key}.description`),
      // Chave estável de tracking, IGUAL à chave do item no conteúdo: o `name`
      // chega traduzido, e sem ela o mesmo botão sairia com um valor por idioma.
      trackId: key,
      code: snippets[key],
      preview: previews[key],
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const previews: Record<(typeof COMPOSITION_KEYS)[number], TemplateRef<unknown>> = {
      search: this.tplCompSearch(),
      password: this.tplCompPassword(),
      affix: this.tplCompAffix(),
      textareaToolbar: this.tplCompTextareaToolbar(),
    };
    const snippets: Record<(typeof COMPOSITION_KEYS)[number], string> = {
      search: inputGroupSnippet({
        ariaLabel: t('demonstration.labels.searchGroup'),
        placeholder: t('demonstration.labels.searchField'),
        addons: [
          { align: 'inline-start', icon: 'search' },
          { align: 'inline-end', text: t('demonstration.labels.shortcut') },
        ],
      }),
      password: inputGroupSnippet({
        ariaLabel: t('demonstration.labels.password'),
        placeholder: '',
        type: 'password',
        addons: [
          {
            align: 'inline-end',
            icon: 'reveal',
            buttonToggle: true,
            buttonSize: 'icon-xs',
            buttonHandler: 'toggleReveal',
          },
        ],
      }),
      affix: inputGroupSnippet({
        placeholder: t('demonstration.labels.siteField'),
        addons: [
          { align: 'inline-start', text: t('demonstration.labels.prefix') },
          { align: 'inline-end', text: '.com' },
        ],
      }),
      textareaToolbar: inputGroupSnippet({
        ariaLabel: t('demonstration.labels.note'),
        placeholder: t('demonstration.labels.note'),
        multiline: true,
        addons: [
          {
            align: 'block-end',
            buttonLabel: t('demonstration.labels.send'),
            buttonHandler: 'send',
          },
        ],
      }),
    };

    return COMPOSITION_KEYS.map((key) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      trackId: key,
      code: snippets[key],
      preview: previews[key],
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
    return ['rest', 'focus', 'invalid', 'disabled'].map((key) => ({
      label: t(`states.${key}.label`),
      trigger: toPlainText(t(`states.${key}.trigger`)),
      behavior: toPlainText(t(`states.${key}.behavior`)),
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
    const line = (name: string, key: string, type?: string) => ({
      name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });

    return [
      {
        title: 'NdsInputGroup',
        cols,
        items: [
          line('aria-label', 'ariaLabel', 'string (atributo aria-label)'),
          line('class', 'class'),
        ],
      },
      {
        title: 'NdsInputGroupAddon',
        cols,
        items: [line('align', 'align'), line('class', 'class')],
      },
      {
        title: 'NdsInputGroupText',
        cols,
        items: [line('conteúdo projetado', 'text', 'ng-content'), line('class', 'class')],
      },
      {
        title: 'NdsInputGroupButton',
        cols,
        // As duas primeiras linhas são entradas do `ndsButton`, escritas no
        // MESMO elemento: a diretiva daqui não tem entrada nenhuma. É a
        // divergência de API desta stack, e a tabela a diz em vez de escondê-la.
        items: [
          line('size (no ndsButton)', 'size'),
          line('variant (no ndsButton)', 'variant'),
          line('class', 'class'),
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
    return TOKEN_ROWS.map(([key, token]) => ({
      token,
      value: toPlainText(t(`tokens.table.${key}.class`)),
      description: toPlainText(t(`tokens.table.${key}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => stripHtml(t(`accessibility.items.item${i}`)));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',         description: toPlainText(t('accessibility.keyboard.tab'))      },
      { key: 'Shift + Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',       description: toPlainText(t('accessibility.keyboard.enter'))    },
      { key: 'Space',       description: toPlainText(t('accessibility.keyboard.space'))    },
    ];
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = inputGroupTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'input',    path: '?path=/docs/primitives-form-input--docs'    },
      { key: 'textarea', path: '?path=/docs/primitives-form-textarea--docs' },
      { key: 'button',   path: '?path=/docs/primitives-form-button--docs'   },
      { key: 'form',     path: '?path=/docs/primitives-form-form--docs'     },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // 1–5 vêm do conteúdo compartilhado; 6 e 7 são os overrides desta stack.
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        event: 'button_click',
        trigger: toPlainText(t('analytics.table.button_click.trigger')),
        payload: toPlainText(t('analytics.table.button_click.payload')),
      },
      {
        event: 'docs_page_view',
        trigger: tNav('common.pageMount'),
        payload: 'component_name, locale, page_title',
      },
      {
        event: 'docs_section_viewed',
        trigger: toPlainText(t('analytics.table.docs_section_viewed.trigger')),
        payload: toPlainText(t('analytics.table.docs_section_viewed.payload')),
      },
    ];
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
      items: [1, 2, 3, 4, 5].map((i) => ({
        action: toPlainText(t(`testes.functional.item${i}.action`)),
        result: stripHtml(toPlainText(t(`testes.functional.item${i}.result`))),
        priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // O nível WCAG e o instrumento saem daqui, e não do conteúdo compartilhado:
    // o critério é a frase, e onde ele é medido é decisão desta stack.
    const how = [
      'axe-core via Storybook',
      'play (Playground)',
      'play (Playground)',
      'play (Playground)',
      'play (Invalid)',
      'play (Playground)',
      'play (Playground)',
    ];
    const levels = ['2.2 AA', '4.1.2', '4.1.2', '2.1.1', '1.4.1', '4.1.3', '1.4.4'];
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: levels[i - 1],
        how: how[i - 1],
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: [1, 2, 3, 4].map((i) => ({
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
          component_name: SLUG,
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
