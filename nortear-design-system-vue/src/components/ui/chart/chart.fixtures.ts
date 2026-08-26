// Utilitários de medição do Chart, compartilhados pelos arquivos de story.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: uma
// função auxiliar exportada apareceria na barra lateral do Storybook como se
// fosse um exemplo do componente.

import { tramasAplicadas } from '@shared/testing/chart-probe';

/**
 * O elemento em que a lib desenha.
 *
 * É ele — e não o bloco `.nds-chart` em volta — que leva `role="img"` e o
 * rótulo. O papel PODA a subárvore da árvore de acessibilidade: no bloco, ele
 * podaria também a tabela de dados, e a alternativa textual sumiria. Medir o
 * papel no bloco, portanto, seria medir o contrato errado.
 *
 * Serve também de recorte para qualquer sonda de TEXTO do desenho: a tabela
 * escreve os mesmos números, e uma busca no bloco inteiro passaria mesmo com o
 * desenho mudo — portão sem dentes.
 */
export function drawingOf(root: HTMLElement): HTMLElement {
  const drawing = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!drawing) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  return drawing;
}

/** O bloco da alternativa textual — `.nds-sr-only` ou `.nds-table-wrapper`. */
export function dataOf(root: HTMLElement): HTMLElement {
  const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]');
  if (!data) throw new Error('nenhum [data-slot="chart-data"] dentro do .nds-chart');
  return data;
}

/**
 * Com que COR a trama do decal foi traçada, lida de dentro do `<pattern>`.
 *
 * O decal chega à forma como um SEGUNDO caminho preenchido com `url(#…)`; o
 * `<pattern>` desse id guarda os desenhos da hachura, e é o `fill` deles que
 * diz com que cor ela foi feita. A leitura passa por um elemento de sonda para
 * normalizar o valor — o atributo pode vir como `hsl(…)` ou `rgba(…)`, e
 * comparar texto de cor com texto de cor compara formato, não cor.
 *
 * A sonda de leitura vai no `<body>`, fora do fluxo, e nunca ao lado do gráfico:
 * pendurada no irmão, ela reflui o bloco a cada leitura, o observador de tamanho
 * repinta o desenho junto e o par vira laço.
 *
 * Existe para o portão ter dentes. Com a lista PADRÃO da lib esta função
 * devolve `rgba(0, 0, 0, 0.2)` — preto a 20%, que se destaca do próprio
 * preenchimento entre 1.14 e 1.54 —, e a asserção que exige o fundo reprova.
 *
 * NÃO chame isto dentro de um `waitFor`. A sonda mexe no `<body>`, e mexer no
 * DOM acorda o observador de mutação que o `waitFor` usa para reagendar: a
 * tentativa que falha provoca a próxima, o prazo nunca chega, e o portão deixa
 * de reprovar — ele PENDURA, com o navegador a 100% e a suíte sem terminar
 * (medido: dez minutos até o corte da ferramenta). A trama já está na forma
 * quando este passo roda; não há o que esperar.
 */
export function decalColors(root: HTMLElement): string[] {
  const doc = root.ownerDocument;
  const found = new Set<string>();
  for (const id of tramasAplicadas(root)) {
    const pattern = doc.getElementById(id);
    if (!pattern) continue;
    for (const mark of pattern.querySelectorAll<SVGElement>('path, rect, circle, polygon, line')) {
      const paint = mark.getAttribute('fill') ?? getComputedStyle(mark).fill;
      if (paint && paint !== 'none') found.add(normalizeColor(paint, doc));
    }
  }
  return [...found];
}

/** Uma cor CSS qualquer no formato em que `getComputedStyle` a devolveria. */
function normalizeColor(input: string, doc: Document): string {
  const probe = doc.createElement('span');
  probe.style.color = input;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  doc.body.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}
