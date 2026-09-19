/**
 * A PREMISSA da tabela de props da família de menus, conferida contra a lib.
 *
 * Por que este arquivo existe (§7 #21c do PRD do DropdownMenu). A tabela de
 * props de uma docs page é uma PROMESSA: cada linha diz "passe isto e o
 * componente obedece". Documentar prop que a lib por baixo não tem é prometer o
 * que o componente ignora — e nada reprova, porque a tabela é conteúdo, não
 * código: o `vue-tsc` não abre `translations.json`, e a docs page monta a linha
 * a partir de uma chave que existe de qualquer jeito.
 *
 * O sentido contrário é o que custa caro com o tempo: a prop existe, a tabela
 * não a lista, e a omissão fica invisível para sempre. Medido em 2026-09-18 no
 * svelte, o bits NÃO tem `defaultOpen`, `modal` nem `defaultValue`, e lá a
 * ausência foi declarada. Medido aqui no mesmo dia, a **reka TEM as três** — e é
 * por isso que as três estão na tabela desta stack. As duas leituras são
 * opostas e as duas precisam de portão, senão um bump transforma qualquer uma
 * delas em dívida silenciosa.
 *
 * O que ele NÃO mede: se a prop FUNCIONA. Isso é das stories, no navegador.
 * Aqui a pergunta é só se a superfície existe — e ela é respondida contra o
 * pacote instalado, não contra a documentação da lib.
 */
import { describe, expect, it } from 'vitest';
import {
  ContextMenuContent,
  ContextMenuRoot,
  ContextMenuSubContent,
  DropdownMenuRoot,
  DropdownMenuSubContent,
  MenubarRoot,
  MenubarSubContent,
} from 'reka-ui';

/**
 * Os nomes de prop que a peça da lib declara.
 *
 * Um componente SFC compilado publica `props` como objeto (com o padrão de
 * cada uma) ou como lista de nomes, conforme o que a declaração precisou. Os
 * dois casos entram, porque a pergunta é só sobre o NOME.
 */
function propsDe(part: unknown): Set<string> {
  const declared = (part as { props?: unknown }).props;
  if (Array.isArray(declared)) return new Set(declared as string[]);
  if (declared && typeof declared === 'object') return new Set(Object.keys(declared));
  return new Set<string>();
}

/** O padrão que a lib declara para uma prop, quando ela o declara. */
function defaultOf(part: unknown, prop: string): unknown {
  const declared = (part as { props?: Record<string, { default?: unknown }> }).props;
  if (Array.isArray(declared) || !declared) return undefined;
  return declared[prop]?.default;
}

describe('a tabela de props promete o que a reka tem', () => {
  // As linhas que a `DropdownMenuDocs.vue` monta para a raiz, e a
  // `MenubarDocs.vue` para a barra. Cada nome aqui é uma linha lá.
  it.each([
    ['DropdownMenuRoot', DropdownMenuRoot, ['open', 'defaultOpen', 'modal']],
    ['MenubarRoot', MenubarRoot, ['modelValue', 'defaultValue', 'loop']],
  ])('%s declara o que a tabela lista', (_nome, part, esperadas) => {
    const props = propsDe(part);
    expect([...esperadas].filter((p) => !props.has(p))).toEqual([]);
  });

  /**
   * E o ContextMenu é o caso que só a medição resolve: a raiz dele NÃO tem
   * `defaultOpen`, porque a reka a monta com `Omit<MenuProps, 'open'>` — o menu
   * nasce do gesto, não de um estado inicial. A tabela desta página não lista
   * nenhum dos dois, e esta asserção é o que mantém a omissão sendo uma
   * DECISÃO: se a lib passar a aceitar, o caso reprova e a linha entra.
   */
  it('a raiz do ContextMenu não tem estado inicial para documentar', () => {
    const props = propsDe(ContextMenuRoot);
    expect(props.has('modal')).toBe(true);
    expect(props.has('open')).toBe(false);
    expect(props.has('defaultOpen')).toBe(false);
  });
});

/**
 * A D15 fixou o vão do submenu em `sideOffset: 0` / `alignOffset: -4` nos três
 * membros, e o painel raiz do ContextMenu em `0`/`0`. Metade desse último par
 * não existe nesta lib, e a diferença é do desenho da peça, não de versão.
 */
describe('D15 — o vão que os wrappers declaram existe na peça que o recebe', () => {
  it.each([
    ['DropdownMenuSubContent', DropdownMenuSubContent],
    ['MenubarSubContent', MenubarSubContent],
    ['ContextMenuSubContent', ContextMenuSubContent],
  ])('%s aceita os dois deslocamentos', (_nome, part) => {
    const props = propsDe(part);
    expect(props.has('sideOffset')).toBe(true);
    expect(props.has('alignOffset')).toBe(true);
  });

  /**
   * O painel raiz do ContextMenu se ancora numa referência VIRTUAL — o ponto do
   * gesto —, e a reka retira dele `side`, `sideOffset` e `align`: não há lado a
   * escolher nem vão de lado a medir contra um ponto. `ContextMenuContent.vue`
   * declara só o `alignOffset`, e este caso é a premissa daquela declaração.
   *
   * Se um bump devolver `sideOffset` à peça, isto reprova — e aí a D15 ganha um
   * número para decidir, em vez de a omissão continuar valendo por inércia.
   */
  it('o painel raiz do ContextMenu não tem `sideOffset`, e o `alignOffset` nasce em 0', () => {
    const props = propsDe(ContextMenuContent);
    expect(props.has('sideOffset')).toBe(false);
    expect(props.has('side')).toBe(false);
    expect(props.has('align')).toBe(false);
    expect(props.has('alignOffset')).toBe(true);
    // O `0` que o wrapper declara coincide com o da lib hoje. Declará-lo mesmo
    // assim é o que torna o número NOSSO; este caso é o que avisa no dia em que
    // os dois deixarem de coincidir.
    expect(defaultOf(ContextMenuContent, 'alignOffset')).toBe(0);
  });
});
