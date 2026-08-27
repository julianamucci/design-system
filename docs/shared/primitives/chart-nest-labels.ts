// Rótulos da rosca aninhada — a forma, em um lugar só.
//
// As cinco stacks montam o option da rosca aninhada cada uma do seu jeito, mas o
// RÓTULO tem de sair igual nas cinco: mesma posição, mesmo texto, mesma placa.
// Escrito aqui, ele não tem como divergir; escrito cinco vezes, divergiria na
// primeira vez que alguém ajustasse um padding.
//
// São funções PURAS de cores já resolvidas. Quem resolve token é cada stack, no
// ponto em que ela já resolve a cor da trama do decal — este módulo não toca o
// DOM e por isso se verifica sem navegador.
//
// ─── Por que o rótulo de dentro vai numa PLACA ───────────────────────────────
//
// Medido contra as oito cores de série, nos três temas e nos dois modos:
//
//   texto em `--foreground` sobre a fatia · pior caso 1.48 — REPROVA
//   texto em `--background` sobre a fatia · pior caso 6.81 — passa
//
// Faz sentido: a paleta foi afinada para contrastar com o FUNDO DA PÁGINA, e é
// por isso que a cor do fundo sobrevive por cima dela — o mesmo motivo pelo qual
// a trama do decal é traçada nela.
//
// E é justamente aí que está o problema: a trama TAMBÉM é `--background`. Texto
// da mesma cor da hachura se perde onde os dois se cruzam. A placa resolve os
// dois de uma vez — o texto passa a ficar sobre um preenchimento sólido, e o que
// separa a placa da fatia é esse preenchimento (6.81), não a borda, que mede
// 1.22 contra o fundo e vale como decoração, não como objeto gráfico.
//
// Sobre a placa, o texto mede 13.08 no pior caso.

/** Cores e medidas já resolvidas pela stack — nada de token aqui dentro. */
export interface NestLabelTokens {
  /** `--foreground`: o texto do rótulo. */
  foreground: string;
  /** `--background`: o preenchimento da placa. É ele que a separa da fatia. */
  background: string;
  /** `--border`: a borda da placa e a linha-guia. Decoração. */
  border: string;
  /** `--muted`: o fundo da pílula de participação. */
  muted: string;
  /** `--muted-foreground`: o texto da pílula. Mede 4.73 sobre `--muted`. */
  mutedForeground: string;
  /** Degrau tipográfico do corpo, em px, já derivado da fonte raiz (WCAG 1.4.4). */
  fontSize: number;
}

/**
 * O rótulo do anel de DENTRO: o nome do grupo, dentro do próprio arco.
 *
 * Fica dentro porque o arco interno é grande e o nome pertence a ele; posto por
 * fora, ele disputaria espaço com os rótulos do anel externo e a linha-guia
 * teria de atravessar o outro anel.
 */
export function nestInnerLabel(t: NestLabelTokens): Record<string, unknown> {
  return {
    show: true,
    position: 'inner',
    formatter: '{b}',
    color: t.foreground,
    fontSize: t.fontSize,
    backgroundColor: t.background,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: [3, 6],
  };
}

/**
 * O rótulo do anel de FORA: o nome, o valor e a participação, em três trechos.
 *
 * Três trechos e não uma frase só porque eles têm pesos diferentes de leitura —
 * o nome identifica, o valor é o dado, a participação é a razão que a ÁREA
 * comunica. O recurso de texto rico da lib é o que permite dar peso próprio a
 * cada um sem quebrar em três rótulos sobrepostos.
 *
 * A participação sai numa pílula, e não solta, para não se confundir com o
 * valor ao lado: são dois números vizinhos, e sem a pílula a leitura teria de
 * separá-los pela unidade — que só aparece no fim de um deles.
 */
export function nestOuterLabel(t: NestLabelTokens): Record<string, unknown> {
  return {
    show: true,
    position: 'outside',
    // `{b}` nome, `{c}` valor, `{d}` participação — os três vêm da lib já
    // calculados sobre o mesmo total que o desenho usa, então o rótulo não pode
    // discordar do arco que ele nomeia.
    formatter: '{nome|{b}}\n{valor|{c}}{fatia|{d}%}',
    color: t.foreground,
    fontSize: t.fontSize,
    backgroundColor: t.background,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: [4, 6],
    rich: {
      nome: {
        color: t.foreground,
        fontSize: t.fontSize,
        // A primeira linha respira em relação à segunda; sem isto os dois
        // trechos encostam e o rótulo parece uma palavra só.
        lineHeight: Math.round(t.fontSize * 1.6),
      },
      valor: {
        color: t.foreground,
        fontSize: t.fontSize,
        fontWeight: 600,
        padding: [0, 6, 0, 0],
      },
      fatia: {
        color: t.mutedForeground,
        backgroundColor: t.muted,
        // A borda não é enfeite. Com ela, a pílula sai do desenhador com
        // `paint-order="stroke"`, que é a marca pela qual as suítes separam
        // cromo de rótulo de forma de dado — sem borda ela vinha sem a marca e
        // era contada como fatia. Medido: o portão da rosca aninhada acusou 21
        // formas onde havia 8.
        borderColor: t.border,
        borderWidth: 1,
        fontSize: t.fontSize,
        padding: [2, 5],
        borderRadius: 999,
      },
    },
  };
}

/** A linha que liga o rótulo de fora ao arco. Decoração, como a borda da placa. */
export function nestLabelLine(t: NestLabelTokens): Record<string, unknown> {
  return { show: true, lineStyle: { color: t.border } };
}

/**
 * Reaplica as cores do rótulo a um option já montado.
 *
 * Existe porque três stacks montam o option em construtor PURO e resolvem token
 * no container — é lá que a trama do decal é injetada, e o rótulo precisa do
 * mesmo tratamento pelo mesmo motivo: as duas coisas carregam cor RESOLVIDA, e
 * `setTheme` relê o registro do tema, nunca o option. Sem esta passada, trocar
 * para o modo escuro deixaria a placa branca e o texto quase invisível.
 *
 * Identifica os dois anéis pelo mesmo sinal que a tabela usa: o anel de FORA é o
 * que carrega `group` em cada item. Um sinal só, num lugar só — se ele mudar, os
 * dois mudam juntos.
 */
export function withNestLabelTokens(
  option: Record<string, unknown>,
  tokens: NestLabelTokens,
): Record<string, unknown> {
  const series = option.series;
  if (!Array.isArray(series)) return option;

  const temGrupo = (serie: unknown): boolean => {
    const data = (serie as { data?: unknown }).data;
    return Array.isArray(data) && data.some(
      (item) => item !== null && typeof item === 'object' && 'group' in (item as object),
    );
  };
  // Só mexe quando há de fato uma rosca aninhada no option: um gráfico de outro
  // tipo passa por aqui sem ser tocado.
  if (!series.some((serie) => (serie as { type?: unknown }).type === 'pie' && temGrupo(serie))) {
    return option;
  }

  return {
    ...option,
    series: series.map((serie) => {
      if ((serie as { type?: unknown }).type !== 'pie') return serie;
      return temGrupo(serie)
        ? { ...(serie as object), label: nestOuterLabel(tokens), labelLine: nestLabelLine(tokens) }
        : { ...(serie as object), label: nestInnerLabel(tokens) };
    }),
  };
}

/**
 * Reaplica as cores dos rótulos de um option já montado — os dois tipos.
 *
 * A rosca aninhada tem o rótulo SUBSTITUÍDO: posição, texto rico e placa são
 * nossos, e o construtor os emitiu com cores de partida. As demais séries têm o
 * rótulo MESCLADO: ali o que é nosso são as três declarações de estilo, e
 * `show`, `position` e `formatter` continuam vindo de quem montou o option.
 *
 * Existe porque três stacks montam o option em construtor PURO e resolvem token
 * no container — é lá que a trama do decal é injetada, e o rótulo precisa do
 * mesmo tratamento pelo mesmo motivo: os dois carregam cor RESOLVIDA, e
 * `setTheme` relê o registro do tema, nunca o option.
 */
export function withChartLabelTokens(
  option: Record<string, unknown>,
  tokens: NestLabelTokens,
): Record<string, unknown> {
  const comRosca = withNestLabelTokens(option, tokens);
  const series = comRosca.series;
  if (!Array.isArray(series)) return comRosca;

  const estilo = valueLabelStyle(tokens);
  let mexeu = false;
  const novas = series.map((serie) => {
    const s = serie as { type?: unknown; label?: { show?: unknown } };
    // A rosca já foi tratada acima; aqui é o rótulo de valor do cartesiano.
    if (s.type === 'pie' || s.label?.show !== true) return serie;
    mexeu = true;
    return { ...(serie as object), label: { ...s.label, ...estilo } };
  });
  // Devolve o MESMO objeto quando não há o que mexer: em svelte a identidade
  // decide se o efeito reaplica o option, e reaplicar reseta o desenho.
  return mexeu ? { ...comRosca, series: novas } : comRosca;
}

// ─── Rótulo de valor ─────────────────────────────────────────────────────────
//
// O número escrito junto do dado, quando há uma série só. Com duas ou mais os
// números se sobrepõem e quem entrega o valor exato é a tabela.
//
// As três declarações abaixo NÃO são enfeite, e o tema não pode carregá-las:
// medido, um bloco `bar: { label: … }` registrado no tema sai ignorado — o
// rótulo desenha idêntico com e sem ele. O estilo tem de viajar no option.
//
// Sem elas a lib usa os padrões dela: cinza `#333` fixo, halo branco de 2px e
// corpo de 12px cravado. Medido contra o fundo da página, nos três temas:
//
//   claro   `#333` 12.46 · halo branco  1.01
//   escuro  `#333`  1.06 · halo branco 13.36
//
// No claro funcionava por ACIDENTE — texto escuro, halo invisível. No escuro o
// texto sumia e sobrava o halo: o número virava o próprio contorno, grosso e
// borrado. Com `--foreground` mede de 13.08 a 18.04 nos dois modos, e aí o halo
// perde a função — ele existe para socorrer uma cor que não conhece o tema, e é
// ele que empasta o texto no corpo pequeno.

/** O que o rótulo de valor precisa do tema. */
export interface ValueLabelTokens {
  /** `--foreground`: mede de 13.08 a 18.04 contra o fundo, nos dois modos. */
  foreground: string;
  /** Degrau do corpo, já derivado da fonte raiz (WCAG 1.4.4). */
  fontSize: number;
}

/** As três declarações de estilo. Mescla com `show`, `position` e `formatter`. */
export function valueLabelStyle(t: ValueLabelTokens): Record<string, unknown> {
  return { color: t.foreground, fontSize: t.fontSize, textBorderWidth: 0 };
}
