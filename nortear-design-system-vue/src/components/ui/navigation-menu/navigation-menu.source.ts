/**
 * Transforms do painel Code do NavigationMenu.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas coisas das stories NÃO atravessam para cá, porque são andaime:
 *
 *   · a moldura de contenção de layout em volta da barra, que existe para o
 *     painel flutuante não empurrar a foto do Chromatic;
 *   · o `@click` que barra a navegação de verdade, sem o qual o clique num
 *     destino tiraria a própria página de teste do ar. Quem consome QUER que o
 *     destino navegue — é para isso que ele é um link.
 */
import {
  attr,
  attrNum,
  attrsMultilinha,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type NavigationMenuArgs = {
  defaultValue: string;
  delayDuration: number;
  orientation: 'horizontal' | 'vertical';
};

/** Espera padrão da lib antes de o ponteiro abrir o painel, em ms. */
const WAIT_DEFAULT = 200;

/** Import do design system, uma peça por linha e em ordem alfabética. */
function importa(...parts: string[]): string {
  const lista = [...new Set(parts)].sort();
  return `import {\n${lista.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/navigation-menu'`;
}

/**
 * Destino DENTRO do painel: bloco com título e, quando ajuda, uma linha de
 * contexto. O título vai na classe de rótulo — o destino do painel não é a
 * pílula de uma linha da barra.
 *
 * A descrição NÃO leva `aria-hidden`: "Para Marketing" sozinho não diz o que há
 * do outro lado, e é a descrição que completa o nome do destino (WCAG 2.4.4).
 */
function destino(href: string, titulo: string, descricao?: string, recuo = 0): string {
  const p = ' '.repeat(recuo);
  const corpo = descricao
    ? `\n${p}  <p class="nds-navigation-menu-child-description">\n${p}    ${descricao}\n${p}  </p>`
    : '';
  return `${p}<NavigationMenuChild href="${href}">
${p}  <div class="nds-navigation-menu-child-label">${titulo}</div>${corpo}
${p}</NavigationMenuChild>`;
}

/** Lista vertical de destinos dentro do painel, cada um em seu `<li>`. */
function panelList(
  itens: Array<{ href: string; titulo: string }>,
  recuo: number,
  largura = 'nds-w-xs',
): string {
  const p = ' '.repeat(recuo);
  const linhas = itens
    .map((item) => `${p}  <li>\n${destino(item.href, item.titulo, undefined, recuo + 4)}\n${p}  </li>`)
    .join('\n');
  return `${p}<ul class="nds-stack nds-list-none ${largura}" data-spacing="xs">
${linhas}
${p}</ul>`;
}

/** Item da barra que só navega: um destino direto, sem painel. */
function itemDireto(href: string, rotulo: string, ativo = false): string {
  const marca = ativo ? ' :active="true"' : '';
  return `    <NavigationMenuItem>
      <NavigationMenuLink href="${href}"${marca}>${rotulo}</NavigationMenuLink>
    </NavigationMenuItem>`;
}

/**
 * Forma canônica: um landmark de navegação com nome próprio, itens que navegam
 * direto e itens que abrem painel.
 *
 * O nome do landmark não é enfeite — sem ele o leitor de tela anuncia só
 * "navegação", e duas barras homônimas na mesma página reprovam em
 * `landmark-unique`.
 *
 * `value` no item é o que casa com `default-value` na raiz: só os itens COM
 * painel precisam dele.
 */
export const navigationMenuSource: SourceTransform<NavigationMenuArgs> = (_gerado, ctx) => {
  const raiz = attrsMultilinha([
    attr('default-value', ctx?.args?.defaultValue),
    attrNum('delay-duration', ctx?.args?.delayDuration, WAIT_DEFAULT),
    attr('orientation', ctx?.args?.orientation, 'horizontal'),
    'aria-label="Navegação principal"',
  ]);
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu${raiz}>
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}

    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#inicial', titulo: 'Plano Inicial' },
    { href: '#profissional', titulo: 'Plano Profissional' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>

    <NavigationMenuItem value="solucoes">
      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#marketing', titulo: 'Para Marketing' },
    { href: '#vendas', titulo: 'Para Vendas' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>

${itemDireto('#sobre', 'Sobre')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
};

/**
 * Barra horizontal: a direção padrão, e por isso não se escreve. Cabeçalho de
 * site com destinos diretos e gatilhos convivendo na mesma linha.
 */
export function navigationMenuHorizontalSource(): string {
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}

    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#inicial', titulo: 'Plano Inicial' },
    { href: '#profissional', titulo: 'Plano Profissional' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>

    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#guias', titulo: 'Guias' },
    { href: '#api', titulo: 'Referência da API' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>

${itemDireto('#precos', 'Preços')}
${itemDireto('#sobre', 'Sobre')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Barra vertical: a direção troca o eixo das setas junto com o empilhamento —
 * numa coluna, seta para o lado não move nada. A lista ganha a largura e o
 * respiro da coluna, que numa linha não fariam sentido.
 */
export function navigationMenuVerticalSource(): string {
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
    ),
    `<NavigationMenu orientation="vertical" aria-label="Navegação da conta">
  <NavigationMenuList class="nds-stack nds-w-sm" data-spacing="xs">
${itemDireto('#painel', 'Painel')}
${itemDireto('#relatorios', 'Relatórios')}
${itemDireto('#configuracoes', 'Configurações')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Estado fechado: é AUSÊNCIA de `default-value`. O miolo do painel nem existe
 * no DOM — não é um bloco escondido, e por isso nenhum destino dele entra na
 * ordem de tabulação de quem navega por teclado.
 */
export function navigationMenuClosedSource(): string {
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList([{ href: '#inicial', titulo: 'Plano Inicial' }], 8)}
      </NavigationMenuContent>
    </NavigationMenuItem>
${itemDireto('#sobre', 'Sobre')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Estado aberto na montagem: `default-value` na raiz casa com o `value` do
 * item. A seta indicadora é peça à parte, irmã dos itens dentro da lista, e só
 * existe enquanto algum painel está aberto.
 */
export function navigationMenuOpenSource(): string {
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuIndicator',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação principal" default-value="produtos">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#inicial', titulo: 'Plano Inicial' },
    { href: '#profissional', titulo: 'Plano Profissional' },
    { href: '#empresarial', titulo: 'Plano Empresarial' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuIndicator />
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Destino da página atual: `active` no destino, e é ele que vira
 * `aria-current="page"` no markup. O leitor de tela anuncia "página atual" e o
 * fundo muda junto — cor sozinha não informa quem não a distingue.
 */
export function navigationMenuActiveSource(): string {
  return vueSnippet(
    importa('NavigationMenu', 'NavigationMenuItem', 'NavigationMenuLink', 'NavigationMenuList'),
    `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início', true)}
${itemDireto('#produtos', 'Produtos')}
${itemDireto('#sobre', 'Sobre')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Barra plana: sem hierarquia não há painel — e sem painel não há gatilho
 * nenhum na barra, só destinos que navegam no clique.
 */
export function navigationMenuSomenteLinksSource(): string {
  return vueSnippet(
    importa('NavigationMenu', 'NavigationMenuItem', 'NavigationMenuLink', 'NavigationMenuList'),
    `<NavigationMenu aria-label="Navegação institucional">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início', true)}
${itemDireto('#precos', 'Preços')}
${itemDireto('#contato', 'Contato')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Um gatilho com lista vertical de destinos — a forma comum para três a oito
 * páginas relacionadas. Escolher um destino fecha o painel sozinho: navegar É
 * sair da página, e um painel que sobrevivesse ao clique ficaria pendurado
 * sobre a página seguinte.
 */
export function navigationMenuWithPanelSource(): string {
  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}

    <NavigationMenuItem value="planos">
      <NavigationMenuTrigger>Planos</NavigationMenuTrigger>
      <NavigationMenuContent>
${panelList(
  [
    { href: '#inicial', titulo: 'Plano Inicial' },
    { href: '#profissional', titulo: 'Plano Profissional' },
    { href: '#empresarial', titulo: 'Plano Empresarial' },
  ],
  8,
)}
      </NavigationMenuContent>
    </NavigationMenuItem>

${itemDireto('#contato', 'Contato')}
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Mega-menu em duas colunas: cada destino leva título E uma linha de contexto.
 * A grade é de largura fixa — um painel que acompanhasse a largura da barra
 * mudaria de forma a cada item.
 */
export function navigationMenuMegaMenuSource(): string {
  const cartoes = [
    { href: '#marketing', titulo: 'Para Marketing', desc: 'Campanhas, automação e atribuição num lugar só.' },
    { href: '#vendas', titulo: 'Para Vendas', desc: 'Funil, previsão e histórico de cada negociação.' },
    { href: '#suporte', titulo: 'Para Suporte', desc: 'Fila de atendimento, base de conhecimento e métricas.' },
    { href: '#financeiro', titulo: 'Para Financeiro', desc: 'Cobrança recorrente, conciliação e relatórios fiscais.' },
  ]
    .map((c) => `          <li>\n${destino(c.href, c.titulo, c.desc, 12)}\n          </li>`)
    .join('\n');

  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação de soluções" default-value="solucoes">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}

    <NavigationMenuItem value="solucoes">
      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="nds-grid nds-list-none nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
${cartoes}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  );
}

/**
 * Destino em destaque ao lado dos complementares: a hierarquia aparece pelo
 * TAMANHO do bloco, não por cor. O destaque ocupa a coluna inteira — daí o
 * `nds-h-full` — e os de apoio empilham na coluna ao lado.
 */
export function navigationMenuWithHighlightSource(): string {
  const apoio = [
    { href: '#guias', titulo: 'Guias' },
    { href: '#api', titulo: 'Referência da API' },
    { href: '#changelog', titulo: 'Novidades' },
  ]
    .map((item) => `            <li>\n${destino(item.href, item.titulo, undefined, 14)}\n            </li>`)
    .join('\n');

  return vueSnippet(
    importa(
      'NavigationMenu',
      'NavigationMenuChild',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
    ),
    `<NavigationMenu aria-label="Navegação de recursos">
  <NavigationMenuList>
${itemDireto('#inicio', 'Início')}

    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div class="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
          <NavigationMenuChild href="#comece" class="nds-h-full">
            <div class="nds-navigation-menu-child-label">Comece agora</div>
            <p class="nds-navigation-menu-child-description">
              Publique o primeiro projeto em menos de cinco minutos.
            </p>
          </NavigationMenuChild>

          <ul class="nds-stack nds-list-none" data-spacing="xs">
${apoio}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  );
}
