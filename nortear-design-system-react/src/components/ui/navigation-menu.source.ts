/**
 * Transforms do painel Code do NavigationMenu.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * As stories montam duas camadas de andaime que NÃO são do componente e por
 * isso não entram no snippet: o quadro de captura (`contain: layout`,
 * `minHeight`, `position: relative`), que existe para o painel portalizado ter
 * contra o que se posicionar dentro do Storybook, e as esperas de portal do
 * módulo de apoio das stories, que só existem para a `play` saber quando o
 * floating-ui terminou de medir.
 *
 * Uma escolha de peça atravessa todos os snippets daqui: destino DA BARRA é
 * `NavigationMenuLink` (pílula de uma linha, sem quebra) e destino DENTRO DO
 * PAINEL é `NavigationMenuChild` (bloco com título e, às vezes, uma linha de
 * descrição). São classes diferentes de propósito, e o Child ainda fecha o
 * painel ao ser escolhido — navegar é sair da página, e um painel que sobrevive
 * ao clique fica pendurado sobre a página seguinte.
 */
import {
  attrsMultilinha,
  indentar,
  jsxSnippet,
  propNumber,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type NavigationMenuArgs = {
  defaultValue: string;
  delay: number;
  closeDelay: number;
  orientation: 'horizontal' | 'vertical';
};

const ORIENTACOES = ['horizontal', 'vertical'] as const;

/** Espera padrão do primitivo, em ms, tanto para abrir quanto para fechar. */
const WAIT_DEFAULT = 50;

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingNav(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/navigation-menu";`;
}

/**
 * A barra inteira. O `aria-label` não é opcional: sem nome o leitor de tela
 * anuncia só "navegação", e duas barras na mesma página reprovam em
 * `landmark-unique`.
 */
function barra(attrs: string, items: string): string {
  return `<NavigationMenu${attrs}>
  <NavigationMenuList>
${indentar(items, '    ')}
  </NavigationMenuList>
</NavigationMenu>`;
}

/** Destino direto da barra — sem painel, navega no clique. */
function destination(href: string, label: string, current = false): string {
  return `<NavigationMenuItem>
  <NavigationMenuLink href="${href}"${current ? ' active' : ''}>${label}</NavigationMenuLink>
</NavigationMenuItem>`;
}

/**
 * Item com painel. O `value` é o identificador do item aberto: é por ele que o
 * valor inicial e o retorno de mudança se referem a ESTE painel, e não à ordem
 * em que ele aparece na barra.
 */
function withPanel(value: string, label: string, content: string): string {
  return `<NavigationMenuItem value="${value}">
  <NavigationMenuTrigger>${label}</NavigationMenuTrigger>
  <NavigationMenuContent>
${indentar(content, '    ')}
  </NavigationMenuContent>
</NavigationMenuItem>`;
}

/** Um destino do painel dentro de `<li>`, com descrição opcional. */
function child(href: string, label: string, descricao?: string): string {
  const body = descricao
    ? `    <div className="nds-navigation-menu-child-label">${label}</div>
    <p className="nds-navigation-menu-child-description">
      ${descricao}
    </p>`
    : `    <div className="nds-navigation-menu-child-label">${label}</div>`;
  return `<li>
  <NavigationMenuChild href="${href}">
${body}
  </NavigationMenuChild>
</li>`;
}

/** Lista vertical de destinos dentro do painel. */
function panelList(...items: string[]): string {
  return `<ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
${indentar(items.join('\n'), '  ')}
</ul>`;
}

/** As peças que uma barra com painel sempre usa. */
const PARTS_WITH_PANEL = [
  'NavigationMenu',
  'NavigationMenuChild',
  'NavigationMenuContent',
  'NavigationMenuItem',
  'NavigationMenuLink',
  'NavigationMenuList',
  'NavigationMenuTrigger',
] as const;

/** As peças de uma barra plana: sem gatilho, sem painel, sem filho. */
const PARTS_SO_TARGETS = [
  'NavigationMenu',
  'NavigationMenuItem',
  'NavigationMenuLink',
  'NavigationMenuList',
] as const;

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na barra horizontal fechada, que é o
 * padrão do componente e o uso canônico.
 *
 * Espera de abertura, espera de fechamento e orientação só entram quando
 * diferem do padrão: repetir valor padrão ensina ruído a quem copia.
 *
 * O retorno de mudança de valor NÃO é interpolado: o Storybook o entrega como
 * espião, e o corpo do mock apareceria no painel como se fosse código do design
 * system.
 */
export const navigationMenuSource: SourceTransform<NavigationMenuArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const attrs = attrsMultilinha([
    'aria-label="Navegação principal"',
    propText('defaultValue', args.defaultValue),
    typeof args.delay === 'number' && args.delay !== WAIT_DEFAULT
      ? propNumber('delay', args.delay)
      : undefined,
    typeof args.closeDelay === 'number' && args.closeDelay !== WAIT_DEFAULT
      ? propNumber('closeDelay', args.closeDelay)
      : undefined,
    propOption('orientation', args.orientation, ORIENTACOES, 'horizontal'),
  ]);

  return jsxSnippet(
    importingNav(...PARTS_WITH_PANEL),
    barra(
      attrs,
      [
        destination('#inicio', 'Início'),
        withPanel(
          'produtos',
          'Produtos',
          panelList(child('#inicial', 'Plano Inicial'), child('#profissional', 'Plano Profissional')),
        ),
        destination('#sobre', 'Sobre'),
      ].join('\n'),
    ),
  );
};

/**
 * Barra vertical. A orientação não é só desenho: numa coluna o painel abre para
 * o LADO, porque abrir para baixo cobriria os próprios itens seguintes. Quem
 * escolhe a orientação recebe o posicionamento junto, sem uma segunda prop.
 */
export function navigationMenuVerticalSource(): string {
  return jsxSnippet(
    importingNav(...PARTS_WITH_PANEL),
    `<NavigationMenu aria-label="Navegação da conta" orientation="vertical">
  <NavigationMenuList className="nds-stack nds-w-sm" data-spacing="xs">
${indentar(
  [
    destination('#painel', 'Painel'),
    withPanel(
      'relatorios',
      'Relatórios',
      panelList(child('#vendas', 'Vendas'), child('#assinaturas', 'Assinaturas')),
    ),
    destination('#configuracoes', 'Configurações'),
  ].join('\n'),
  '    ',
)}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Painel aberto na montagem. O valor inicial casa com o `value` do item — é o
 * identificador que liga um ao outro —, e `indicator` liga a seta que aponta
 * para o gatilho ativo. A seta nasce DESLIGADA porque é reforço redundante: o
 * gatilho já muda de fundo e o chevron já gira.
 */
export function navigationMenuOpenSource(): string {
  return jsxSnippet(
    importingNav(...PARTS_WITH_PANEL),
    barra(
      attrsMultilinha([
        'aria-label="Navegação principal"',
        'defaultValue="produtos"',
        'indicator',
      ]),
      [
        destination('#inicio', 'Início'),
        withPanel(
          'produtos',
          'Produtos',
          panelList(
            child('#inicial', 'Plano Inicial'),
            child('#profissional', 'Plano Profissional'),
            child('#empresarial', 'Plano Empresarial'),
          ),
        ),
      ].join('\n'),
    ),
  );
}

/**
 * Destino da página atual. `active` vira `aria-current="page"` — o leitor de
 * tela anuncia "página atual" e o fundo muda junto, porque cor sozinha não
 * informa quem não a distingue. Os outros destinos não carregam o atributo de
 * jeito nenhum: presente com valor negativo, ele faria `[aria-current]` casar
 * o item errado.
 */
export function navigationMenuActiveSource(): string {
  return jsxSnippet(
    importingNav(...PARTS_SO_TARGETS),
    barra(
      ' aria-label="Navegação principal"',
      [
        destination('#inicio', 'Início', true),
        destination('#produtos', 'Produtos'),
        destination('#sobre', 'Sobre'),
      ].join('\n'),
    ),
  );
}

/**
 * Só destinos diretos. A ausência de painel É o assunto: sem hierarquia não há
 * gatilho nenhum na barra, e o componente vira uma lista de links percorrida
 * pelas setas. É a forma certa para três a cinco categorias planas.
 */
export function navigationMenuSomenteTargetsSource(): string {
  return jsxSnippet(
    importingNav(...PARTS_SO_TARGETS),
    barra(
      ' aria-label="Navegação institucional"',
      [
        destination('#inicio', 'Início', true),
        destination('#precos', 'Preços'),
        destination('#contato', 'Contato'),
      ].join('\n'),
    ),
  );
}

/**
 * Mega-menu em duas colunas. A descrição de cada destino NÃO recebe
 * `aria-hidden`: "Para Marketing" sozinho não diz o que há do outro lado, e é a
 * linha de contexto que atende ao critério de propósito do link (WCAG 2.4.4).
 */
export function navigationMenuMegaMenuSource(): string {
  const grid = `<ul
  className="nds-grid nds-list-none nds-w-lg"
  data-fixed
  data-cols="2"
  data-spacing="sm"
>
${indentar(
  [
    child('#marketing', 'Para Marketing', 'Campanhas, automação e atribuição num lugar só.'),
    child('#vendas', 'Para Vendas', 'Funil, previsão e histórico de cada negociação.'),
    child('#suporte', 'Para Suporte', 'Fila de atendimento, base de conhecimento e métricas.'),
    child(
      '#financeiro',
      'Para Financeiro',
      'Cobrança recorrente, conciliação e relatórios fiscais.',
    ),
  ].join('\n'),
  '  ',
)}
</ul>`;

  return jsxSnippet(
    importingNav(...PARTS_WITH_PANEL),
    barra(
      ' aria-label="Navegação de soluções"',
      [destination('#inicio', 'Início'), withPanel('solucoes', 'Soluções', grid)].join('\n'),
    ),
  );
}

/**
 * Destino em destaque ao lado dos complementares. A hierarquia aparece pelo
 * TAMANHO do bloco — o destaque ocupa a coluna inteira com `nds-h-full` —, e não
 * por cor: é o que mantém a distinção legível para quem não a percebe.
 */
export function navigationMenuHighlightSource(): string {
  const content = `<div className="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
  <NavigationMenuChild href="#comece" className="nds-h-full">
    <div className="nds-navigation-menu-child-label">Comece agora</div>
    <p className="nds-navigation-menu-child-description">
      Publique o primeiro projeto em menos de cinco minutos.
    </p>
  </NavigationMenuChild>

  <ul className="nds-stack nds-list-none" data-spacing="xs">
${indentar(
  [
    child('#guias', 'Guias'),
    child('#api', 'Referência da API'),
    child('#changelog', 'Novidades'),
  ].join('\n'),
  '    ',
)}
  </ul>
</div>`;

  return jsxSnippet(
    importingNav(...PARTS_WITH_PANEL),
    barra(
      ' aria-label="Navegação de recursos"',
      [destination('#inicio', 'Início'), withPanel('recursos', 'Recursos', content)].join('\n'),
    ),
  );
}
