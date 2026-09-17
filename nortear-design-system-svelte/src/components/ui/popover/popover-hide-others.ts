/**
 * Modo modal: o resto da página escondido do leitor de tela — e DEVOLVIDO
 * exatamente como estava ao fechar.
 *
 * Decisão da dona de 2026-09-17 (item 7 da §7 do PRD), igual nas cinco: com o
 * modo modal e o painel aberto, todo elemento fora do painel recebe
 * `aria-hidden="true"`, SEMPRE — com ou sem peça de fechar. `aria-hidden`, e não
 * `inert`: `inert` também bloquearia o ponteiro fora do painel, e o contrato
 * "clique fora fecha" depende dele.
 *
 * ─── Por que esta stack implementa ─────────────────────────────────────────
 *
 * O bits-ui 2.19 não esconde nada: o Popover dele não tem `modal`, e o painel
 * (`bits/popover/components/popover-content.svelte`) só repassa `trapFocus` e
 * `preventScroll` à camada flutuante — nenhuma das duas escreve `aria-hidden`
 * fora do painel. `trapFocus` + `preventScroll` são o modo modal desta stack
 * (ver `popover-content.svelte`); o esconder é este módulo.
 *
 * ─── O algoritmo ───────────────────────────────────────────────────────────
 *
 * "Esconder os outros": para cada ancestral do painel até o `<body>`, os IRMÃOS
 * desse ancestral ganham `aria-hidden="true"`; o painel e a cadeia de
 * ancestrais dele não. É o mesmo percurso do pacote `aria-hidden` que as libs
 * das outras stacks usam (e do `markOthers` da base-ui).
 *
 * ─── O que NÃO é escondido: região viva e `<script>` ───────────────────────
 *
 * Região viva existe para ser ANUNCIADA sem receber foco, e `aria-hidden` apaga
 * o anúncio — o toast de "salvo" ficaria mudo com o painel aberto.
 *
 * A lista é a das outras stacks que também implementam o algoritmo
 * (`react/.../popover.tsx`, `vanilla/src/lib/hide-others.ts`,
 * `angular/.../popover.ts`): `[aria-live]` com qualquer valor, `<script>` (que
 * não chega à árvore de acessibilidade) e os seis papéis que IMPLICAM região
 * viva — `status`, `alert`, `log`, `progressbar`, `marquee`, `timer`.
 *
 * Os seis papéis entraram em 2026-09-17. Antes a exceção era só por ATRIBUTO, e
 * a diferença não era teórica: `role="status"` e `role="alert"` têm `aria-live`
 * implícito pela ARIA, então o toast marcado apenas pelo papel — que é a forma
 * mais comum — emudecia com o painel modal aberto. O `markOthers` da base-ui
 * (`floating-ui-react/utils/markOthers.mjs:86`) para no atributo, e é
 * justamente por isso que as outras stacks complementam a lib em vez de
 * herdá-la; aqui o algoritmo é todo nosso, então a lista é escrita direto.
 *
 * O papel é lido como LISTA DE TOKENS e em minúsculas, igual às outras três:
 * `role` aceita vários valores separados por espaço, e o primeiro que a ARIA
 * reconhece vence — um `role="status alert"` é região viva do mesmo jeito.
 *
 * A diferença está na RESTAURAÇÃO, e é de propósito: o pacote trata
 * `aria-hidden="false"` como "não escondido" e, ao desfazer, REMOVE o atributo.
 * Aqui cada elemento tocado guarda o valor de ANTES — ausente ou qualquer
 * valor — e volta exatamente a ele. Elemento que já tinha `aria-hidden` que não
 * seja `"false"` já está escondido e nem é tocado.
 *
 * Painéis modais aninhados desfazem na ordem inversa (o de dentro fecha antes),
 * então cada um devolve o que encontrou e nada fica para trás.
 *
 * Função pura sobre o DOM; quem liga e desliga é o `$effect` do
 * `popover-content.svelte`.
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

export function hideOthers(panel: Element): () => void {
  const body = panel.ownerDocument.body;
  if (!body.contains(panel)) return () => {};

  const targets = new Set<Element>([panel]);
  // O candidato é colhido por SELETOR e decidido pelo predicado: o seletor
  // `[role]` não sabe ler lista de tokens sem diferenciar maiúscula, e é o
  // predicado que dá a mesma resposta das outras três stacks.
  for (const el of body.querySelectorAll('[aria-live], script, [role]')) {
    if (isLiveRegionOrScript(el)) targets.add(el);
  }

  // A cadeia de ancestrais de cada alvo: é por ela que o percurso DESCE.
  const keep = new Set<Element>();
  for (const target of targets) {
    for (let node: Element | null = target; node && node !== body; node = node.parentElement) {
      keep.add(node);
    }
  }

  const touched: Array<[Element, string | null]> = [];

  const walk = (parent: Element): void => {
    for (const child of Array.from(parent.children)) {
      if (targets.has(child)) continue;
      if (keep.has(child)) {
        walk(child);
        continue;
      }
      const previous = child.getAttribute('aria-hidden');
      if (previous !== null && previous !== 'false') continue;
      touched.push([child, previous]);
      child.setAttribute('aria-hidden', 'true');
    }
  };
  walk(body);

  return () => {
    for (const [el, previous] of touched) {
      if (previous === null) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', previous);
    }
    touched.length = 0;
  };
}
