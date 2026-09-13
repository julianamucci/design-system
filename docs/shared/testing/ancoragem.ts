/**
 * Ancoragem de painel flutuante — o instrumento compartilhado por TODA a família.
 *
 * Existe porque a ausência dele deixou o mesmo defeito atravessar três folhas.
 * `position: absolute` numa folha compartilhada tira o painel do fluxo; em toda
 * stack de lib o painel vive DENTRO de um elemento que a lib posiciona, e fora
 * do fluxo esse elemento colapsa para 0×0 — a lib passa a calcular contra uma
 * caixa sem tamanho, e a detecção de colisão fica sem o que comparar.
 *
 * O `tooltip.css` mediu e removeu a declaração em 2026-09-04 e fechou sem deixar
 * asserção. O `hover-card.css` seguiu com ela até 2026-09-13, e o
 * `dropdown-menu.css` — que serve DropdownMenu, ContextMenu e Menubar nas cinco
 * stacks — até o mesmo dia. Três folhas, o mesmo defeito, nenhum instrumento:
 * as stories afirmavam `data-side`, que a lib publica corretamente mesmo quando
 * posiciona contra uma caixa vazia.
 *
 * Este módulo é o instrumento que faltava. Ele não sabe de componente nenhum —
 * recebe gatilho, painel e o vão declarado.
 */

// @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
// que inclui este arquivo compartilhado: daqui o caminho de node_modules é o de
// docs/shared, que não tem as libs de teste. Mesmo marcador do slider-probe.
import { expect, waitFor } from 'storybook/test';

export type Lado = 'top' | 'bottom' | 'left' | 'right';

export type Ancoragem = {
  /** O lado que a stack PUBLICA — e que pode contradizer a coordenada. */
  sidePublicado: string | null;
  /** Vão medido em cada lado. Positivo = o painel está daquele lado do gatilho. */
  folga: Record<Lado, number>;
  /** Caixa do elemento que a lib posiciona — 0×0 denuncia painel fora do fluxo. */
  involucro: { width: number; height: number } | null;
};

/**
 * O painel está no LUGAR DE ESPERA da lib, antes da primeira medição?
 *
 * As libs de linhagem Radix (reka no vue, bits no svelte) estacionam o painel
 * fora da tela enquanto o floating-ui não devolveu a posição, com um
 * `transform: translate(0, -200%)` INLINE no invólucro — o comentário na fonte
 * delas diz exatamente isso: "keep off page when measuring". Nesse intervalo o
 * painel já está no DOM, já está visível e já publica `data-side`: tudo que uma
 * sonda costuma checar responde "pronto", e a posição ainda vai mudar.
 *
 * Medido em 2026-09-13, num cartão do Svelte pedindo `side="top"`, sem disparar
 * evento nenhum entre as duas leituras:
 *
 *   imediato    lado=top     folga 129,6   ← lugar de espera
 *   após 100ms  lado=bottom  folga 4       ← medido, com flip correto
 *
 * Quem afirmar posição no primeiro quadro reprova um componente correto.
 *
 * A leitura é do atributo `style` CRU e não do estilo computado, porque o
 * computado devolve a matriz já resolvida em pixels e o `-200%` some. Nas stacks
 * sem esse mecanismo a checagem não encontra nada e não custa nada.
 */
export function noLugarDeEspera(panel: HTMLElement): boolean {
  const involucro = panel.parentElement;
  return !!involucro?.getAttribute('style')?.includes('-200%');
}

/**
 * Espera a lib MEDIR, e só então devolve.
 *
 * É a espera de RELÓGIO, não de mutação: a condição só LÊ (um atributo `style`),
 * então ela não provoca a própria reagendagem — a armadilha do `waitFor` que
 * mexe no DOM, registrada no CLAUDE.md, não se aplica aqui.
 *
 * Chamar `expectOndeDiz` sem isto reprova componente correto: o painel fica
 * visível no lugar de espera por cerca de um quadro.
 */
export async function waitForAncorado(panel: HTMLElement, timeout = 3000): Promise<void> {
  await waitFor(
    () => {
      if (noLugarDeEspera(panel)) throw new Error('o painel ainda está no lugar de espera da lib');
    },
    { timeout, interval: 50 },
  );
}

/**
 * Geometria do painel EM RELAÇÃO AO GATILHO.
 *
 * `involucro` é o pai do painel: nas stacks de lib é o elemento posicionado; no
 * vanilla é o `<body>`, porque lá quem se posiciona é o próprio painel. Por isso
 * a asserção NÃO olha para ele — o que vale nas cinco é onde o painel ficou, não
 * quem o pôs lá. Ele fica no diagnóstico, que é onde ajuda: `involucro=0x0` é a
 * assinatura exata do painel fora do fluxo.
 */
export function medirAncoragem(trigger: HTMLElement, panel: HTMLElement): Ancoragem {
  const g = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const pai = panel.parentElement;
  const c = pai && pai !== panel.ownerDocument.body ? pai.getBoundingClientRect() : null;
  return {
    sidePublicado: panel.getAttribute('data-side'),
    folga: {
      top: g.top - p.bottom,
      bottom: p.top - g.bottom,
      left: g.left - p.right,
      right: p.left - g.right,
    },
    involucro: c ? { width: c.width, height: c.height } : null,
  };
}

/**
 * O elemento que POSICIONA o painel tem caixa.
 *
 * A metade de `expectOndeDiz` que vale para quem não tem gatilho: o ContextMenu
 * abre no PONTO do ponteiro, não ancorado a um elemento, então não há folga a
 * cobrar — mas o invólucro colapsado é o mesmo defeito e tem a mesma causa.
 *
 * Medido no menu do Svelte com a declaração replantada na folha: o invólucro vai
 * de 128×97 para 0×0. A posição continuava certa naquele caso, e é justamente
 * por isso que esta asserção existe separada da folga — o defeito é silencioso
 * até o tamanho do painel entrar na conta.
 */
export function expectInvolucroComCaixa(panel: HTMLElement): void {
  const pai = panel.parentElement;
  // Pai `<body>` é o caso do vanilla: quem se posiciona é o próprio painel, e
  // não há invólucro para colapsar.
  if (!pai || pai === panel.ownerDocument.body) return;
  const c = pai.getBoundingClientRect();
  const diagnostico = `invólucro=${c.width}x${c.height} — o elemento que a lib posiciona `
    + 'colapsou, e ela passa a calcular colisão contra uma caixa sem tamanho';
  expect(c.width, diagnostico).toBeGreaterThan(0);
  expect(c.height, diagnostico).toBeGreaterThan(0);
}

/**
 * O painel está ONDE ELE DIZ QUE ESTÁ.
 *
 * Esta é a forma da asserção, e ela não é detalhe. As stories de lados já liam
 * `data-side` e conferiam só o EIXO, com um comentário explicando que afirmar o
 * lado literal tornaria o tamanho da janela parte do contrato — raciocínio
 * correto, e mesmo assim a asserção media a AFIRMAÇÃO da lib em vez do resultado
 * dela. Com o painel fora do fluxo, as stacks publicavam o lado certo e pousavam
 * o painel mais de 100px do lado errado, e os testes passavam.
 *
 * Cobrar coerência entre o atributo e a coordenada resolve os dois lados: é
 * estritamente mais forte que o eixo, e continua tolerante ao flip — o painel
 * pode virar à vontade, desde que publique para onde virou.
 *
 * A tolerância é de 1px e não é conforto: o `sideOffset` é inteiro em toda a
 * família, e o meio pixel aparece só quando o gatilho cai em coordenada
 * fracionária. Afrouxar devolveria o defeito — os painéis fora do fluxo erravam
 * por mais de 100px, mas um `shift` mal limitado erra por poucos.
 *
 * Só vale depois de a lib ter medido — ver `noLugarDeEspera`.
 */
export function expectOndeDiz(
  trigger: HTMLElement,
  panel: HTMLElement,
  sideOffset: number,
): void {
  const a = medirAncoragem(trigger, panel);
  const diagnostico =
    `publicou "${a.sidePublicado}" mas as folgas medidas são ` +
    (['top', 'bottom', 'left', 'right'] as const)
      .map((k) => `${k}=${a.folga[k].toFixed(1)}`)
      .join(' ') +
    ` · involucro=${a.involucro ? `${a.involucro.width}x${a.involucro.height}` : 'body'}`;

  expect(['top', 'bottom', 'left', 'right'], diagnostico).toContain(a.sidePublicado);
  const medida = a.folga[a.sidePublicado as Lado];
  expect(medida, diagnostico).toBeGreaterThan(sideOffset - 1);
  expect(medida, diagnostico).toBeLessThan(sideOffset + 1);

  // E o elemento que POSICIONA tem caixa. Esta é a assinatura do defeito, e ela
  // precisa ser cobrada à parte porque a folga sozinha não a enxerga: medido no
  // menu do Svelte, com a declaração replantada na folha, o invólucro vai de
  // 128×97 para 0×0 e o painel continua pousando a 4,5px do gatilho. Com
  // `side="bottom"` e `align="start"` a posição estática do painel coincide com
  // a correta, então o defeito fica invisível — e volta a aparecer no primeiro
  // caso em que o TAMANHO do painel entra na conta: `side="top"`, alinhamento
  // centrado, ou qualquer colisão, porque `flip` e `shift` passam a medir
  // transbordo contra uma caixa sem tamanho.
  //
  // `involucro` é nulo quando o pai é o `<body>` — o caso do vanilla, onde quem
  // se posiciona é o próprio painel e não há invólucro para colapsar.
  if (a.involucro) {
    expect(a.involucro.width, diagnostico).toBeGreaterThan(0);
    expect(a.involucro.height, diagnostico).toBeGreaterThan(0);
  }
}
