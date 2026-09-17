/**
 * Esconde do leitor de tela tudo o que está FORA de um elemento — o algoritmo
 * "esconder os outros".
 *
 * ─── O que faz ───────────────────────────────────────────────────────────────
 *
 * Para cada ancestral do alvo até o `<body>` (o próprio alvo incluído), os
 * IRMÃOS desse ancestral ganham `aria-hidden="true"`. O alvo e a cadeia de
 * ancestrais dele não são tocados — escondê-los esconderia o próprio painel.
 *
 * `aria-hidden` e NÃO `inert`: `inert` também bloqueia ponteiro nos elementos de
 * fora, e o contrato "clique fora fecha" do popover depende de o clique chegar.
 *
 * ─── O que NÃO é escondido: região viva e `<script>` ─────────────────────────
 *
 * Região viva existe para ser ANUNCIADA sem receber foco; escondê-la apaga o
 * anúncio — um toast de "salvo" ou de erro fica mudo com o painel aberto. Por
 * isso `[aria-live]` (qualquer valor), os papéis que implicam região viva
 * (`status`, `alert`, `log`, `progressbar`, `marquee`, `timer`) e `<script>`
 * (que não chega à árvore de acessibilidade) são pulados — o mesmo que fazem o
 * `markOthers` da base-ui e o pacote `aria-hidden` 1.2.6 usado pela reka.
 *
 * ─── Por que existe ──────────────────────────────────────────────────────────
 *
 * Decisão da dona de 2026-09-17 (item 7 da §7 de `docs/shared/prd/popover.md`):
 * no modo modal o resto da página fica escondido do leitor de tela, nas cinco
 * stacks. `aria-modal="true"` promete o mesmo, mas os leitores de tela o honram
 * de forma desigual — o VoiceOver do Safari é o caso conhecido. As outras quatro
 * recebem isto da lib ou o escrevem sobre ela; esta stack não tem lib.
 *
 * ─── A restauração, e por que ela é CONTADA ──────────────────────────────────
 *
 * A forma ingênua — cada instância guarda o valor anterior e o devolve — tem o
 * mesmo defeito da trava de rolagem (`@/lib/scroll-lock`): com dois painéis
 * abertos, o segundo lê `"true"` (escrito pelo primeiro) como "valor anterior".
 * Se o primeiro fecha antes, ele devolve o atributo original; quando o segundo
 * fecha, devolve `"true"` — e o elemento fica escondido para sempre, sem erro.
 *
 * Por isso o estado de cada elemento é do DOCUMENTO, contado por elemento: o
 * valor original é lido UMA vez, quando a primeira instância o esconde, e
 * devolvido UMA vez, quando a última o solta — exatamente, inclusive um
 * `aria-hidden` que já existia com qualquer valor. A instância guarda só a LISTA
 * do que ela mesma escondeu, e é essa lista que a função de restauração percorre;
 * chamá-la duas vezes é no-op, para um fechamento duplo não soltar a contagem de
 * outra instância.
 */

/**
 * Papéis que IMPLICAM região viva — quem os declara é anunciado sem foco, e
 * `aria-hidden` calaria o anúncio exatamente como em `[aria-live]`.
 */
const LIVE_ROLES = new Set(['status', 'alert', 'log', 'progressbar', 'marquee', 'timer']);

/** Pular: região viva (o anúncio morreria) ou `<script>` (não é conteúdo). */
function isLiveRegionOrScript(element: Element): boolean {
  if (element.tagName === 'SCRIPT') return true;
  if (element.hasAttribute('aria-live')) return true;
  const role = element.getAttribute('role');
  if (role === null) return false;
  return role.trim().toLowerCase().split(/\s+/).some((token) => LIVE_ROLES.has(token));
}

/** Quantas instâncias estão escondendo cada elemento. */
const counts = new WeakMap<Element, number>();
/** O `aria-hidden` de antes da primeira instância — `null` quando não havia. */
const originals = new WeakMap<Element, string | null>();

/**
 * Esconde tudo o que está fora de `target` e devolve a função que desfaz
 * EXATAMENTE o que esta chamada fez.
 *
 * Alvo fora do documento não esconde nada: não há ancestrais até o `<body>`.
 */
export function hideOthers(target: Element): () => void {
  if (typeof document === 'undefined') return () => {};
  const body = document.body;
  const hidden: Element[] = [];

  if (body && body.contains(target) && target !== body) {
    let node: Element = target;
    while (node !== body && node.parentElement) {
      const parent: Element = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node) continue;
        if (isLiveRegionOrScript(sibling)) continue;
        const count = counts.get(sibling) ?? 0;
        if (count === 0) {
          originals.set(sibling, sibling.getAttribute('aria-hidden'));
          sibling.setAttribute('aria-hidden', 'true');
        }
        counts.set(sibling, count + 1);
        hidden.push(sibling);
      }
      node = parent;
    }
  }

  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    for (const el of hidden) {
      const count = counts.get(el) ?? 0;
      if (count > 1) {
        counts.set(el, count - 1);
        continue;
      }
      counts.delete(el);
      const original = originals.get(el);
      originals.delete(el);
      if (original === null || original === undefined) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', original);
    }
  };
}
