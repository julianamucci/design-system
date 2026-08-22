/**
 * Sonda do Carousel — as três coisas que nenhuma asserção do componente via.
 *
 * 1. A ESCALA POR ESTADO ATIVO. O slide atual em tamanho cheio e os vizinhos
 *    recuados é efeito de `transform`, e `transform` não muda nada que um
 *    `getByRole` ou um `toHaveAttribute` alcance: a caixa de LAYOUT continua
 *    idêntica. Uma stack podia deixar de marcar o estado — ou marcar o slide
 *    errado — com a suíte inteira verde.
 *
 * 2. O SALTO DO CONTROLE NO HOVER. A centralização do controle e o feedback de
 *    ponteiro do `.nds-button` disputavam a mesma propriedade `transform`, e o
 *    segundo apagava a primeira: o botão caía metade da própria altura no
 *    instante em que o ponteiro chegava. Nada verificava a POSIÇÃO de um
 *    controle sob hover, em stack nenhuma — o defeito viveu de relato.
 *
 * 3. O QUE A ESCALA PODERIA TER COMIDO. Escala é a vizinha de dois efeitos
 *    colaterais clássicos: engolir o alvo de toque de um controle por cima, e
 *    mover o ponto de parada de uma rolagem com `scroll-snap`. As duas coisas
 *    são invisíveis numa foto e mudas num teste de aparência, então viram
 *    medida aqui.
 *
 * Tudo é medido como EFEITO COMPUTADO — caixa renderizada, ponto alcançado,
 * posição de rolagem. Nenhuma função daqui casa nome de classe: o contrato do
 * design system pode trocar de vocabulário sem que a garantia caia junto.
 */

/** Tolerância de subpixel. O layout arredonda; a diferença que interessa é 10x. */
const EPSILON = 0.03;

// ─── 1. Escala por estado ativo ──────────────────────────────────────────────

export interface SlideMeasurement {
  /** Posição no trilho, para a mensagem de falha dizer QUAL slide. */
  indice: number;
  /** `null` quando a stack não declarou o estado — e isso É o achado. */
  estado: string | null;
  /** Caixa RENDERIZADA (com `transform` aplicado). */
  larguraVisivel: number;
  /** Caixa de LAYOUT (sem `transform`). É ela que o `scroll-snap` enxerga. */
  larguraDeLayout: number;
  /** larguraVisivel / larguraDeLayout. 1 = tamanho cheio. */
  escala: number;
}

export interface CarrosselFailure {
  onde: string;
  motivo: string;
}

/**
 * O estado mora no SLIDE; a escala acontece no CONTEÚDO dele.
 *
 * A separação é obrigatória e não estética: o `scroll-snap` calcula o ponto de
 * encosto sobre a caixa TRANSFORMADA, então escalar o próprio slide moveria o
 * ponto de parada da stack de rolagem nativa. Medir os dois níveis é o que
 * deixa a sonda provar as duas metades — que a pintura mudou e que a caixa do
 * slide não mudou.
 */
function measureSlide(el: HTMLElement, indice: number): SlideMeasurement {
  const conteudo = el.firstElementChild as HTMLElement | null;
  const alvo = conteudo ?? el;
  const rect = alvo.getBoundingClientRect();
  const layout = alvo.offsetWidth;
  return {
    indice,
    estado: el.getAttribute('data-active'),
    larguraVisivel: rect.width,
    larguraDeLayout: layout,
    escala: layout > 0 ? rect.width / layout : 0,
  };
}

/**
 * Mede todos os slides de um carrossel.
 *
 * A busca é pelo `data-slot` da composição, e não pela classe de estilo: é o
 * marcador que as cinco stacks já emitem para o slide, e o único que sobrevive
 * a uma troca de vocabulário `.nds-*`.
 */
export function measureSlides(raiz: HTMLElement): SlideMeasurement[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  ).map(measureSlide);
}

/**
 * Reprova o que a escala promete e a medida não confirma.
 *
 * `indiceEsperado` é o slide que a story acabou de colocar em foco. Passá-lo é
 * o que separa "algum slide está cheio" de "o slide CERTO está cheio" — sem
 * ele, um componente que marcasse sempre o primeiro passaria.
 */
export function reprovasDeEscala(
  measurements: SlideMeasurement[],
  indiceEsperado: number,
): CarrosselFailure[] {
  const failures: CarrosselFailure[] = [];

  if (measurements.length === 0) {
    return [{ onde: 'trilho', motivo: 'nenhum slide encontrado — a medição não chegou ao componente' }];
  }

  const noState = measurements.filter((m) => m.estado === null);
  if (noState.length > 0) {
    failures.push({
      onde: 'trilho',
      motivo: `${noState.length} de ${measurements.length} slides sem estado ativo declarado — a escala não tem do que depender`,
    });
    // Sem estado não há o que comparar; as reprovas abaixo seriam ruído.
    return failures;
  }

  const ativos = measurements.filter((m) => m.estado === 'true');
  if (ativos.length !== 1) {
    failures.push({
      onde: 'trilho',
      motivo: `${ativos.length} slides marcados como atual (esperado exatamente 1)`,
    });
  }
  if (ativos.length === 1 && ativos[0].indice !== indiceEsperado) {
    failures.push({
      onde: 'trilho',
      motivo: `o slide marcado como atual é o ${ativos[0].indice}, e o que está em foco é o ${indiceEsperado}`,
    });
  }

  for (const m of measurements) {
    if (m.larguraDeLayout === 0) {
      failures.push({ onde: `slide ${m.indice}`, motivo: 'caixa de layout com largura zero' });
      continue;
    }
    if (m.estado === 'true' && Math.abs(m.escala - 1) > EPSILON) {
      failures.push({
        onde: `slide ${m.indice}`,
        motivo: `é o atual e deveria estar em tamanho cheio, mas está em ${m.escala.toFixed(3)}`,
      });
    }
    if (m.estado === 'false' && m.escala >= 1 - EPSILON) {
      failures.push({
        onde: `slide ${m.indice}`,
        motivo: `é vizinho e deveria estar recuado, mas está em ${m.escala.toFixed(3)}`,
      });
    }
    if (m.estado === 'false' && m.escala > 1) {
      failures.push({
        onde: `slide ${m.indice}`,
        motivo: `vizinho AUMENTADO (${m.escala.toFixed(3)}) — escala acima de 1 transborda o recorte`,
      });
    }
  }

  return failures;
}

/**
 * A escala não pode ter mexido no ponto de parada da rolagem.
 *
 * `transform` é pintura, não layout — mas isso é promessa, e promessa se mede.
 * A prova é que a distância de LAYOUT entre slides vizinhos continua constante:
 * é dela que sai tanto o alvo de `scrollTo` da rolagem nativa quanto a posição
 * de encosto do `scroll-snap`. Se a escala tivesse encolhido a caixa de layout,
 * os passos ficariam desiguais e o carrossel pararia fora do slide.
 */
export function pontoDeParadaIntacto(raiz: HTMLElement): CarrosselFailure[] {
  const slides = Array.from(
    raiz.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  );
  if (slides.length < 3) return [];

  const vertical = slides[0].getAttribute('data-orientation') === 'vertical';
  const start = (el: HTMLElement) => (vertical ? el.offsetTop : el.offsetLeft);

  const steps: number[] = [];
  for (let i = 1; i < slides.length; i++) {
    steps.push(start(slides[i]) - start(slides[i - 1]));
  }

  const primeiro = steps[0];
  const desiguais = steps.filter((p) => Math.abs(p - primeiro) > 1);
  if (desiguais.length > 0) {
    return [{
      onde: 'trilho',
      motivo: `passos de layout desiguais (${steps.join(', ')}) — a escala saiu da pintura e alcançou o layout, e o ponto de parada da rolagem foi junto`,
    }];
  }
  return [];
}

/**
 * Mede a escala com movimento reduzido LIGADO, e desliga no fim.
 *
 * O navegador dos testes roda com animação de propósito, então não há como
 * emular a preferência do sistema aqui. O canal que existe é o mesmo que o
 * toolbar do Storybook usa — `data-reduced-motion="true"` no `<html>` — e a
 * folha compartilhada responde a ele com a mesma regra que responde à media
 * query.
 *
 * O `finally` não é zelo: deixar o atributo posto envenena a story seguinte e a
 * foto de regressão visual dela.
 *
 * `aguardar` é injetado pela story (o `waitFor` da stack): a sonda não importa
 * nada do runner, senão passaria a ter uma dependência por stack.
 */
export async function escalaSobMovimentoReduzido(
  raiz: HTMLElement,
  aguardar: (verificacao: () => void) => Promise<unknown>,
): Promise<CarrosselFailure[]> {
  const html = raiz.ownerDocument.documentElement;
  const anterior = html.getAttribute('data-reduced-motion');
  try {
    html.setAttribute('data-reduced-motion', 'true');
    await aguardar(() => {
      const neighbours = measureSlides(raiz).filter((m) => m.estado === 'false');
      if (neighbours.length === 0) throw new Error('nenhum vizinho para medir');
      for (const v of neighbours) {
        if (Math.abs(v.escala - 1) > EPSILON) {
          throw new Error(`slide ${v.indice} ainda em ${v.escala.toFixed(3)}`);
        }
      }
    });
    return [];
  } catch (erro) {
    return [{
      onde: 'movimento reduzido',
      motivo: `com a preferência ligada, a escala deveria sumir por inteiro e não sumiu: ${(erro as Error).message}`,
    }];
  } finally {
    if (anterior === null) html.removeAttribute('data-reduced-motion');
    else html.setAttribute('data-reduced-motion', anterior);
  }
}

// ─── 2. O controle sob o ponteiro ────────────────────────────────────────────

export interface ControlMeasurement {
  centroX: number;
  centroY: number;
  largura: number;
  altura: number;
}

export function measureControl(el: HTMLElement): ControlMeasurement {
  const r = el.getBoundingClientRect();
  return {
    centroX: r.left + r.width / 2,
    centroY: r.top + r.height / 2,
    largura: r.width,
    altura: r.height,
  };
}

/**
 * O controle pode CRESCER sob o ponteiro; não pode SAIR DO LUGAR.
 *
 * ── Por que a medida não usa `userEvent.hover` ──────────────────────────────
 *
 * Porque não funcionaria, e foi medido: `userEvent.hover` DESPACHA eventos de
 * ponteiro, e o `:hover` do CSS não responde a evento despachado — ele responde
 * ao cursor de verdade, que continua parado onde estava. A tentativa mediu
 * razão 1.000 nas duas orientações, ou seja, o botão nunca chegou ao estado de
 * hover. Toda asserção de hover que já existia neste repositório verifica
 * estado escrito por JS (`data-highlighted`, painel aberto); nenhuma verifica
 * efeito de CSS, e agora se sabe por quê.
 *
 * ── O que é medido no lugar ─────────────────────────────────────────────────
 *
 * O DEFEITO não era o hover: era a colisão de duas regras na propriedade
 * `transform`. Quem centraliza o controle escrevia ali, quem dá o feedback de
 * ponteiro escreve ali, e a segunda apagava a primeira. Então a sonda escreve
 * `transform: scale(fator)` no próprio elemento — a mesma declaração do
 * feedback, com especificidade ainda maior — e pergunta se o centro continua
 * onde estava. Com a centralização em `transform`, o centro despenca; com a
 * centralização em `translate`/`rotate`, ele não se move e a escala apenas
 * acontece. É exatamente o mecanismo do defeito, sem depender do cursor.
 *
 * Duas reprovas, e as duas são necessárias:
 *
 *  · o centro que se move é o defeito relatado — o botão despencava metade da
 *    própria altura e escapava de baixo do cursor;
 *  · o tamanho que NÃO cresce na proporção escrita é a prova de que a medição
 *    chegou a acontecer. Sem ela, um ambiente onde a escrita não pegasse (um
 *    `!important` em algum lugar, o elemento fora do fluxo) passaria com
 *    louvor, medindo duas vezes o mesmo botão parado. Asserção que não sabe
 *    distinguir "passou" de "não rodou" não guarda nada.
 *
 * `tolerancia` em pixel: o compositor arredonda subpixel, e um pixel inteiro
 * ainda é dezesseis vezes menor que o salto que isto reprova.
 */
export function reprovasDeSaltoNoHover(
  antes: ControlMeasurement,
  depois: ControlMeasurement,
  fator: number,
  tolerancia = 1,
): CarrosselFailure[] {
  const failures: CarrosselFailure[] = [];

  const crescimento = antes.largura > 0 ? depois.largura / antes.largura : 0;
  if (Math.abs(crescimento - fator) > 0.01) {
    failures.push({
      onde: 'controle',
      motivo: `o controle não cresceu na proporção escrita (${crescimento.toFixed(3)} contra ${fator}) — a medição não alcançou o estado de feedback, então nada foi verificado`,
    });
    return failures;
  }

  const offsetX = Math.abs(depois.centroX - antes.centroX);
  const offsetY = Math.abs(depois.centroY - antes.centroY);

  if (offsetX > tolerancia || offsetY > tolerancia) {
    failures.push({
      onde: 'controle',
      motivo: `o centro saiu do lugar quando o feedback de ponteiro entrou: ${offsetX.toFixed(2)}px em x e ${offsetY.toFixed(2)}px em y (limite ${tolerancia}px)`,
    });
  }

  return failures;
}

/**
 * Aplica o feedback de ponteiro, mede, e desfaz.
 *
 * `FATOR_DE_FEEDBACK` é a escala que o botão do design system aplica em hover.
 * O número está aqui e não na story para não haver cinco cópias dele; e o que a
 * asserção guarda não é o número, é a INVARIÂNCIA do centro sob qualquer escala.
 *
 * O `finally` não é zelo: o `transform` inline deixado no elemento entraria na
 * foto de regressão visual da story e viraria a referência de todo mundo.
 *
 * `aguardar` é injetado pela story (o `waitFor` da stack) porque o botão
 * TRANSICIONA o `transform` — ler no quadro seguinte pegaria o meio do percurso.
 */
export const FATOR_DE_FEEDBACK = 1.05;

export async function feedbackDePointerReprovas(
  el: HTMLElement,
  aguardar: (verificacao: () => void) => Promise<unknown>,
  fator = FATOR_DE_FEEDBACK,
): Promise<CarrosselFailure[]> {
  const antes = measureControl(el);
  const inlinePrevious = el.style.transform;
  try {
    el.style.transform = `scale(${fator})`;
    await aguardar(() => {
      const agora = measureControl(el);
      const crescimento = antes.largura > 0 ? agora.largura / antes.largura : 0;
      if (Math.abs(crescimento - fator) > 0.01) {
        throw new Error(`ainda em ${crescimento.toFixed(3)}`);
      }
    });
    return reprovasDeSaltoNoHover(antes, measureControl(el), fator);
  } catch {
    return reprovasDeSaltoNoHover(antes, measureControl(el), fator);
  } finally {
    el.style.transform = inlinePrevious;
  }
}

// ─── 3. O alvo de toque, depois da escala ────────────────────────────────────

/**
 * Nenhum slide encosta no controle, e o centro do controle é dele.
 *
 * Duas medidas, porque uma sozinha não serve nas cinco stacks:
 *
 *  · a GEOMÉTRICA — sobreposição entre a caixa renderizada de cada slide e a do
 *    controle — responde à pergunta em qualquer lugar, inclusive quando o
 *    controle está fora da janela visível. Ela é a que fecha o assunto: uma
 *    escala que crescesse por cima do controle apareceria aqui;
 *  · `elementFromPoint` é a prova mais forte de todas, porque pergunta ao
 *    navegador quem RECEBE o toque, mas é presa à janela por definição. Uma
 *    stack renderiza a story larga o bastante para a seta cair fora do
 *    enquadramento (medido: centro em x=1232 numa janela mais estreita), e ali
 *    a pergunta simplesmente não pode ser feita. Quando não pode, ela é pulada
 *    em silêncio — a medida geométrica já respondeu.
 */
export function controlReach(el: HTMLElement): CarrosselFailure[] {
  const failures: CarrosselFailure[] = [];
  const doc = el.ownerDocument;
  const window = doc.defaultView;
  const raiz = el.closest('.nds-carousel') ?? doc.body;
  const controle = el.getBoundingClientRect();

  // A caixa de cada slide é RECORTADA pela do viewport antes de qualquer
  // comparação. Sem isso a medida acusaria um defeito que não existe: o slide 3
  // de um trilho começa muito à direita da área visível e o retângulo dele
  // atravessa a seta de avanço no papel — mas nada daquilo é pintado, porque o
  // recorte corta. O que pode encostar no controle é só o que está à vista.
  const recorte = raiz.querySelector<HTMLElement>('[data-slot="carousel-content"]');
  const limit = (recorte ?? (raiz as HTMLElement)).getBoundingClientRect();

  const slides = Array.from(raiz.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
  for (const [i, slide] of slides.entries()) {
    const conteudo = (slide.firstElementChild as HTMLElement | null) ?? slide;
    const caixa = conteudo.getBoundingClientRect();
    const esquerda = Math.max(caixa.left, limit.left);
    const direita = Math.min(caixa.right, limit.right);
    const topo = Math.max(caixa.top, limit.top);
    const base = Math.min(caixa.bottom, limit.bottom);
    if (direita <= esquerda || base <= topo) continue; // inteiro fora do recorte

    const sobrepoeX = direita > controle.left + 0.5 && esquerda < controle.right - 0.5;
    const sobrepoeY = base > controle.top + 0.5 && topo < controle.bottom - 0.5;
    if (sobrepoeX && sobrepoeY) {
      failures.push({
        onde: 'controle',
        motivo: `o slide ${i} invade a caixa do controle — a parte VISÍVEL dele passou por cima do alvo de toque`,
      });
    }
  }

  const { centroX, centroY } = measureControl(el);
  const inWindow =
    !!window &&
    centroX >= 0 && centroY >= 0 &&
    centroX <= window.innerWidth && centroY <= window.innerHeight;

  if (inWindow) {
    const atingido = doc.elementFromPoint(centroX, centroY);
    if (!atingido || (atingido !== el && !el.contains(atingido))) {
      failures.push({
        onde: 'controle',
        motivo: `o centro do controle entrega o toque a <${atingido?.tagName.toLowerCase() ?? 'nada'}>, e não ao próprio controle`,
      });
    }
  }

  return failures;
}

// ─── Relato ──────────────────────────────────────────────────────────────────

export function describeFailures(failures: CarrosselFailure[]): string {
  return failures.map((f) => `  · ${f.onde} — ${f.motivo}`).join('\n');
}
