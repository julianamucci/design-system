/**
 * Transforms do painel Code do NavigationMenu.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * O `onclick` que as stories penduram em cada destino não entra no snippet: ele
 * só existe para impedir a navegação de verdade dentro do runner. O que o
 * componente ensina é o `href`.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type NavigationMenuArgs = {
  defaultValue?: string;
  delayDuration: number;
  orientation: 'horizontal' | 'vertical';
  ariaLabel: string;
  demonstration: 'default' | 'bar' | 'simpleLink' | 'withDropdown' | 'megaMenuGrid' | 'withFeatured';
  activeHref?: string;
  indicator: boolean;
};

function importing(parts: string[]): string {
  return `import {
${parts.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/navigation-menu";`;
}

/** Destino direto da barra: um `<a href>` de verdade, não um botão. */
function destination(valor: string, href: string, rotulo: string, active: boolean): string {
  const props = attrs(`href="${href}"`, active ? 'active' : '');
  return `    <NavigationMenuItem value="${valor}">
      <NavigationMenuLink${props}>${rotulo}</NavigationMenuLink>
    </NavigationMenuItem>`;
}

/** Item com painel: o gatilho é botão porque abre conteúdo, e não navega. */
function withPanel(valor: string, rotulo: string, corpo: string): string {
  return `    <NavigationMenuItem value="${valor}">
      <NavigationMenuTrigger>${rotulo}</NavigationMenuTrigger>
      <NavigationMenuContent>
${corpo}
      </NavigationMenuContent>
    </NavigationMenuItem>`;
}

/** Lista vertical de destinos dentro do painel. */
function targetsList(itens: Array<[string, string]>): string {
  const linhas = itens
    .map(
      ([href, rotulo]) => `          <li>
            <NavigationMenuChild href="${href}">
              <div class="nds-navigation-menu-child-label">${rotulo}</div>
            </NavigationMenuChild>
          </li>`,
    )
    .join('\n');

  return `        <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
${linhas}
        </ul>`;
}

/** Duas colunas com uma linha de contexto por destino. */
function targetsGrid(itens: Array<[string, string, string]>): string {
  const linhas = itens
    .map(
      ([href, rotulo, descricao]) => `          <li>
            <NavigationMenuChild href="${href}">
              <div class="nds-navigation-menu-child-label">${rotulo}</div>
              <p class="nds-navigation-menu-child-description">
                ${descricao}
              </p>
            </NavigationMenuChild>
          </li>`,
    )
    .join('\n');

  return `        <ul class="nds-grid nds-list-none nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
${linhas}
        </ul>`;
}

const PLANOS: Array<[string, string]> = [
  ['#inicial', 'Plano Inicial'],
  ['#profissional', 'Plano Profissional'],
  ['#empresarial', 'Plano Empresarial'],
];

const RECURSOS: Array<[string, string]> = [
  ['#guias', 'Guias'],
  ['#api', 'Referência da API'],
];

const SOLUCOES: Array<[string, string]> = [
  ['#marketing', 'Para Marketing'],
  ['#vendas', 'Para Vendas'],
];

const HIGHLIGHT_PANEL = `        <div class="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
          <NavigationMenuChild href="#comece" class="nds-h-full">
            <div class="nds-navigation-menu-child-label">Comece agora</div>
            <p class="nds-navigation-menu-child-description">
              Publique o primeiro projeto em menos de cinco minutos.
            </p>
          </NavigationMenuChild>

          <ul class="nds-stack nds-list-none" data-spacing="xs">
            <li>
              <NavigationMenuChild href="#guias">
                <div class="nds-navigation-menu-child-label">Guias</div>
              </NavigationMenuChild>
            </li>
            <li>
              <NavigationMenuChild href="#api">
                <div class="nds-navigation-menu-child-label">Referência da API</div>
              </NavigationMenuChild>
            </li>
            <li>
              <NavigationMenuChild href="#changelog">
                <div class="nds-navigation-menu-child-label">Novidades</div>
              </NavigationMenuChild>
            </li>
          </ul>
        </div>`;

/** Os itens da barra, na composição escolhida pela story. */
function itens(demonstration: NavigationMenuArgs['demonstration'], activeHref?: string): string {
  const active = (href: string) => activeHref === href;

  if (demonstration === 'simpleLink') {
    return [
      destination('inicio', '#inicio', 'Início', active('#inicio')),
      destination('precos', '#precos', 'Preços', active('#precos')),
      destination('contato', '#contato', 'Contato', active('#contato')),
    ].join('\n');
  }

  if (demonstration === 'withDropdown') {
    return [
      destination('inicio', '#inicio', 'Início', active('#inicio')),
      withPanel('planos', 'Planos', targetsList(PLANOS)),
      destination('contato', '#contato', 'Contato', active('#contato')),
    ].join('\n');
  }

  if (demonstration === 'megaMenuGrid') {
    return [
      destination('inicio', '#inicio', 'Início', active('#inicio')),
      withPanel(
        'solucoes',
        'Soluções',
        targetsGrid([
          ['#marketing', 'Para Marketing', 'Campanhas, automação e atribuição num lugar só.'],
          ['#vendas', 'Para Vendas', 'Funil, previsão e histórico de cada negociação.'],
          ['#suporte', 'Para Suporte', 'Fila de atendimento, base de conhecimento e métricas.'],
          ['#financeiro', 'Para Financeiro', 'Cobrança recorrente, conciliação e relatórios fiscais.'],
        ]),
      ),
    ].join('\n');
  }

  if (demonstration === 'withFeatured') {
    return [
      destination('inicio', '#inicio', 'Início', active('#inicio')),
      withPanel('recursos', 'Recursos', HIGHLIGHT_PANEL),
    ].join('\n');
  }

  if (demonstration === 'bar') {
    return [
      destination('inicio', '#inicio', 'Início', active('#inicio')),
      withPanel('produtos', 'Produtos', targetsList(PLANOS.slice(0, 2))),
      withPanel('recursos', 'Recursos', targetsList(RECURSOS)),
      destination('precos', '#precos', 'Preços', active('#precos')),
      destination('sobre', '#sobre', 'Sobre', active('#sobre')),
    ].join('\n');
  }

  return [
    destination('inicio', '#inicio', 'Início', active('#inicio')),
    withPanel('produtos', 'Produtos', targetsList(PLANOS)),
    withPanel('solucoes', 'Soluções', targetsList(SOLUCOES)),
    destination('sobre', '#sobre', 'Sobre', active('#sobre')),
  ].join('\n');
}

/**
 * Transform do meta — serve o Playground e, por cascata, toda story destes
 * arquivos. A composição sai do control `demonstration`, o mesmo arg que troca
 * a marcação na tela: ler o arg é o que mantém painel e demonstração dizendo a
 * mesma coisa.
 */
export function navigationMenuSource(
  _gerado?: string,
  ctx?: { args?: Partial<NavigationMenuArgs> },
): string {
  const {
    defaultValue,
    delayDuration = 100,
    orientation = 'horizontal',
    ariaLabel = 'Navegação principal',
    demonstration = 'default',
    activeHref,
    indicator = false,
  } = ctx?.args ?? {};

  const hasPanel = demonstration !== 'simpleLink';
  const parts = [
    'NavigationMenuRoot',
    'NavigationMenuList',
    'NavigationMenuItem',
    ...(hasPanel ? ['NavigationMenuTrigger', 'NavigationMenuContent'] : []),
    'NavigationMenuLink',
    ...(hasPanel ? ['NavigationMenuChild'] : []),
    ...(indicator ? ['NavigationMenuIndicator'] : []),
  ];

  // `value` é o item aberto: a mesma prop serve de valor inicial e de leitura do
  // estado, então o exemplo com um item já aberto declara o estado de fora.
  const props = attrsMultilinha([
    defaultValue ? 'bind:value={aberto}' : '',
    delayDuration === 100 ? '' : `delayDuration={${delayDuration}}`,
    orientation === 'horizontal' ? '' : `orientation="${orientation}"`,
    // O nome do landmark é obrigatório: sem ele o leitor de tela anuncia só
    // "navegação", e duas barras sem nome reprovam em `landmark-unique`.
    `aria-label="${ariaLabel}"`,
  ]);

  const listProps =
    orientation === 'vertical' ? ' class="nds-stack nds-w-sm" data-spacing="xs"' : '';

  const arrow = indicator ? '\n    <NavigationMenuIndicator />' : '';

  return svelteSnippet(
    defaultValue
      ? `${importing(parts)}

let aberto = $state("${defaultValue}");`
      : importing(parts),
    `<NavigationMenuRoot${props}>
  <NavigationMenuList${listProps}>
${itens(demonstration, activeHref)}${arrow}
  </NavigationMenuList>
</NavigationMenuRoot>`,
  );
}
