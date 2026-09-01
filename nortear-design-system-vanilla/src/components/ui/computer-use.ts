import type { ComputerStep, RunStatus } from '@shared/primitives/chat-protocol';

/**
 * A tela que o agente está dirigindo, com a marca da ação em curso e o rastro
 * de onde ela veio.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Tela do computador", que também
 * guarda as nove decisões de acessibilidade. O vocabulário — `ComputerStep`,
 * `RunStatus` — vem de `@shared/primitives/chat-protocol`.
 *
 * POR QUE ELA É PEÇA, e não composição das irmãs. É a primeira da família cujo
 * eixo é o ESPAÇO. `tool-group` desenha uma lista, `agent-plan` desenha uma
 * lista, `terminal-block` desenha linhas: todas ordenam no tempo, e a posição
 * de cada item é consequência da ordem. Aqui a posição é DADO — o ponto que o
 * agente clicou —, e nada no design system posiciona dado em coordenada sobre
 * uma superfície que ele não conhece. O que falta para compor isto não é uma
 * classe, é um sistema de coordenadas.
 *
 * A TELA É ESPAÇO, e a peça nunca a cria. Captura de tela de sistema real traz
 * marca registrada e conteúdo de terceiro (§1 da guideline 17), que é a mesma
 * razão pela qual os logotipos de modelo não entram no repositório. Quem
 * consome passa o `HTMLElement`, como `avatar` já faz na mensagem — e o TEXTO
 * ALTERNATIVO dele é de quem consome, porque a peça não é dona daquele
 * elemento. A orientação está escrita na decisão 6 da folha: com a legenda ao
 * lado dizendo o que está acontecendo, a captura é decorativa e vai com texto
 * alternativo vazio; quando ela carrega o que a legenda não diz, o texto é
 * obrigatório.
 *
 * O ESTADO É `RunStatus`, INTEIRO, e é usado para uma pergunta só: a execução
 * ainda corre? É ela que decide se a peça se declara ocupada e se a marca ativa
 * pulsa — marca que pulsa depois do fim é o cursor que fica mentindo do bloco
 * de terminal. Receber as cinco palavras e perguntar uma coisa só NÃO é o
 * achatamento que a §5.3 da guideline condena: aquele critério é sobre o modelo
 * de DADOS, e o que ele condena é a informação se perder na entrada. Aqui ela
 * entra inteira, vinda do mesmo `RunStatus` que alimenta o estado da execução
 * logo acima na tela; um booleano na assinatura obrigaria quem consome a
 * traduzir cinco palavras em duas no ponto da chamada, que é exatamente onde a
 * perda aconteceria.
 *
 * O PASSO NÃO TEM ESTADO, e isso é do vocabulário: o que está acontecendo vale
 * para a SESSÃO, não por passo. Um passo com estado próprio faria a peça
 * desenhar cinco marcas diferentes sobre uma tela que ela não conhece — cor
 * sobre conteúdo de terceiro, que é a codificação que a legenda existe para não
 * precisar.
 *
 * O QUE O COMPONENTE NÃO FAZ: dirigir, clicar, avançar sozinho, capturar tela,
 * agendar quadro, contar tempo, rolar. Ele desenha o endereço, a tela que
 * recebe, as marcas dos passos que recebe e a legenda do passo ativo. Avançar é
 * de quem consome — a peça não agenda nada (§2 da guideline 17).
 */

/**
 * Quantas marcas o rastro mostra, contando a ativa.
 *
 * Três, e o número tem motivo: duas marcas são um segmento, e um segmento é uma
 * direção — com duas não dá para saber se o agente estava subindo ou descendo a
 * tela. Com três há duas pernas, que é o mínimo que desenha um caminho. Mais do
 * que isso e o rastro passa a cobrir a tela que ele deveria estar apontando.
 *
 * Não é opção: o número é desenho, e quem consome que quisesse outro estaria
 * pedindo outra peça. Quem tiver menos de três passos vê menos marcas, que é o
 * começo de toda sessão.
 */
const TRAIL_LENGTH = 3;

export interface ComputerUseLabels {
  /**
   * A palavra que apresenta o endereço, e que só quem ouve recebe.
   *
   * Sem os pontos de janela — que a folha recusou, e diz por quê —, o que diz
   * "isto é um endereço" é a posição e o tratamento, e nada disso chega a quem
   * não vê a barra. Uma cadeia solta no começo da figura seria texto sem
   * assunto (decisão 8 da folha).
   */
  address: string;
  /**
   * O molde da contagem. `{index}` vira a posição do passo e `{total}` vira
   * quantos são.
   *
   * Molde, e não texto pronto, pela mesma divisão do código de saída do bloco
   * de terminal: a palavra que liga os dois números é do idioma, e os números
   * são dado. O `{index}` já chega contado a partir de um — quem lê conta a
   * partir de um, e deixar a conversão para o molde a espalharia por três
   * idiomas.
   */
  position: string;
}

export interface ComputerUseOptions {
  /** O endereço da tela que está sendo dirigida. */
  url: string;
  /**
   * A tela, que é ESPAÇO de quem consome.
   *
   * Obrigatória, e é o que a fonte também decide: a moldura não tem nada para
   * mostrar por baixo do rastro até que alguém a passe. A peça não cria imagem
   * nenhuma (§1 da guideline 17), e não escreve nem apaga o texto alternativo
   * do que recebe.
   */
  screen: HTMLElement;
  /**
   * Os passos da sessão, na ordem em que aconteceram.
   *
   * Sem passo nenhum não há rastro nem legenda: sobra a moldura com o endereço
   * e a tela, que é o que existe antes de o agente tocar em qualquer coisa.
   */
  steps?: readonly ComputerStep[];
  /**
   * Qual passo está acontecendo agora.
   *
   * Índice, e não fatia — e a diferença importa. A revelação aos poucos é
   * recorte de quem consome, como em toda esta família; mas a legenda diz
   * "3 de 6", e o total não sobrevive a uma fatia. Fora de alcance é preso ao
   * alcance, para que incrementar além do último passo continue apontando para
   * um passo de verdade.
   */
  activeIndex?: number;
  /**
   * Em que pé está a sessão. Quem dirige é quem sabe, e é quem passa.
   *
   * Decide se a peça se declara ocupada e se a marca ativa pulsa. Não decide
   * cor de marca: estado por cor sobre uma tela de terceiro é a codificação que
   * a legenda substitui.
   */
  status?: RunStatus;
  labels: ComputerUseLabels;
  class?: string;
}

export function createComputerUse(options: ComputerUseOptions): HTMLElement {
  const { url, screen, steps = [], status = 'idle', labels } = options;

  const root = document.createElement('figure');
  root.dataset.slot = 'computer-use';
  root.className = ['nds-computer-use', options.class].filter(Boolean).join(' ');
  root.dataset.status = status;

  // OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
  // Nada aqui é `aria-live`: a legenda troca a cada passo, e uma tela dirigida
  // por agente troca de passo mais depressa do que se lê — anunciar cada uma
  // seria a rajada da saída de terminal com outro nome.
  if (status === 'running') root.setAttribute('aria-busy', 'true');

  // ── O endereço ──────────────────────────────────────────────────────────────
  const address = document.createElement('p');
  address.className = 'nds-computer-use-address nds-font-mono';
  address.dataset.slot = 'computer-use-address';

  // A PALAVRA QUE SÓ QUEM OUVE RECEBE (decisão 8). Ela não é enfeite de leitor
  // de tela: é o que a barra diz pelo desenho e não conseguiria dizer em voz.
  const addressName = document.createElement('span');
  addressName.className = 'nds-sr-only';
  addressName.textContent = labels.address;
  address.appendChild(addressName);

  const urlText = document.createElement('span');
  urlText.className = 'nds-computer-use-url nds-truncate';
  urlText.dataset.slot = 'computer-use-url';
  // `lang="en"`: um endereço é máquina — servidor, caminho, parâmetro. Sem
  // isto, a voz do leitor em pt-BR tenta pronunciá-lo como português (WCAG
  // 3.1.2). Mesma decisão do comando no bloco de terminal.
  urlText.lang = 'en';
  urlText.textContent = url;
  address.appendChild(urlText);
  root.appendChild(address);

  // ── O quadro ────────────────────────────────────────────────────────────────
  const frame = document.createElement('div');
  frame.className = 'nds-computer-use-screen';
  frame.dataset.slot = 'computer-use-screen';

  const surface = document.createElement('div');
  surface.className = 'nds-computer-use-surface';
  surface.dataset.slot = 'computer-use-surface';
  // `appendChild`, e nunca `innerHTML`: a tela chega como elemento já montado
  // por quem consome. Sem marcação em cadeia não há o que sanitizar.
  surface.appendChild(screen);
  frame.appendChild(surface);

  // O ÍNDICE É PRESO AO ALCANCE, e não recusado: quem avança uma sessão
  // incrementa um número, e o passo seguinte ao último é o último. Recusar
  // deixaria a tela sem marca justamente quando a sessão acabou de terminar.
  const activeIndex = Math.min(Math.max(options.activeIndex ?? 0, 0), Math.max(steps.length - 1, 0));

  if (steps.length > 0) {
    // O RASTRO É UMA CAMADA SÓ, e é ela que sai inteira do que é lido em voz
    // (decisão 2). Posição numa imagem não chega a quem não a vê; o que chega é
    // a legenda, logo abaixo.
    const trail = document.createElement('span');
    trail.className = 'nds-computer-use-trail';
    trail.dataset.slot = 'computer-use-trail';
    trail.setAttribute('aria-hidden', 'true');

    const from = Math.max(activeIndex - (TRAIL_LENGTH - 1), 0);
    for (let i = from; i <= activeIndex; i++) {
      const step = steps[i];
      const mark = document.createElement('span');
      mark.className = 'nds-computer-use-mark';
      mark.dataset.slot = 'computer-use-mark';
      // O PONTO É DADO, e entra em propriedade personalizada: não existe token
      // de "62%", e a regra do repositório reserva `style` inline para
      // mecânica e para propriedade personalizada. A conta de porcentagem fica
      // na folha, que é onde ela pode mudar sem tocar nas cinco stacks.
      mark.style.setProperty('--computer-use-mark-x', String(step.x));
      mark.style.setProperty('--computer-use-mark-y', String(step.y));
      if (i === activeIndex) mark.dataset.active = 'true';
      trail.appendChild(mark);
    }
    frame.appendChild(trail);
  }

  root.appendChild(frame);

  // ── A legenda ───────────────────────────────────────────────────────────────
  //
  // Ela é a peça para quem ouve (decisão 2), e é `<figcaption>` porque a legenda
  // de uma figura É o nome dela: sem isso a tela seria uma imagem anônima no
  // meio da conversa. Sem passo nenhum não há legenda — não há o que dizer, e
  // uma legenda vazia daria à figura um nome em branco.
  if (steps.length > 0) {
    const step = steps[activeIndex];

    const caption = document.createElement('figcaption');
    caption.className = 'nds-computer-use-caption';
    caption.dataset.slot = 'computer-use-caption';

    // O VERBO É O QUE DESCREVE, e por isso carrega o peso e a cor de texto —
    // mesma divisão do nome e do detalhe da chamada de ferramenta.
    const action = document.createElement('span');
    action.className = 'nds-computer-use-action';
    action.dataset.slot = 'computer-use-action';
    action.textContent = step.action;
    caption.appendChild(action);

    const target = document.createElement('span');
    target.className = 'nds-computer-use-target nds-truncate';
    target.dataset.slot = 'computer-use-target';
    target.textContent = step.target;
    caption.appendChild(target);

    // A CONTAGEM É NÚMERO, e chega a quem ouve: ela não se reescreve sozinha —
    // quem a muda é um passo novo —, então não é o relógio de que esta folha se
    // defende. É também a única parte da peça que diz que existe uma SEQUÊNCIA:
    // o rastro diz isso pelo desenho, e o desenho não é lido.
    const position = document.createElement('span');
    position.className = 'nds-computer-use-position';
    position.dataset.slot = 'computer-use-position';
    position.textContent = labels.position
      .replace('{index}', String(activeIndex + 1))
      .replace('{total}', String(steps.length));
    caption.appendChild(position);

    root.appendChild(caption);
  }

  return root;
}
