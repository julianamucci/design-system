/**
 * Sonda de comparação do Avatar entre as cinco stacks.
 *
 * Passo padrão da auditoria (quality 2f1): medir as cinco de uma vez, com o
 * mesmo colhedor, antes de corrigir qualquer coisa.
 *
 * A função inteira do avatar é a RECONCILIAÇÃO: mostrar a foto quando ela
 * carrega, as iniciais quando não. Isso vive em três camadas diferentes por
 * stack (lib headless, CSS, factory) e não aparece em screenshot nenhum — o
 * estado "falhou" costuma ser exatamente o que ninguém mede. Junto vem o que o
 * leitor de tela ouve, que é o outro lado invisível: iniciais anunciadas em
 * cima do `alt` da foto viram duas vozes para uma pessoa só.
 */

function text(el: Element | null): string {
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ');
}

/** Visível de verdade: `display: none` e caixa zerada contam como ausente. */
function visible(el: HTMLElement | null): boolean {
  if (!el) return false;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function measurement(el: HTMLElement | null) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    width: Math.round(r.width),
    height: Math.round(r.height),
    raio: cs.borderRadius,
    tamanhoDaFonte: cs.fontSize,
    background: cs.backgroundColor,
    cor: cs.color,
  };
}

/**
 * Mede UM avatar.
 *
 * O que o leitor anuncia é derivado, não adivinhado: junta o `alt` da imagem
 * visível, o `aria-label` do fallback e o texto das iniciais na ordem em que
 * eles entram na árvore de acessibilidade.
 */
export function measureAvatar(root: HTMLElement) {
  const avatar = root.matches?.('.nds-avatar')
    ? root
    : root.querySelector<HTMLElement>('.nds-avatar');
  if (!avatar) return { finding: false as const };

  const img = avatar.querySelector<HTMLImageElement>('.nds-avatar-image');
  const fallback = avatar.querySelector<HTMLElement>('.nds-avatar-fallback');
  const badge = avatar.querySelector<HTMLElement>('.nds-avatar-badge');
  const icone = fallback?.querySelector<HTMLElement>('svg') ?? null;

  const imgVisible = visible(img);
  const fallbackVisible = visible(fallback);

  return {
    finding: true as const,
    estrutura: {
      tagDaRaiz: avatar.tagName.toLowerCase(),
      size: avatar.getAttribute('data-size'),
      temImagem: img ? 'sim' : 'não',
      temFallback: fallback ? 'sim' : 'não',
      /** Qual das duas peças está de fato na tela — é o coração do componente. */
      naTela: imgVisible ? 'imagem' : fallbackVisible ? 'fallback' : 'nenhuma',
    },
    semantica: {
      alt: img ? img.getAttribute('alt') : null,
      /**
       * Imagem escondida com `alt` não some da árvore de acessibilidade em todo
       * navegador; medir o par evita concluir cedo demais.
       */
      imagemEscondida: img ? (imgVisible ? 'não' : 'sim') : 'sem imagem',
      papelDoFallback: fallback?.getAttribute('role') ?? null,
      rotuloDoFallback: fallback?.getAttribute('aria-label') ?? null,
      fallbackEscondido: fallback?.getAttribute('aria-hidden') ?? 'não',
      iniciais: text(fallback),
      iconeEscondido: icone ? (icone.getAttribute('aria-hidden') ?? 'não') : 'sem ícone',
      papelDoBadge: badge ? badge.getAttribute('role') ?? 'sem papel' : 'sem badge',
      rotuloDoBadge: badge ? badge.getAttribute('aria-label') ?? null : null,
      /**
       * O que sobra para o leitor: a soma do que NÃO está escondido, na ordem
       * do DOM. Duas entradas aqui é o defeito clássico — foto e iniciais
       * anunciadas para a mesma pessoa.
       */
      vozes: [
        imgVisible && img?.getAttribute('alt') ? `img:${img.getAttribute('alt')}` : null,
        fallbackVisible && fallback?.getAttribute('aria-hidden') !== 'true'
          ? `fallback:${fallback?.getAttribute('aria-label') ?? text(fallback)}`
          : null,
        badge && badge.getAttribute('aria-hidden') !== 'true'
          ? `badge:${badge.getAttribute('aria-label') ?? text(badge)}`
          : null,
      ].filter(Boolean),
    },
    geometria: {
      root: measurement(avatar),
      fallback: measurement(fallback),
      icone: icone
        ? {
            width: Math.round(icone.getBoundingClientRect().width),
            height: Math.round(icone.getBoundingClientRect().height),
            /** Style inline vence a folha: registrar é como se detecta o desvio. */
            estiloInline: icone.getAttribute('style') ?? '',
            classes: String(icone.getAttribute('class') ?? ''),
          }
        : null,
      badge: badge
        ? {
            width: Math.round(badge.getBoundingClientRect().width),
            height: Math.round(badge.getBoundingClientRect().height),
          }
        : null,
    },
  };
}

/** Mede todos os avatares da tela, na ordem do DOM — usado pela story de tamanhos. */
export function measureAvatares(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('.nds-avatar')).map((a) => {
    const m = measureAvatar(a);
    return m.finding
      ? { size: m.estrutura.size, geometria: m.geometria.root, naTela: m.estrutura.naTela }
      : null;
  });
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportAvatar(stack: string, cenario: string, data: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(data)}`);
}
