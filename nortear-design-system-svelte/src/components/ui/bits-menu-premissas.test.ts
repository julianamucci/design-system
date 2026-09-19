/**
 * As PREMISSAS que a família de menus desta stack assume sobre o `bits-ui`.
 *
 * Cada contorno e cada exceção declarada nos três menus (DropdownMenu,
 * ContextMenu, Menubar) existe por causa de uma coisa que a lib faz — e que a
 * lib pode deixar de fazer num bump. Contorno cuja premissa caiu vira ruído que
 * ninguém remove; exceção cuja premissa caiu vira portão sem dentes com cara de
 * cobertura. Este arquivo é o que faz a premissa REPROVAR quando ela muda, em
 * vez de envelhecer em silêncio.
 *
 * Lê a FONTE INSTALADA, e não o comportamento: a pergunta é sobre o que a lib
 * declara, e o projeto `unit` roda em node, sem navegador. O `patch-package`
 * desta stack também escreve em `node_modules`, então o que se lê aqui é o
 * estado real de quem importa a lib — com uma ressalva que vale de cor: o
 * executor de navegador pré-empacota em `node_modules/.cache/storybook/**`, e
 * esse cache NÃO é invalidado por editar `node_modules`. Este portão prova o
 * `node_modules`; a suíte de navegador prova o cache.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require_ = createRequire(import.meta.url);

/**
 * A raiz do pacote INSTALADO, resolvida como a lib é importada de verdade — e
 * não por um caminho escrito à mão, que apontaria para um `node_modules` que
 * pode nem ser o que a stack usa.
 *
 * Sobe a partir do ponto de entrada até a pasta do pacote. O caminho direto
 * (`bits-ui/package.json`) NÃO resolve: o `exports` do pacote não publica esse
 * subcaminho, e o require reprova com `ERR_PACKAGE_PATH_NOT_EXPORTED`.
 */
function bitsPackageRoot(): string {
  let dir = dirname(require_.resolve('bits-ui'));
  // `.../node_modules/bits-ui/dist/index.js` → sobe até `.../bits-ui`.
  for (let i = 0; i < 10 && !dir.endsWith('bits-ui'); i++) dir = dirname(dir);
  if (!dir.endsWith('bits-ui')) throw new Error('não achei a pasta do pacote bits-ui');
  return dir;
}

const BITS = bitsPackageRoot();

const read = (...segments: string[]) => readFileSync(join(BITS, ...segments), 'utf8');

/** A tag que fecha o `<script>` de um SFC, montada por concatenação: escrita por
 *  extenso ela fecharia o bloco de quem lê este arquivo como HTML. */
const CLOSES_SCRIPT = '</' + 'script>';

describe('premissa · o separador do menu sai com role="group"', () => {
  /**
   * Premissa de: `menubar-separator.svelte`, `dropdown-menu-separator.svelte` e
   * `context-menu-separator.svelte`, que renderizam pelo `child` (ou por `<div>`
   * próprio) só para escrever `role="separator"`.
   *
   * O `MenuSeparatorState` crava `role: "group"` nas próprias `props`, e o
   * componente resolve com `mergeProps(restProps, state.props)` — o estado vem
   * por último e ganha, então passar `role` por fora é ignorado em silêncio.
   */
  it('o estado do separador ainda crava o papel errado', () => {
    const source = read('dist', 'bits', 'menu', 'menu.svelte.js');
    const declaration = source.slice(source.indexOf('class MenuSeparatorState'));
    const body = declaration.slice(0, declaration.indexOf('class MenuArrowState'));
    expect(body.length, 'não achei a classe do separador na fonte da lib').toBeGreaterThan(50);
    expect(
      /role:\s*"group"/.test(body),
      'o bits parou de cravar `role: "group"` no separador — os três wrappers da '
        + 'família podem voltar a renderizar o `Separator` da lib direto',
    ).toBe(true);
  });
});

/**
 * O nome da exceção da D18, escrito uma vez e citado nos dois lugares que a
 * sustentam — este portão e o Playground do Menubar. Exceção sem nome é exceção
 * que ninguém encontra quando a premissa cai.
 */
const ENTER_NO_GATILHO_ABERTO_INALCANCAVEL = 'ENTER_NO_GATILHO_ABERTO_INALCANCAVEL';

describe(`premissa · ${ENTER_NO_GATILHO_ABERTO_INALCANCAVEL}`, () => {
  /**
   * Premissa da exceção declarada na **D18** (`dropdown-menu.md`): Enter ou
   * Espaço no gatilho de um menu da barra JÁ ABERTO fecha nas outras quatro
   * stacks; nesta o estado é INALCANÇÁVEL, porque o foco nunca descansa num
   * gatilho de menubar aberto — o `Menu.Content` do bits passa `trapFocus` como
   * atributo fixo às duas camadas flutuantes, sem porta para desligar.
   *
   * Uma story que afirmasse o fechamento por tecla aqui não poderia reprovar:
   * seria portão sem dentes com a agravante de parecer cobertura. O que o
   * Menubar afirma é o caminho ALCANÇÁVEL — o clique no gatilho aberto, que
   * fecha com `overlay`.
   *
   * Se o bits deixar de prender o foco, a exceção vence: o estado passa a
   * existir, e a asserção das outras quatro stacks passa a caber aqui.
   */
  const MENU_CONTENT = ['dist', 'bits', 'menu', 'components', 'menu-content.svelte'];

  it('o `trapFocus` do Menu.Content continua fixo no markup da lib', () => {
    const source = read(...MENU_CONTENT);
    // Duas camadas — `PopperLayerForceMount` e `PopperLayer` —, e as duas
    // recebem o atributo sem valor, que é a forma de "sempre ligado".
    const hits = source.match(/^\s*trapFocus\s*$/gm) ?? [];
    expect(
      hits.length,
      'o `Menu.Content` do bits não crava mais `trapFocus` nas duas camadas — a '
        + 'exceção da D18 (Enter no gatilho do menubar aberto é estado inalcançável '
        + 'no svelte) perde a premissa e precisa ser reexaminada',
    ).toBe(2);
  });

  it('e não é prop que o wrapper possa desligar', () => {
    const source = read(...MENU_CONTENT);
    const end = source.indexOf(CLOSES_SCRIPT);
    expect(end, 'não achei o bloco de script do componente da lib').toBeGreaterThan(0);
    const scriptBlock = source.slice(0, end);
    expect(
      /\btrapFocus\s*=/.test(scriptBlock),
      'o `Menu.Content` passou a aceitar `trapFocus` por prop — o wrapper pode '
        + 'desligar, e a exceção da D18 deixa de valer',
    ).toBe(false);
  });
});

describe('premissa · a raiz dos menus não tem prop de estado inicial', () => {
  /**
   * Premissa das ausências DECLARADAS nas tabelas de props das docs pages:
   * `defaultOpen` e `modal` no DropdownMenu, `defaultValue` no Menubar.
   *
   * Nesta lib o estado inicial sai do próprio valor bindável (`open` no menu,
   * `value` na barra). Documentar prop que o componente ignora é prometer o que
   * o produto não cumpre — e era exatamente o que a docs page do Menubar fazia
   * até 2026-09-03, abrindo dez demonstrações por uma prop inexistente, todas
   * renderizando fechadas sem nada ficar vermelho.
   */

  /**
   * O corpo de UMA declaração `export type <X> = …`, até a próxima.
   *
   * O recorte ingênuo — de `indexOf(X)` até `indexOf('export type ' + prefixo)`
   * — devolve string VAZIA, e foi exatamente o que a primeira versão deste
   * arquivo fazia: `MenuRootPropsWithoutHTML` COMEÇA por `MenuRootProps`, então
   * os dois `indexOf` caíam na mesma declaração e o fim vinha antes do começo.
   * Toda asserção passava contra o vazio. Achado ao plantar o defeito — é para
   * isso que se planta.
   */
  function typeBody(file: string[], typeName: string): string {
    const types = read(...file);
    const opening = `export type ${typeName} =`;
    const start = types.indexOf(opening);
    expect(start, `o bits não declara mais \`${typeName}\``).toBeGreaterThanOrEqual(0);
    const rest = types.slice(start + opening.length);
    const next = rest.indexOf('export type ');
    const body = next === -1 ? rest : rest.slice(0, next);
    // O recorte tem de ter conteúdo, senão a ausência que ele prova é a dele
    // próprio — a armadilha acima, agora com portão.
    expect(body.length, `o recorte de \`${typeName}\` saiu vazio`).toBeGreaterThan(20);
    return body;
  }

  const MENU_TYPES = ['dist', 'bits', 'menu', 'types.d.ts'];
  const MENUBAR_TYPES = ['dist', 'bits', 'menubar', 'types.d.ts'];

  it('o recorte da raiz do menu é o certo — a prova de que o resto mede algo', () => {
    // Sentinela: `open` e `onOpenChange` ESTÃO lá. Se estas duas sumirem, não é
    // que a lib mudou — é que o recorte parou de achar a declaração, e as
    // ausências abaixo passariam contra o vazio.
    const body = typeBody(MENU_TYPES, 'MenuRootPropsWithoutHTML');
    expect(/\bopen\??:/.test(body)).toBe(true);
    expect(/\bonOpenChange\??:/.test(body)).toBe(true);
  });

  it('o recorte da raiz da barra é o certo', () => {
    const body = typeBody(MENUBAR_TYPES, 'MenubarRootPropsWithoutHTML');
    expect(/\bvalue\??:/.test(body)).toBe(true);
    expect(/\bloop\??:/.test(body)).toBe(true);
  });

  const ABSENT_IN_MENU = ['defaultOpen', 'modal'] as const;

  it.each(ABSENT_IN_MENU)('MenuRootProps continua sem `%s`', (prop) => {
    const body = typeBody(MENU_TYPES, 'MenuRootPropsWithoutHTML');
    expect(
      new RegExp(`\\b${prop}\\??:`).test(body),
      `o bits passou a expor \`${prop}\` na raiz do menu — a tabela de props do `
        + 'DropdownMenu omite a prop POR ELA NÃO EXISTIR, e a omissão vira dívida',
    ).toBe(false);
  });

  it('MenubarRootProps continua sem `defaultValue`', () => {
    const body = typeBody(MENUBAR_TYPES, 'MenubarRootPropsWithoutHTML');
    expect(
      /\bdefaultValue\??:/.test(body),
      'o bits passou a expor `defaultValue` na raiz da barra — a tabela de props do '
        + 'Menubar omite a prop POR ELA NÃO EXISTIR, e a omissão vira dívida',
    ).toBe(false);
  });
});

describe('premissa · D15 — o bits não alinha o submenu, e por isso o `align` é nosso', () => {
  /**
   * Premissa de: `align="start"` declarado nos TRÊS `*-sub-content.svelte`.
   *
   * O Radix e a reka cravam `align: "start"` no sub-content do menu; o bits
   * não. O `menu-sub-content.svelte` dele fixa só `side = "right"`, e o
   * alinhamento cai no `align = "center"` do `floating-layer-content.svelte`.
   *
   * Duas consequências, medidas em 2026-09-19 nos três membros (bits-ui 2.19.0):
   *
   *   1. o subpainel nasce CENTRADO no sub-gatilho, então o desvio do primeiro
   *      item depende da ALTURA do painel — −14px com dois itens, −29px com os
   *      cinco do Menubar. A D15 pede zero;
   *   2. o `alignOffset` fica INERTE, porque o `offset` do floating-ui só aplica
   *      `alignmentAxis` quando a colocação tem alinhamento (`right-start`), e
   *      `right` puro não tem. Foi assim que o `alignOffset: -4` declarado em
   *      2026-09-18 não mudou nada: ele não piorou o desenho, nunca chegou a
   *      existir.
   *
   * Se um bump alinhar o bits ao Radix, esta premissa reprova e o `align="start"`
   * dos três wrappers passa a ser redundante — que é exatamente o tipo de
   * contorno que envelhece em silêncio se ninguém o cobrar.
   */
  it('o sub-content do bits continua sem declarar `align`', () => {
    const source = read('dist', 'bits', 'menu', 'components', 'menu-sub-content.svelte');
    // Sentinela: o `side = "right"` ESTÁ lá. Sem ela, um recorte que deixasse de
    // achar o arquivo provaria a ausência contra o vazio.
    expect(
      /side\s*=\s*"right"/.test(source),
      'não achei o `side = "right"` do sub-content — o recorte deixou de medir a lib',
    ).toBe(true);
    const props = source.slice(source.indexOf('let {'), source.indexOf('} = $props()'));
    expect(
      /\balign\s*=/.test(props),
      'o bits passou a declarar `align` no sub-content do menu — confira o valor: se '
        + 'for "start", o `align="start"` dos três `*-sub-content.svelte` virou redundante',
    ).toBe(false);
  });

  it('a camada flutuante do bits continua caindo em `align = "center"`', () => {
    const source = read(
      'dist', 'bits', 'utilities', 'floating-layer', 'components', 'floating-layer-content.svelte',
    );
    const props = source.slice(source.indexOf('let {'), source.indexOf('} = $props()'));
    expect(props.length, 'não achei a lista de props da camada flutuante').toBeGreaterThan(50);
    expect(
      /align\s*=\s*"center"/.test(props),
      'a camada flutuante do bits mudou o padrão de `align` — o desvio medido para a '
        + 'D15 partia de "center", e os números dos três sub-contents precisam ser remedidos',
    ).toBe(true);
    // E o `sideOffset` do sub-content NÃO é herdado do painel pai: ele cai neste
    // zero. O `sideOffset: 0` dos três wrappers coincide com o padrão da lib, e
    // é declarado para que o número seja do design system.
    expect(
      /sideOffset\s*=\s*0/.test(props),
      'a camada flutuante do bits mudou o padrão de `sideOffset` — o `0` declarado nos '
        + 'sub-contents deixou de coincidir com ele, e o vão lateral precisa ser remedido',
    ).toBe(true);
  });

  it('o content do ContextMenu do bits continua empurrando 2px', () => {
    /**
     * Premissa de: `sideOffset: 0` em `context-menu-content.svelte`.
     *
     * O painel do menu de contexto nasce no PONTEIRO, e o `sideOffset = 2` que a
     * lib declara punha a quina 2px ao lado do cursor — medido em 2026-09-19,
     * dx=+2,00 com o padrão da lib contra dx=0,00 com o `0` declarado. Os dois
     * publicavam `data-side="right"` e `data-align="start"`, então o atributo
     * não distinguia os dois casos.
     */
    const source = read('dist', 'bits', 'context-menu', 'components', 'context-menu-content.svelte');
    expect(
      /sideOffset\s*=\s*2/.test(source),
      'o bits deixou de empurrar o painel do ContextMenu em 2px — o `sideOffset: 0` do '
        + 'wrapper pode ter virado redundante, e a asserção da quina precisa ser remedida',
    ).toBe(true);
  });
});
