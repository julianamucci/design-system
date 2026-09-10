/**
 * track-label.ts — decide o `label` dos eventos `docs_*`.
 *
 * O `label` é ID ESTÁVEL, nunca texto. Decisão da dona em 2026-09-10.
 *
 * Até ali ele saía de `data-track-label ?? textContent` e, nas demonstrações
 * auto-instrumentadas, de `aria-label ?? textContent`. As duas rotas mandavam o
 * texto da tela no idioma de quem clicou: o mesmo clique no mesmo botão virava
 * "Salvar", "Save" e "Guardar" no GA4, três valores que a série não junta. E os
 * call sites alimentavam o atributo com texto também — 32 chamadas de tradução
 * (`tContent(`, `$tStore(`) e literais como "Copiar código", nas cinco stacks.
 *
 * A regra é a mesma que o `CLAUDE.md` da raiz já fixava para os eventos de
 * produto ("payloads carry stable values, never translated text"). Os eventos
 * `docs_*` escapavam dela porque carregam um `data-track-id` estável ao lado, e
 * o `label` parecia complemento inofensivo. Não era: é uma dimensão do GA4 como
 * qualquer outra.
 *
 * Função pura, e por isso mora aqui e não nas stacks: decide, não age — recebe
 * os valores já lidos do DOM e devolve qual deles vai para o payload. Quem lê o
 * atributo é o rastreador de cada stack.
 */

/**
 * Forma de id: começa em minúscula ou dígito; sem espaço, sem acento, sem
 * pontuação de frase; segmentos ligados por `-`, `_`, `.` ou `:`. Aceita
 * camelCase depois da primeira letra porque ids já publicados usam
 * (`acceptTerms`, `darkMode`), e trocá-los partiria as séries existentes.
 *
 * O que ela recusa é exatamente o que chegava: "Salvar" (maiúscula inicial),
 * "Copiar código" (espaço e acento), "Ver variant destructive" (espaço).
 */
const ID_SHAPE = /^[a-z0-9][a-zA-Z0-9]*(?:[-_.:][a-zA-Z0-9]+)*$/;

export function isStableId(value: string | null | undefined): value is string {
  return typeof value === 'string' && ID_SHAPE.test(value);
}

export interface ResolvedTrackLabel {
  /** O que vai para o payload: sempre um id estável, ou `''` se não houver nenhum. */
  label: string;
  /**
   * O valor declarado em `data-track-label` que foi RECUSADO por não ter forma
   * de id. Existe para o console de `?debugAnalytics=1` avisar — sem ele, o
   * descarte seria silencioso, e call site com texto passaria despercebido.
   */
  rejected?: string;
}

/**
 * @param declared     o `data-track-label` lido do elemento (ou `null`).
 * @param fallbacks    ids de reserva, em ordem de preferência — o segmento
 *                     `element` do `data-track-id`, o `data-slot`. Só entra o
 *                     primeiro que tiver forma de id.
 */
export function resolveTrackLabel(
  declared: string | null | undefined,
  ...fallbacks: Array<string | null | undefined>
): ResolvedTrackLabel {
  const fallback = fallbacks.find(isStableId) ?? '';
  if (declared === null || declared === undefined || declared === '') {
    return { label: fallback };
  }
  if (isStableId(declared)) return { label: declared };
  return { label: fallback, rejected: declared };
}
