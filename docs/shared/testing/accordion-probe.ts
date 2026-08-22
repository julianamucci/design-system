/**
 * Sonda de comparação do Accordion entre as quatro stacks.
 *
 * Passo padrão da auditoria (quality 2f1): medir as quatro de uma vez, com o
 * mesmo colhedor, antes de corrigir qualquer coisa.
 *
 * O accordion é um componente de DISCLOSURE: o que ele promete é que o gatilho
 * anuncie o estado, que o painel seja alcançável e que abrir um não deixe o
 * outro num limbo. Quase tudo isso é atributo ARIA — e atributo é exatamente o
 * que diverge em silêncio entre libs headless.
 */

import { contraste } from './alert-probe';

function texto(el: Element | null): string {
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ');
}

function caixa(el: HTMLElement | null) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    altura: Math.round(r.height),
    padding: cs.padding,
    background: cs.backgroundColor,
    cor: cs.color,
    pesoDaFonte: cs.fontWeight,
    tamanhoDaFonte: cs.fontSize,
    cursor: cs.cursor,
  };
}

/** Fundo composto: o painel costuma ser transparente sobre o card. */
function backgroundEffective(el: HTMLElement): string {
  let atual: HTMLElement | null = el;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const alfa = Number((cor.match(/-?[\d.]+/g) ?? [])[3] ?? 1);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) return cor;
    atual = atual.parentElement;
  }
  return 'rgb(255, 255, 255)';
}

export function measureAccordion(raiz: HTMLElement) {
  const triggers = Array.from(raiz.querySelectorAll<HTMLElement>('.nds-accordion-trigger'));
  const primeiro = triggers[0] ?? null;
  const conteudos = Array.from(raiz.querySelectorAll<HTMLElement>('.nds-accordion-content'));
  const itens = Array.from(raiz.querySelectorAll<HTMLElement>('.nds-accordion-item'));
  const chevron = primeiro?.querySelector<HTMLElement>('svg') ?? null;

  // Quem está aberto: o painel visível, não o que o data-state diz — atributo é
  // promessa, altura é entrega.
  const abertos = conteudos.filter((c) => c.getBoundingClientRect().height > 0).length;

  const background = primeiro ? backgroundEffective(primeiro) : 'rgb(255, 255, 255)';

  return {
    finding: triggers.length > 0,
    estrutura: {
      raiz: raiz.querySelector('.nds-accordion') ? '.nds-accordion' : null,
      itens: itens.length,
      triggers: triggers.length,
      conteudos: conteudos.length,
      abertos,
      /**
       * O gatilho precisa estar dentro de um HEADING para o leitor listar — e
       * heading é PAPEL, não tag. O bits emite <div role="heading" aria-level>,
       * que o leitor anuncia igual a um <h3>: medir a tag reportava divergência
       * onde a semântica é a mesma. Aconteceu nesta sonda.
       */
      papelDoEnvoltorio: (() => {
        const parent = primeiro?.parentElement;
        if (!parent) return null;
        const tag = parent.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) return 'heading ' + tag[1];
        if (parent.getAttribute('role') === 'heading') return 'heading ' + (parent.getAttribute('aria-level') ?? '?');
        return tag;
      })(),
      tagDoGatilho: primeiro?.tagName.toLowerCase() ?? null,
      tagDoConteudo: conteudos[0]?.tagName.toLowerCase() ?? null,
    },
    semantica: {
      expandido: primeiro?.getAttribute('aria-expanded') ?? null,
      controla: primeiro?.getAttribute('aria-controls') ? 'sim' : 'não',
      /** O painel aponta de volta para o gatilho? */
      labelledBy: conteudos[0]?.getAttribute('aria-labelledby') ? 'sim' : 'não',
      papelDoConteudo: conteudos[0]?.getAttribute('role') ?? null,
      /**
       * Estado do painel, agnóstico de lib: o base-ui marca `data-open` e
       * `data-closed`; reka, bits e a factory usam `data-state`. O CSS cobre as
       * duas convenções, e medir só uma acusava o React de não expor estado.
       */
      estadoDoConteudo: (() => {
        const c = conteudos[0];
        if (!c) return null;
        if (c.hasAttribute('data-state')) return c.getAttribute('data-state');
        if (c.hasAttribute('data-open')) return 'open';
        if (c.hasAttribute('data-closed')) return 'closed';
        return null;
      })(),
      escondidoDoConteudo: conteudos[0]?.hasAttribute('hidden') ? 'sim' : 'não',
      corpoInterno: conteudos[0]?.querySelector('.nds-accordion-content-body') ? 'sim' : 'não',
      estadoDoItem: itens[0]?.getAttribute('data-state') ?? null,
      estadoDoGatilho: primeiro?.getAttribute('data-state') ?? null,
      chevronEscondido: chevron?.getAttribute('aria-hidden') ?? null,
      tabindexDoGatilho: primeiro?.getAttribute('tabindex') ?? null,
      textoDoPrimeiro: texto(primeiro),
    },
    geometria: {
      gatilho: caixa(primeiro),
      chevron: chevron
        ? {
            largura: Math.round(chevron.getBoundingClientRect().width),
            transform: getComputedStyle(chevron).transform,
            transicao: getComputedStyle(chevron).transitionProperty,
          }
        : null,
      conteudo: caixa(conteudos.find((c) => c.getBoundingClientRect().height > 0) ?? null),
      bordaDoItem: itens[0] ? getComputedStyle(itens[0]).borderBottomWidth : null,
    },
    contraste: primeiro
      ? {
          gatilho: contraste(getComputedStyle(primeiro).color, background),
          chevron: chevron ? contraste(getComputedStyle(chevron).color, background) : null,
        }
      : null,
  };
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportAccordion(stack: string, cenario: string, raiz: HTMLElement) {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(measureAccordion(raiz))}`);
}
