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
import { NDS_NAVIGATION_MENU } from '@/components/ui/navigation-menu';
import uiTranslations from '@/i18n/ui.json';
import navigationMenuTranslations from '@shared/content/navigation-menu/translations.json';

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

// Overrides: só texto DESCRITIVO que muda (ou nasce) nesta stack. Nenhum
// snippet `*Code` entra aqui — snippet em override fica preso a um stack e some
// do conteúdo compartilhado; os que divergem viram const neste arquivo, com a
// divergência reportada.
//
// `props.*` — a superfície deste stack não é a das seis linhas da tabela
// compartilhada: o primitivo chama as esperas de `delay`/`closeDelay` (não
// `delayDuration`/`skipDelayDuration`), e há inputs que só existem aqui.
// `notes.item1` — o texto compartilhado lista as libs das outras stacks pelo
// nome, e cada docs page é consumida isoladamente.
// `notes.item2`/`item4`/`item5` — descrevem o comportamento e o markup daqui.
// `notes.item7`/`item8` — decisões deste stack que não existem no conteúdo.
const { t, dict } = useTranslation(navigationMenuTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'props.delay.description':
      'Espera antes de abrir o painel quando o ponteiro entra no gatilho. Zero abre no mesmo instante.',
    'props.closeDelay.description':
      'Espera antes de fechar depois que o ponteiro sai da barra. É o que permite atravessar o vão entre gatilho e painel sem perder o painel no caminho.',
    'props.align.description':
      'Alinhamento do painel no eixo perpendicular ao lado de abertura.',
    'props.sideOffset.description':
      'Distância em pixels entre o painel e a barra.',
    'props.indicator.description':
      'Seta apontando para o gatilho ativo. Nasce desligada: é feedback redundante, já que o gatilho muda de fundo e a seta do gatilho gira.',
    'props.dir.description':
      'Direção de leitura. Inverte o sentido das setas e o lado de abertura na barra vertical.',
    'props.onOpenChange.description':
      'Emite a cada abertura e fechamento, com o motivo (ponteiro, teclado, clique fora).',
    'props.itemValue.description':
      'Identificador do item. Só é obrigatório quando o item tem painel — é por ele que o estado sabe qual painel mostrar.',
    'props.triggerDisabled.description':
      'Bloqueia a abertura deste item. O gatilho continua alcançável pelo teclado, para ser anunciado como desabilitado.',
    'props.openOnHover.description':
      'Se o painel também abre quando o ponteiro entra no gatilho. Desligado, só o clique e o teclado abrem.',
    'props.forceMount.description':
      'Mantém o painel instanciado mesmo com o item fechado. Serve a animação de saída controlada por fora.',
    'props.linkActive.description':
      'Marca o destino como a página atual: o leitor de tela anuncia "página atual" e o CSS destaca o fundo.',
    'props.closeOnClick.description':
      'Se escolher o destino fecha a barra. O destino de dentro do painel já fecha sempre — navegar é sair da página.',
    'props.onSelect.description':
      'Emite quando o destino é escolhido, por clique ou por Enter.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/navigation-menu</code> — entrega o estado compartilhado, <code>aria-expanded</code> e <code>aria-controls</code> no gatilho, roving tabindex entre os itens da barra, setas conforme a orientação, teclado dentro do painel aberto (setas, Home/End, Tab saindo pela ordem lógica da barra), Escape com devolução do foco e posicionamento com fuga de colisão.',
    'notes.item2':
      '<strong>Painel compartilhado</strong>: um positioner, um popup e um viewport para a barra inteira. O viewport instancia o conteúdo do item ativo e o destrói na troca — é daí que vem a transição de tamanho entre um painel e o seguinte.',
    'notes.item4':
      '<strong>Mega-menu</strong>: a raiz visual do painel é o elemento que o viewport mede, então é nela que moram a largura e o respiro — <code>class="nds-grid nds-w-lg" data-fixed data-cols="2"</code> num <code>&lt;ul&gt;</code> resolve duas colunas com descrição.',
    'notes.item5':
      '<strong>Seta indicadora</strong>: opcional e desligada por padrão. Ela é redundante com o fundo do gatilho ativo e com a rotação do chevron, então quem compõe decide se vale o ruído visual.',
    'notes.item6':
      '<strong>Nome acessível obrigatório</strong>: a barra é um marco de página, e sem <code>aria-label</code> o leitor de tela anuncia apenas "navegação". Não há padrão embutido de propósito — duas barras nascendo com o mesmo nome é exatamente o que a verificação automática reprova.',
    'notes.item7':
      '<strong>Não é menu de comandos</strong>: os destinos são <code>&lt;a href&gt;</code> de verdade e o painel não recebe papel de menu. Por isso o gatilho também não anuncia <code>aria-haspopup</code> — anunciar um popup obriga o painel a ter o papel prometido, e prometer "menu" onde há uma lista de páginas engana quem usa leitor de tela. O que fica é o padrão de divulgação: <code>aria-expanded</code> mais <code>aria-controls</code>.',
    'notes.item8':
      '<strong>O conteúdo é um template</strong>: o miolo do painel é declarado como <code>&lt;ng-template&gt;</code> porque quem o monta e desmonta é o painel compartilhado, não a página. Conteúdo projetado como elemento sobreviveria ao fechamento e levaria o foco junto.',
  },
  en: {
    'props.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'props.delay.description':
      'Wait before opening the panel when the pointer enters the trigger. Zero opens immediately.',
    'props.closeDelay.description':
      'Wait before closing once the pointer leaves the bar. It is what lets the pointer cross the gap between trigger and panel without losing the panel on the way.',
    'props.align.description': 'Panel alignment on the axis perpendicular to the opening side.',
    'props.sideOffset.description': 'Distance in pixels between the panel and the bar.',
    'props.indicator.description':
      'Arrow pointing at the active trigger. Off by default: it is redundant feedback, since the trigger already changes background and its caret rotates.',
    'props.dir.description':
      'Reading direction. Flips arrow keys and the opening side on a vertical bar.',
    'props.onOpenChange.description':
      'Emits on every open and close, with the reason (pointer, keyboard, outside press).',
    'props.itemValue.description':
      'Item identifier. Required only when the item has a panel — it is how the shared state knows which panel to show.',
    'props.triggerDisabled.description':
      'Blocks this item from opening. The trigger stays reachable by keyboard so it gets announced as disabled.',
    'props.openOnHover.description':
      'Whether the panel also opens when the pointer enters the trigger. Off, only click and keyboard open it.',
    'props.forceMount.description':
      'Keeps the panel instantiated while its item is closed. For exit animations driven from outside.',
    'props.linkActive.description':
      'Marks the destination as the current page: screen readers announce "current page" and the CSS highlights the background.',
    'props.closeOnClick.description':
      'Whether choosing the destination closes the bar. A destination inside the panel always closes it — navigating means leaving the page.',
    'props.onSelect.description': 'Emits when the destination is chosen, by click or by Enter.',
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/navigation-menu</code> — provides the shared state, <code>aria-expanded</code> and <code>aria-controls</code> on the trigger, roving tabindex across the bar, arrow keys per orientation, keyboard handling inside the open panel (arrows, Home/End, Tab leaving through the bar order), Escape with focus return and collision-aware positioning.',
    'notes.item2':
      '<strong>Shared panel</strong>: one positioner, one popup and one viewport for the whole bar. The viewport instantiates the active item content and destroys it on switch — that is where the size transition between panels comes from.',
    'notes.item4':
      '<strong>Mega-menu</strong>: the panel visual root is the element the viewport measures, so width and padding live there — <code>class="nds-grid nds-w-lg" data-fixed data-cols="2"</code> on a <code>&lt;ul&gt;</code> gives two columns with descriptions.',
    'notes.item5':
      '<strong>Indicator arrow</strong>: optional and off by default. It duplicates the active trigger background and the caret rotation, so whoever composes decides whether the visual noise is worth it.',
    'notes.item6':
      '<strong>Accessible name required</strong>: the bar is a page landmark, and without <code>aria-label</code> a screen reader announces just "navigation". There is deliberately no built-in default — two bars born with the same name is exactly what automated checking rejects.',
    'notes.item7':
      '<strong>Not a command menu</strong>: destinations are real <code>&lt;a href&gt;</code> elements and the panel carries no menu role. That is also why the trigger does not announce <code>aria-haspopup</code> — announcing a popup commits the panel to the promised role, and promising "menu" where there is a list of pages misleads screen reader users. What remains is the disclosure pattern: <code>aria-expanded</code> plus <code>aria-controls</code>.',
    'notes.item8':
      '<strong>Content is a template</strong>: the panel body is declared as an <code>&lt;ng-template&gt;</code> because the shared panel mounts and unmounts it, not the page. Content projected as an element would survive closing and take focus with it.',
  },
  es: {
    'props.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'props.delay.description':
      'Espera antes de abrir el panel cuando el puntero entra en el disparador. Cero abre al instante.',
    'props.closeDelay.description':
      'Espera antes de cerrar después de que el puntero sale de la barra. Es lo que permite cruzar el hueco entre disparador y panel sin perder el panel en el camino.',
    'props.align.description': 'Alineación del panel en el eje perpendicular al lado de apertura.',
    'props.sideOffset.description': 'Distancia en píxeles entre el panel y la barra.',
    'props.indicator.description':
      'Flecha que apunta al disparador activo. Nace apagada: es feedback redundante, ya que el disparador cambia de fondo y su chevron gira.',
    'props.dir.description':
      'Dirección de lectura. Invierte el sentido de las flechas y el lado de apertura en la barra vertical.',
    'props.onOpenChange.description':
      'Emite en cada apertura y cierre, con el motivo (puntero, teclado, clic fuera).',
    'props.itemValue.description':
      'Identificador del item. Solo es obligatorio cuando el item tiene panel — es como el estado sabe qué panel mostrar.',
    'props.triggerDisabled.description':
      'Bloquea la apertura de este item. El disparador sigue alcanzable por teclado, para ser anunciado como deshabilitado.',
    'props.openOnHover.description':
      'Si el panel también abre cuando el puntero entra en el disparador. Apagado, solo el clic y el teclado lo abren.',
    'props.forceMount.description':
      'Mantiene el panel instanciado aunque su item esté cerrado. Sirve a animaciones de salida controladas desde fuera.',
    'props.linkActive.description':
      'Marca el destino como la página actual: el lector de pantalla anuncia "página actual" y el CSS destaca el fondo.',
    'props.closeOnClick.description':
      'Si elegir el destino cierra la barra. El destino dentro del panel siempre la cierra — navegar es salir de la página.',
    'props.onSelect.description': 'Emite cuando el destino es elegido, por clic o por Enter.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/navigation-menu</code> — aporta el estado compartido, <code>aria-expanded</code> y <code>aria-controls</code> en el disparador, roving tabindex entre los items de la barra, flechas según la orientación, teclado dentro del panel abierto (flechas, Home/End, Tab saliendo por el orden lógico de la barra), Escape con devolución del foco y posicionamiento con evasión de colisión.',
    'notes.item2':
      '<strong>Panel compartido</strong>: un positioner, un popup y un viewport para toda la barra. El viewport instancia el contenido del item activo y lo destruye al cambiar — de ahí viene la transición de tamaño entre un panel y el siguiente.',
    'notes.item4':
      '<strong>Mega-menú</strong>: la raíz visual del panel es el elemento que el viewport mide, así que el ancho y el respiro viven ahí — <code>class="nds-grid nds-w-lg" data-fixed data-cols="2"</code> en un <code>&lt;ul&gt;</code> resuelve dos columnas con descripción.',
    'notes.item5':
      '<strong>Flecha indicadora</strong>: opcional y apagada por defecto. Duplica el fondo del disparador activo y la rotación del chevron, así que quien compone decide si vale el ruido visual.',
    'notes.item6':
      '<strong>Nombre accesible obligatorio</strong>: la barra es un punto de referencia de la página, y sin <code>aria-label</code> el lector de pantalla anuncia solo "navegación". No hay valor por defecto a propósito — dos barras naciendo con el mismo nombre es justo lo que la verificación automática rechaza.',
    'notes.item7':
      '<strong>No es menú de comandos</strong>: los destinos son <code>&lt;a href&gt;</code> de verdad y el panel no lleva papel de menú. Por eso el disparador tampoco anuncia <code>aria-haspopup</code> — anunciar un popup obliga al panel a tener el papel prometido, y prometer "menú" donde hay una lista de páginas engaña a quien usa lector de pantalla. Lo que queda es el patrón de divulgación: <code>aria-expanded</code> más <code>aria-controls</code>.',
    'notes.item8':
      '<strong>El contenido es una plantilla</strong>: el cuerpo del panel se declara como <code>&lt;ng-template&gt;</code> porque quien lo monta y desmonta es el panel compartido, no la página. Contenido proyectado como elemento sobreviviría al cierre y se llevaría el foco.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Sem entrada para Composições: o conteúdo compartilhado deste slug não tem
// `variants.compositions` — as quatro composições canônicas moram em
// `variants.items`, junto das duas orientações, e saem todas na mesma seção.
// Uma seção de composições sem conteúdo seria placeholder, e o auditor cobra os
// dois sentidos: conteúdo sem seção e seção sem conteúdo.
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

// Hardcoded, e não `t('anatomy.structureCode')`: a variante `angular` do
// conteúdo compartilhado envolve a barra num elemento `<nds-navigation-menu>` e
// não distingue o destino da barra do destino de dentro do painel. Aqui a raiz
// é o próprio `<nav>` (é onde o `aria-label` faz sentido e é o markup do
// Vanilla) e o painel tem uma raiz visual própria, que é o que o viewport mede.
// Mesmo caminho do TabsDocs e do DropdownMenuDocs; a correção do conteúdo
// compartilhado está reportada.
const ANATOMY_CODE = `<nav ndsNavigationMenu aria-label="Navegação principal">
  <ul ndsNavigationMenuList>
    <li ndsNavigationMenuItem>
      <a ndsNavigationMenuLink href="/" active>Início</a>
    </li>

    <li ndsNavigationMenuItem value="produtos">
      <button ndsNavigationMenuTrigger>Produtos</button>

      <ng-template ndsNavigationMenuContent>
        <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
          <li>
            <a ndsNavigationMenuChild href="/produtos/inicial">
              <div ndsNavigationMenuChildLabel>Plano Inicial</div>
            </a>
          </li>
        </ul>
      </ng-template>
    </li>
  </ul>
</nav>`;

const INTERFACE_CODE = `// A raiz é componente: é ela que declara o portal, o positioner, o popup
// e o viewport compartilhados por toda a barra.
@Component({
  selector: 'nav[ndsNavigationMenu]',
  hostDirectives: [
    { directive: RdxNavigationMenuRoot,
      inputs: ['value', 'defaultValue', 'orientation', 'dir', 'delay', 'closeDelay'],
      outputs: ['valueChange', 'onValueChange', 'onOpenChange'] },
  ],
})
export class NdsNavigationMenu {
  readonly align = input<'start' | 'center' | 'end'>('start');
  readonly sideOffset = input(8);
  readonly indicator = input(false, { transform: booleanAttribute });
}

// O miolo do painel é um <ng-template>: quem monta e desmonta é o viewport.
@Directive({
  selector: 'ng-template[ndsNavigationMenuContent]',
  hostDirectives: [{ directive: RdxNavigationMenuContent, inputs: ['forceMount'] }],
})
export class NdsNavigationMenuContent {}

// Destino da barra e destino de dentro do painel têm desenhos diferentes,
// então têm classes diferentes — a mesma separação que o Vanilla faz.
@Directive({
  selector: 'a[ndsNavigationMenuLink]',
  hostDirectives: [
    { directive: RdxNavigationMenuLink,
      inputs: ['active', 'closeOnClick'],
      outputs: ['onSelect'] },
  ],
})
export class NdsNavigationMenuLink {}`;

// Também hardcoded: a variante `angular` de `props.extensibilityCode` usa
// `delayDuration`/`skipDelayDuration`, que são os nomes das outras stacks. O
// primitivo deste stack chama as duas esperas de `delay` e `closeDelay`, e o
// exemplo aqui é o que compila.
const EXTENSIBILITY_CODE = `<!-- Barra controlada, com esperas próprias e analytics -->
<nav
  ndsNavigationMenu
  aria-label="Navegação principal"
  [(value)]="aberto"
  [delay]="150"
  [closeDelay]="250"
  (onOpenChange)="onOpenChange($event)"
>
  <ul ndsNavigationMenuList>
    @for (secao of secoes; track secao.value) {
      <li ndsNavigationMenuItem [value]="secao.value">
        <button ndsNavigationMenuTrigger>{{ secao.label }}</button>

        <ng-template ndsNavigationMenuContent>
          <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
            @for (destino of secao.destinos; track destino.href) {
              <li>
                <a
                  ndsNavigationMenuChild
                  [href]="destino.href"
                  [active]="destino.href === rotaAtual()"
                  (click)="onNavigate(destino)"
                >
                  <div ndsNavigationMenuChildLabel>{{ destino.label }}</div>
                </a>
              </li>
            }
          </ul>
        </ng-template>
      </li>
    }
  </ul>
</nav>

// no componente
readonly aberto = signal<string | null>(null);

onNavigate(destino: Destino) {
  // O payload leva o identificador do destino, nunca o rótulo traduzido: o
  // rótulo partiria um evento em três no GA4, um por idioma.
  track('navigation_click', {
    component: 'navigation_menu',
    label: destino.id,
    destination: destino.href,
    location: 'header',
  });
}`;

const IMPORT_CODE = `import { NDS_NAVIGATION_MENU } from '@/components/ui/navigation-menu';`;

// Snippets das seis fichas da seção Variantes. Ficam aqui, e não no conteúdo
// compartilhado, porque descrevem a composição DESTE stack.
const HORIZONTAL_CODE = `<nav ndsNavigationMenu aria-label="Navegação principal">
  <ul ndsNavigationMenuList>…</ul>
</nav>`;

const VERTICAL_CODE = `<nav ndsNavigationMenu aria-label="Navegação da conta" orientation="vertical">
  <ul ndsNavigationMenuList>…</ul>
</nav>`;

const CODE_SIMPLE_LINK = `<ul ndsNavigationMenuList>
  <li ndsNavigationMenuItem>
    <a ndsNavigationMenuLink href="/" active>Início</a>
  </li>
  <li ndsNavigationMenuItem>
    <a ndsNavigationMenuLink href="/precos">Preços</a>
  </li>
</ul>`;

const CODE_WITH_DROPDOWN = `<li ndsNavigationMenuItem value="planos">
  <button ndsNavigationMenuTrigger>Planos</button>

  <ng-template ndsNavigationMenuContent>
    <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
      <li>
        <a ndsNavigationMenuChild href="/planos/inicial">
          <div ndsNavigationMenuChildLabel>Plano Inicial</div>
        </a>
      </li>
    </ul>
  </ng-template>
</li>`;

const CODE_MEGA_MENU = `<ng-template ndsNavigationMenuContent>
  <ul
    ndsNavigationMenuPanel
    class="nds-grid nds-list-none nds-w-lg"
    data-fixed
    data-cols="2"
    data-spacing="sm"
  >
    <li>
      <a ndsNavigationMenuChild href="/solucoes/marketing">
        <div ndsNavigationMenuChildLabel>Para Marketing</div>
        <p ndsNavigationMenuChildDescription>Campanhas, automação e atribuição.</p>
      </a>
    </li>
  </ul>
</ng-template>`;

const CODE_FEATURED = `<ng-template ndsNavigationMenuContent>
  <div ndsNavigationMenuPanel class="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
    <a ndsNavigationMenuChild href="/comece" class="nds-h-full">
      <div ndsNavigationMenuChildLabel>Comece agora</div>
      <p ndsNavigationMenuChildDescription>Publique em menos de cinco minutos.</p>
    </a>

    <ul class="nds-stack nds-list-none" data-spacing="xs">
      <li>
        <a ndsNavigationMenuChild href="/guias">
          <div ndsNavigationMenuChildLabel>Guias</div>
        </a>
      </li>
    </ul>
  </div>
</ng-template>`;

/** Destinos da demonstração — base estável do payload de analytics. */
const TARGETS_DEMO = [
  { id: 'inicial',      href: '#inicial'      },
  { id: 'profissional', href: '#profissional' },
  { id: 'empresarial',  href: '#empresarial'  },
] as const;

@Component({
  selector: 'nds-navigation-menu-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_NAVIGATION_MENU,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Cada barra desta página é um MARCO de navegação, e uma docs page de
      navegação mostra a peça quinze vezes. Marcos com o mesmo papel precisam de
      nomes distintos: sem isso o leitor de tela anuncia "navegação" quinze
      vezes sem dizer qual é qual, e a verificação automática reprova em
      landmark-unique. Daí o \`rotulo(...)\`, que compõe o nome com o rótulo do
      próprio exemplo.

      As barras das fichas nascem FECHADAS. Um painel aberto é posicionado em
      \`fixed\` e flutua por cima do que vier depois dele: seis fichas abertas
      cobririam a própria documentação. Quem lê abre a que quiser — e o estado
      aberto é o que as stories capturam para a regressão visual.
    -->
    <ng-template #tplDoDont1Do>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.doDont'), tNav('common.do') + ' 1')">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>
              {{ t('demonstration.labels.simpleLink') }}
            </a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#sobre">{{ t('variants.items.vertical') }}</a>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!--
        O rótulo genérico É o erro que esta ficha ilustra: "Menu" não diz que
        navegação é essa. Um exemplo literalmente SEM rótulo criaria um marco
        anônimo na própria documentação — mostrar o defeito não pode significar
        entregá-lo à pessoa que lê a página.
      -->
      <nav ndsNavigationMenu [attr.aria-label]="t('usage.uxWriting.table.ariaLabel.bad')">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">
              {{ t('demonstration.labels.simpleLink') }}
            </a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#sobre">{{ t('variants.items.vertical') }}</a>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.doDont'), tNav('common.do') + ' 2')">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem value="solucoes">
            <button ndsNavigationMenuTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
            <ng-template ndsNavigationMenuContent>
              <ul
                ndsNavigationMenuPanel
                class="nds-grid nds-list-none nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                @for (destino of destinosDemo; track destino.id) {
                  <li>
                    <a ndsNavigationMenuChild [href]="destino.href">
                      <div ndsNavigationMenuChildLabel>
                        {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                      </div>
                    </a>
                  </li>
                }
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.doDont'), tNav('common.dont') + ' 2')">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem value="tudo">
            <button ndsNavigationMenuTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                @for (n of dozeDestinos; track n) {
                  <li>
                    <a ndsNavigationMenuChild href="#destino">
                      <div ndsNavigationMenuChildLabel>
                        {{ t('usage.uxWriting.table.link.good') }} {{ n }}
                      </div>
                    </a>
                  </li>
                }
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplVarHorizontal>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.horizontal'))">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>
              {{ t('demonstration.labels.simpleLink') }}
            </a>
          </li>
          <li ndsNavigationMenuItem value="produtos">
            <button ndsNavigationMenuTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                @for (destino of destinosDemo; track destino.id) {
                  <li>
                    <a ndsNavigationMenuChild [href]="destino.href">
                      <div ndsNavigationMenuChildLabel>
                        {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                      </div>
                    </a>
                  </li>
                }
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplVarVertical>
      <nav
        ndsNavigationMenu
        orientation="vertical"
        [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.vertical'))"
      >
        <ul ndsNavigationMenuList class="nds-w-sm">
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>
              {{ t('demonstration.labels.simpleLink') }}
            </a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#relatorios">
              {{ t('usage.uxWriting.table.link.good') }}
            </a>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplVarSimple>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.linkSimples.name'))">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>
              {{ t('demonstration.labels.simpleLink') }}
            </a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#precos">
              {{ t('usage.uxWriting.table.link.good') }}
            </a>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplVarDropdown>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.comDropdown.name'))">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem value="planos">
            <button ndsNavigationMenuTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                @for (destino of destinosDemo; track destino.id) {
                  <li>
                    <a ndsNavigationMenuChild [href]="destino.href">
                      <div ndsNavigationMenuChildLabel>
                        {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                      </div>
                    </a>
                  </li>
                }
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplVarGrid>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.megaMenuGrid.name'))">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem value="solucoes">
            <button ndsNavigationMenuTrigger>{{ t('demonstration.labels.withGrid') }}</button>
            <ng-template ndsNavigationMenuContent>
              <ul
                ndsNavigationMenuPanel
                class="nds-grid nds-list-none nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                @for (destino of destinosDemo; track destino.id) {
                  <li>
                    <a ndsNavigationMenuChild [href]="destino.href">
                      <div ndsNavigationMenuChildLabel>
                        {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                      </div>
                      <p ndsNavigationMenuChildDescription>
                        {{ t('variants.items.megaMenuGrid.use') }}
                      </p>
                    </a>
                  </li>
                }
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>
    <ng-template #tplVarFeatured>
      <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.variants'), t('variants.items.comCardDestacado.name'))">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem value="recursos">
            <button ndsNavigationMenuTrigger>{{ t('demonstration.labels.withFeatured') }}</button>
            <ng-template ndsNavigationMenuContent>
              <div
                ndsNavigationMenuPanel
                class="nds-grid nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                <a ndsNavigationMenuChild href="#comece" class="nds-h-full">
                  <div ndsNavigationMenuChildLabel>
                    {{ t('usage.uxWriting.table.link.good') }}
                  </div>
                  <p ndsNavigationMenuChildDescription>
                    {{ t('variants.items.comCardDestacado.use') }}
                  </p>
                </a>
                <ul class="nds-stack nds-list-none" data-spacing="xs">
                  @for (destino of destinosDemo; track destino.id) {
                    <li>
                      <a ndsNavigationMenuChild [href]="destino.href">
                        <div ndsNavigationMenuChildLabel>{{ destino.id }}</div>
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </ng-template>
          </li>
        </ul>
      </nav>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="navigation-menu"
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
          <div class="nds-stack" data-spacing="lg">
            <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.demonstration'), t('demonstration.labels.simpleLink'))">
              <ul ndsNavigationMenuList>
                <li ndsNavigationMenuItem>
                  <a
                    ndsNavigationMenuLink
                    href="#inicio"
                    active
                    (click)="onNavigate('inicio', '#inicio')"
                  >{{ t('demonstration.labels.simpleLink') }}</a>
                </li>
                <li ndsNavigationMenuItem>
                  <a
                    ndsNavigationMenuLink
                    href="#precos"
                    (click)="onNavigate('precos', '#precos')"
                  >{{ t('usage.uxWriting.table.link.good') }}</a>
                </li>
              </ul>
            </nav>

            <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.demonstration'), t('demonstration.labels.withDropdown'))">
              <ul ndsNavigationMenuList>
                <li ndsNavigationMenuItem value="planos">
                  <button ndsNavigationMenuTrigger>
                    {{ t('usage.uxWriting.table.trigger.good') }}
                  </button>
                  <ng-template ndsNavigationMenuContent>
                    <ul
                      ndsNavigationMenuPanel
                      class="nds-stack nds-list-none nds-w-xs"
                      data-spacing="xs"
                    >
                      @for (destino of destinosDemo; track destino.id) {
                        <li>
                          <a
                            ndsNavigationMenuChild
                            [href]="destino.href"
                            (click)="onNavigate(destino.id, destino.href)"
                          >
                            <div ndsNavigationMenuChildLabel>
                              {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                            </div>
                          </a>
                        </li>
                      }
                    </ul>
                  </ng-template>
                </li>
              </ul>
            </nav>

            <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.demonstration'), t('demonstration.labels.withGrid'))">
              <ul ndsNavigationMenuList>
                <li ndsNavigationMenuItem value="solucoes">
                  <button ndsNavigationMenuTrigger>
                    {{ t('demonstration.labels.withGrid') }}
                  </button>
                  <ng-template ndsNavigationMenuContent>
                    <ul
                      ndsNavigationMenuPanel
                      class="nds-grid nds-list-none nds-w-lg"
                      data-fixed
                      data-cols="2"
                      data-spacing="sm"
                    >
                      @for (destino of destinosDemo; track destino.id) {
                        <li>
                          <a
                            ndsNavigationMenuChild
                            [href]="destino.href"
                            (click)="onNavigate(destino.id, destino.href)"
                          >
                            <div ndsNavigationMenuChildLabel>
                              {{ t('usage.uxWriting.table.link.good') }} {{ destino.id }}
                            </div>
                            <p ndsNavigationMenuChildDescription>
                              {{ t('variants.items.megaMenuGrid.use') }}
                            </p>
                          </a>
                        </li>
                      }
                    </ul>
                  </ng-template>
                </li>
              </ul>
            </nav>

            <nav ndsNavigationMenu [attr.aria-label]="rotulo(t('nav.demonstration'), t('demonstration.labels.withFeatured'))">
              <ul ndsNavigationMenuList>
                <li ndsNavigationMenuItem value="recursos">
                  <button ndsNavigationMenuTrigger>
                    {{ t('demonstration.labels.withFeatured') }}
                  </button>
                  <ng-template ndsNavigationMenuContent>
                    <div
                      ndsNavigationMenuPanel
                      class="nds-grid nds-w-lg"
                      data-fixed
                      data-cols="2"
                      data-spacing="sm"
                    >
                      <a
                        ndsNavigationMenuChild
                        href="#comece"
                        class="nds-h-full"
                        (click)="onNavigate('comece', '#comece')"
                      >
                        <div ndsNavigationMenuChildLabel>
                          {{ t('usage.uxWriting.table.link.good') }}
                        </div>
                        <p ndsNavigationMenuChildDescription>
                          {{ t('variants.items.comCardDestacado.use') }}
                        </p>
                      </a>
                      <ul class="nds-stack nds-list-none" data-spacing="xs">
                        @for (destino of destinosDemo; track destino.id) {
                          <li>
                            <a
                              ndsNavigationMenuChild
                              [href]="destino.href"
                              (click)="onNavigate(destino.id, destino.href)"
                            >
                              <div ndsNavigationMenuChildLabel>{{ destino.id }}</div>
                            </a>
                          </li>
                        }
                      </ul>
                    </div>
                  </ng-template>
                </li>
              </ul>
            </nav>
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
          componentSlug="navigation-menu"
          language="ts"
        />

        <nds-docs-compositions
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="navigation-menu"
          id="variantes"
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
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="navigation-menu"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="navigation-menu"
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
export class NdsNavigationMenuDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly destinosDemo = TARGETS_DEMO;
  protected readonly dozeDestinos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  protected readonly activeSection = signal<string | undefined>(undefined);

  /**
   * Nome do marco de navegação de cada exemplo.
   *
   * Marcos com o mesmo papel precisam de nomes DISTINTOS: sem isso o leitor de
   * tela anuncia "navegação" uma dúzia de vezes sem dizer qual é qual, e a
   * verificação automática reprova em landmark-unique.
   *
   * A SEÇÃO entra no nome porque o rótulo do exemplo sozinho não basta: a mesma
   * composição aparece na Demonstração e nas Variantes, com o mesmo nome nas
   * duas. Foi exatamente esse par que reprovou aqui — dois "Com card destacado"
   * na mesma página.
   */
  protected rotulo(secao: string, exemplo: string): string {
    const base = toPlainText(t('usage.uxWriting.table.ariaLabel.good'));
    return `${base} — ${toPlainText(secao)} — ${toPlainText(exemplo)}`;
  }

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplVarSimple = viewChild.required<TemplateRef<unknown>>('tplVarSimple');
  private readonly tplVarDropdown = viewChild.required<TemplateRef<unknown>>('tplVarDropdown');
  private readonly tplVarGrid = viewChild.required<TemplateRef<unknown>>('tplVarGrid');
  private readonly tplVarFeatured = viewChild.required<TemplateRef<unknown>>('tplVarFeatured');

  /**
   * A demonstração é produto: quem escolhe um destino aqui dispara o mesmo
   * evento que a barra dispararia num app. O payload leva o IDENTIFICADOR do
   * destino, nunca o rótulo traduzido — o rótulo partiria um evento em três no
   * GA4, um por idioma.
   */
  protected onNavigate(destino: string, href: string): void {
    track('navigation_click', {
      component: 'navigation_menu',
      label: destino,
      destination: href,
      location: 'docs-demonstration',
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
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`anatomy.item${i}`));
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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
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
      items: ['trigger', 'link', 'ariaLabel', 'currentPage'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
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

  /**
   * As duas orientações e as quatro composições canônicas saem na MESMA seção:
   * o conteúdo compartilhado guarda as seis em `variants.items`, e as duas
   * primeiras descrevem-se por `variants.styles`, sem "quando usar".
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.items.horizontal'),
        description: stripHtml(t('variants.styles.horizontal')),
        trackId: 'horizontal',
        code: HORIZONTAL_CODE,
        preview: this.tplVarHorizontal(),
      },
      {
        name: t('variants.items.vertical'),
        description: stripHtml(t('variants.styles.vertical')),
        trackId: 'vertical',
        code: VERTICAL_CODE,
        preview: this.tplVarVertical(),
      },
      ...[
        { key: 'linkSimples',      trackId: 'link-simples',   code: CODE_SIMPLE_LINK,   tpl: this.tplVarSimple()   },
        { key: 'comDropdown',      trackId: 'com-dropdown',   code: CODE_WITH_DROPDOWN, tpl: this.tplVarDropdown() },
        { key: 'megaMenuGrid',     trackId: 'mega-menu-grid', code: CODE_MEGA_MENU,     tpl: this.tplVarGrid()     },
        { key: 'comCardDestacado', trackId: 'card-destacado', code: CODE_FEATURED,      tpl: this.tplVarFeatured() },
      ].map(({ key, trackId, code, tpl }) => ({
        name: t(`variants.items.${key}.name`),
        description: t(`variants.items.${key}.description`),
        useWhen: t(`variants.items.${key}.use`),
        trackId,
        code,
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
    return ['closed', 'open', 'active'].map((k) => ({
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
    const nao = tNav('common.no');

    /** Linha cujo tipo/padrão/descrição vêm da tabela do conteúdo compartilhado. */
    const ofContent = (nome: string, chave: string, tipo?: string) => ({
      name: nome,
      type: tipo ?? toPlainText(t(`props.table.${chave}.type`)),
      defaultValue: toPlainText(t(`props.table.${chave}.default`)),
      required: toPlainText(t(`props.table.${chave}.required`)),
      description: toPlainText(t(`props.table.${chave}.description`)),
    });

    /** Linha que só existe neste stack — descrição vem do override. */
    const local = (nome: string, tipo: string, padrao: string, chave: string) => ({
      name: nome,
      type: tipo,
      defaultValue: padrao,
      required: nao,
      description: toPlainText(t(`props.${chave}.description`)),
    });

    const classe = local('class', 'string', '—', 'class');

    return [
      {
        title: 'NdsNavigationMenu',
        cols,
        items: [
          ofContent('value', 'value', 'model<string | null>'),
          ofContent('valueChange', 'onValueChange', 'output<string | null>'),
          ofContent('defaultValue', 'defaultValue', 'string | null'),
          ofContent('orientation', 'orientation'),
          // `delay` e `closeDelay` são os nomes do primitivo deste stack; o
          // conteúdo compartilhado descreve as mesmas esperas como
          // `delayDuration` e `skipDelayDuration`, com outros padrões.
          local('delay', 'number', '50', 'delay'),
          local('closeDelay', 'number', '50', 'closeDelay'),
          local('align', "'start' | 'center' | 'end'", "'start'", 'align'),
          local('sideOffset', 'number', '8', 'sideOffset'),
          local('indicator', 'boolean', 'false', 'indicator'),
          local('dir', "'ltr' | 'rtl'", '—', 'dir'),
          local('onOpenChange', 'output<RdxNavigationMenuOpenChange>', '—', 'onOpenChange'),
          classe,
        ],
      },
      {
        title: 'NdsNavigationMenuItem',
        cols,
        items: [local('value', 'string', '—', 'itemValue'), classe],
      },
      {
        title: 'NdsNavigationMenuTrigger',
        cols,
        items: [
          local('disabled', 'boolean', 'false', 'triggerDisabled'),
          local('openOnHover', 'boolean', 'true', 'openOnHover'),
        ],
      },
      {
        title: 'NdsNavigationMenuContent',
        cols,
        items: [local('forceMount', 'boolean', 'false', 'forceMount')],
      },
      {
        title: 'NdsNavigationMenuLink · NdsNavigationMenuChild',
        cols,
        items: [
          local('active', 'boolean', 'false', 'linkActive'),
          local('closeOnClick', 'boolean', 'false', 'closeOnClick'),
          local('onSelect', 'output<Event>', '—', 'onSelect'),
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
    // A coluna do meio vem do conteúdo compartilhado: desde que a tabela de
    // tokens passou a guardar o seletor `.nds-*` real (e não mais a classe
    // utilitária de um framework que saiu do projeto), não há o que reescrever
    // aqui — o mapa local só duplicava o que o JSON já diz.
    return [
      { token: '--background',   k: 'rootBg'         },
      { token: '--accent',       k: 'triggerHover'   },
      { token: '--accent',       k: 'linkActive'     },
      { token: '--popover',      k: 'viewportBg'     },
      { token: '--border',       k: 'viewportBorder' },
      { token: '--elevation-md', k: 'viewportShadow' },
      { token: '--radius',       k: 'rounded'        },
      { token: '--border',       k: 'indicator'      },
    ].map(({ token, k }) => ({
      token,
      value: t(`tokens.table.${k}.class`),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',           description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '← → ↑ ↓',       description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Enter / Space', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Esc',           description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Home / End',    description: toPlainText(t('accessibility.keyboard.homeEnd')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = navigationMenuTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const sr = { ...(byLocale[locale]?.accessibility?.screenReader ?? {}) };
    // `title` é rótulo da subseção, não anúncio — entraria como item da lista.
    delete sr['title'];
    return Object.values(sr);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'menubar',    path: '?path=/docs/ui-menubar--docs'    },
      { key: 'sidebar',    path: '?path=/docs/ui-sidebar--docs'    },
      { key: 'breadcrumb', path: '?path=/docs/ui-breadcrumb--docs' },
      { key: 'tabs',       path: '?path=/docs/ui-tabs--docs'       },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
    // Sem tabela no conteúdo compartilhado: o evento vem da descrição, e é o
    // mesmo que a demonstração acima dispara de verdade. `navigation_click` é o
    // nome tipado no catálogo desta stack, compartilhado com Breadcrumb e
    // Sidebar — três peças de navegação com um evento só agregam no GA4.
    const gatilho = toPlainText(t('analytics.description'));
    return [
      {
        event: 'navigation_click',
        trigger: gatilho,
        payload: 'component, label, destination, location',
      },
      { event: 'docs_page_view',      trigger: gatilho, payload: 'component_name, locale, page_title' },
      { event: 'docs_section_viewed', trigger: gatilho, payload: 'component_name, section_id, locale' },
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
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // tabs e do dropdown-menu.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: '—',
        how: 'axe + play',
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
        componentSlug: 'navigation-menu',
      });
      track('docs_page_view', {
        component_name: 'navigation-menu',
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
          component_name: 'navigation-menu',
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
