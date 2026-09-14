/**
 * Onde mora o ANÚNCIO de uma notificação temporária — instrumento das cinco.
 *
 * Uma região viva só é observada pela tecnologia assistiva se existir ANTES de o
 * conteúdo mudar. A notificação É o conteúdo: ela nasce já com o texto, e quem
 * põe o `aria-live` nela entrega ao leitor um elemento que ele não estava
 * observando. O lugar certo é a região persistente.
 *
 * Medido em 2026-09-13, na fonte instalada de cada lib e no código das duas
 * stacks à mão — e o resultado era três padrões diferentes para o mesmo
 * componente:
 *
 *   react    região viva · notificação sem papel e sem `aria-live`   ← certo
 *   vue      região viva · notificação sem papel e sem `aria-live`   ← certo
 *   svelte   região viva · notificação TAMBÉM viva                   ← aninhado
 *   vanilla  região SEM `aria-live` · notificação viva               ← invertido
 *   angular  região SEM `aria-live` · notificação viva               ← invertido
 *
 * Nada disso é visto por portão: `aria-live` aninhado não é violação de axe, e
 * região sem `aria-live` também não. Por isso a prova é por story, e por isso ela
 * mora aqui — asserção escrita cinco vezes é asserção que diverge na sexta.
 *
 * `role="status"` conta como `aria-live`, e essa é a parte que engana: o papel
 * JÁ IMPLICA `polite`. Tirar o atributo e manter o papel não desfaz o
 * aninhamento — traz o anúncio de volta pela porta implícita. Por isso a
 * verificação da notificação olha os DOIS.
 */

// @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
// que inclui este arquivo compartilhado: daqui o caminho de node_modules é o de
// docs/shared, que não tem as libs de teste. Mesmo marcador do slider-probe.
import { expect } from 'storybook/test';

/**
 * A LISTA das notificações. As cinco stacks publicam o mesmo atributo — mas ele
 * NÃO marca o mesmo papel nas cinco, e foi essa a premissa errada da primeira
 * versão desta sonda.
 *
 * No vanilla e no angular o elemento com `data-sonner-toaster` é a própria região
 * nomeada, e é nele que o `aria-live` mora. Nas três libs ele é um `<ol>` DENTRO
 * de uma `<section>` nomeada, e o `aria-live` está na `<section>` — medido na
 * fonte instalada em 2026-09-13: `sonner/dist/index.mjs:1141-1160`,
 * `vue-sonner/lib/index.js:1153-1162`, `svelte-sonner/dist/Toaster.svelte:388-411`.
 * A sonda media o `<ol>` e reprovava as três stacks que estavam CERTAS, com
 * "a região precisa anunciar: expected null".
 */
export const SELECTOR_REGIAO = '[data-sonner-toaster]';

/** Uma notificação. As cinco stacks publicam o mesmo atributo. */
export const SELECTOR_NOTIFICACAO = '[data-sonner-toast]';

/**
 * A região que ANUNCIA: o próprio elemento com `data-sonner-toaster`, ou o
 * ancestral mais próximo dele que carrega `aria-live`. Ver `SELECTOR_REGIAO`.
 */
export function regiaoDeAnuncio(doc: Document = document): HTMLElement | null {
  const lista = doc.body.querySelector<HTMLElement>(SELECTOR_REGIAO);
  return lista?.closest<HTMLElement>('[aria-live]') ?? null;
}

function temPapelOuAtributoQueAnuncia(el: Element): boolean {
  const papel = el.getAttribute('role');
  return el.hasAttribute('aria-live') || (papel !== null && PAPEL_QUE_ANUNCIA.has(papel));
}

export function notificacoes(doc: Document = document): HTMLElement[] {
  return [...doc.body.querySelectorAll<HTMLElement>(SELECTOR_NOTIFICACAO)];
}

/** Os papéis cujo anúncio é implícito — declarados, não deduzidos. */
const PAPEL_QUE_ANUNCIA = new Set(['status', 'alert', 'log', 'marquee', 'timer']);

/**
 * O anúncio está na REGIÃO, e só nela.
 *
 * Cobra as duas metades, porque uma sozinha não fecha o contrato: a região viva
 * sem a segunda metade convive com o aninhamento do svelte, e a notificação
 * muda sem a primeira convive com o silêncio do vanilla.
 *
 * Chame com a notificação já na tela — é o estado em que o defeito existe.
 */
export function expectAnuncioNaRegiao(doc: Document = document): void {
  const lista = doc.body.querySelector<HTMLElement>(SELECTOR_REGIAO);
  expect(lista, 'nenhuma lista de notificação (`data-sonner-toaster`) no documento').not.toBeNull();

  const regiao = regiaoDeAnuncio(doc);
  expect(
    regiao,
    'nem a lista de notificações nem um ancestral dela carrega `aria-live` — nada anuncia',
  ).not.toBeNull();
  expect(regiao!.getAttribute('aria-live'), 'a região precisa anunciar em `polite`').toBe('polite');
  // O elemento vivo tem de ser a REGIÃO NOMEADA, e não um ancestral qualquer da
  // página que por acaso carregue `aria-live`: sem isto, `closest` subindo até
  // o documento aprovaria uma notificação solta. As cinco nomeiam a região (D2).
  expect(
    (regiao!.getAttribute('aria-label') ?? '').trim(),
    `o elemento que anuncia (<${regiao!.tagName.toLowerCase()}>) não é a região nomeada`,
  ).not.toBe('');

  for (const nota of notificacoes(doc)) {
    expect(regiao!.contains(nota), 'a notificação está fora da região que anuncia').toBe(true);

    // Nenhum elemento entre a região viva e a notificação — a própria notificação
    // incluída — pode anunciar de novo. Olhar só a notificação deixaria passar um
    // `<ol aria-live>` intermediário, que é o mesmo aninhamento por outro degrau.
    for (let el: Element | null = nota; el && el !== regiao; el = el.parentElement) {
      expect(
        temPapelOuAtributoQueAnuncia(el),
        `<${el.tagName.toLowerCase()}> carrega role="${el.getAttribute('role')}" ` +
          `aria-live="${el.getAttribute('aria-live')}" dentro da região viva — são duas regiões ` +
          'vivas encaixadas, e o mesmo texto é anunciado duas vezes',
      ).toBe(false);
    }
  }
}

/**
 * A notificação NÃO é parada de teclado.
 *
 * Torrada que some sozinha não deveria receber Tab: quem chega nela perde o foco
 * quando o prazo vence, e vai parar no início do documento. As três libs nascem
 * com `tabindex="0"` no elemento da notificação, e as três são corrigidas por
 * `patch-package` — vue e svelte desde antes, react em 2026-09-13.
 *
 * O que se afirma é o EFEITO (`tabIndex` negativo), não o atributo: o vanilla e
 * o angular nunca escrevem `tabindex` nenhum, e `el.tabIndex` devolve -1 para
 * elemento não focável, que é exatamente o contrato. Afirmar o atributo faria a
 * asserção passar em três stacks e falhar em duas que estão certas.
 */
export function expectNotificacaoForaDoTab(doc: Document = document): void {
  for (const nota of notificacoes(doc)) {
    expect(
      nota.tabIndex,
      `a notificação está na ordem de tabulação (tabIndex=${nota.tabIndex}) — torrada que ` +
        'some sozinha leva o foco embora junto',
    ).toBeLessThan(0);
  }
}
