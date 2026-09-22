/**
 * Quem rola a tabela do DataTable na horizontal, e se está ao alcance do
 * teclado.
 *
 * ─── O que este arquivo FOI, e por que encolheu ───────────────────────────
 *
 * Até 2026-09-22 ele tinha 423 linhas e se anunciava como "sonda de comparação
 * do DataTable entre as cinco stacks": `measureTable`, `measureDataTable`,
 * `reportProbe` e `contraste`, mais seis tipos para sustentá-los.
 *
 * **Nada disso tinha consumidor.** Medido: das cinco stacks, as cinco importam
 * `measureScroll` e só ele. E `measureDataTable` procurava os cenários por
 * `[data-sonda="…"]`, atributo que stack nenhuma emite — ou seja, mesmo se
 * alguém a chamasse, ela mediria o vazio.
 *
 * O custo não era o peso: era a §11 do PRD afirmar que a comparação cross-stack
 * existia. Ferramenta de medição que ninguém chama é pior que ferramenta
 * nenhuma, porque quem lê o PRD deixa de escrever a comparação acreditando que
 * ela já está escrita. Se a comparação voltar a ser necessária, ela nasce com
 * o call site junto — não antes dele.
 *
 * ─── O que sobrou ────────────────────────────────────────────────────────
 *
 * Mede o ESTILO COMPUTADO, não a presença de classe: classe morta não protege
 * nada, e foi exatamente uma classe (`.nds-data-table-table-wrapper`) que
 * neutralizava o contêiner alcançável e empurrava a rolagem para o que não é.
 *
 * O contrato é: exatamente uma camada rola, e ela está na ordem de tabulação.
 */

export interface ScrollCamada {
  /** Nome legível da camada, para a mensagem de falha dizer QUEM está errado. */
  name: string;
  finding: boolean;
  overflowX: string;
  /** `-1` quando o elemento não está na ordem de tabulação. */
  tabIndex: number;
  /** `true` quando o conteúdo é mais largo que a caixa — só aí a rolagem existe. */
  transborda: boolean;
}

export interface ScrollMeasurement {
  externo: ScrollCamada;
  interno: ScrollCamada;
  /** Camadas com `overflow-x: auto|scroll` — tem de ser exatamente uma. */
  camadasRolaveis: string[];
  /** Camadas roláveis que NÃO estão na ordem de tabulação (WCAG 2.1.1). */
  rolaveisForaDoTeclado: string[];
}

/**
 * Quem rola a tabela na horizontal, e se está ao alcance do teclado.
 *
 * Mede o ESTILO COMPUTADO, não a presença de classe: classe morta não protege
 * nada, e foi exatamente uma classe (`.nds-data-table-table-wrapper`) que
 * neutralizava o contêiner alcançável e empurrava a rolagem para o que não é.
 *
 * O contrato é: exatamente uma camada rola, e ela está na ordem de tabulação.
 */
export function measureScroll(root: HTMLElement): ScrollMeasurement {
  const camada = (name: string, el: Element | null): ScrollCamada => {
    if (!el) return { name, finding: false, overflowX: 'ausente', tabIndex: -1, transborda: false };
    const cs = getComputedStyle(el);
    return {
      name,
      finding: true,
      overflowX: cs.overflowX,
      tabIndex: (el as HTMLElement).tabIndex,
      transborda: el.scrollWidth > el.clientWidth,
    };
  };

  const target = root.matches('.nds-data-table') ? root : (root.querySelector<HTMLElement>('.nds-data-table') ?? root);
  const externo = camada('nds-data-table-scroll', target.querySelector('.nds-data-table-scroll'));
  const interno = camada(
    'nds-table-wrapper',
    target.querySelector('[data-slot="table-container"]') ?? target.querySelector('.nds-table-wrapper'),
  );

  const scrollable = (c: ScrollCamada) => c.finding && (c.overflowX === 'auto' || c.overflowX === 'scroll');
  const camadas = [externo, interno];
  return {
    externo,
    interno,
    camadasRolaveis: camadas.filter(scrollable).map((c) => c.name),
    rolaveisForaDoTeclado: camadas.filter((c) => scrollable(c) && c.tabIndex < 0).map((c) => c.name),
  };
}
