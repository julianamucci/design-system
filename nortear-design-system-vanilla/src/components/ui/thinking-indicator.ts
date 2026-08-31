import { cn } from '@/lib/utils';

/**
 * O lugar da resposta enquanto ela não chegou.
 *
 * Desenho em `nds/agent-run.css`, no bloco do indicador de geração, que também
 * guarda as três decisões de acessibilidade.
 *
 * NÃO É O ESTADO DA EXECUÇÃO, e a diferença é de lugar antes de ser de desenho.
 * Aquela é uma linha de informação com ação — diz em que pé está a resposta e
 * oferece o que fazer a respeito —, e mora FORA da resposta. Este é o lugar da
 * resposta enquanto ela não chegou, e mora ONDE o texto vai aparecer. Quem
 * escolhe entre os dois escolhe pelo lugar, não pela aparência.
 *
 * A EXCEÇÃO DA FAMÍLIA: aqui existe região viva. A folha inteira proíbe região
 * viva porque um número que se reanuncia torna a tela impossível de ouvir; aqui
 * vale porque o indicador anuncia UMA vez que a resposta começou a vir, e
 * depois some. É a diferença entre avisar que algo começou e narrar cada passo.
 *
 * O QUE O COMPONENTE NÃO FAZ: aparecer, sumir, contar o tempo ou oferecer o que
 * interromper. Ele não sabe quando o primeiro trecho de texto chegou — só quem
 * monta a conversa sabe —, e por isso sumir é responsabilidade de quem consome.
 * Indicador que fica é indicador que mente.
 */

/**
 * Três, e não uma opção.
 *
 * O atraso escalonado que faz três pontos parecerem uma ONDA — em vez de três
 * pontos piscando juntos — está escrito na folha para o segundo e o terceiro
 * filho. Um quarto ponto pulsaria junto com o primeiro, e a opção existiria
 * para produzir um desenho que o sistema não desenha.
 */
const DOT_COUNT = 3;

export interface ThinkingIndicatorOptions {
  /**
   * A frase que diz o que está acontecendo.
   *
   * Sem valor padrão de propósito: o padrão escondido seria uma frase numa
   * língua só, e esta é a única coisa que chega a quem ouve a tela.
   */
  label: string;
  /** Classes extras na raiz, para pôr o indicador onde a resposta vai aparecer. */
  class?: string;
}

export function createThinkingIndicator(
  options: ThinkingIndicatorOptions,
): HTMLParagraphElement {
  const root = document.createElement('p');
  root.dataset.slot = 'thinking-indicator';
  root.className = cn('nds-thinking', options.class);
  // Região de estado: anuncia uma vez, sem cortar o que estiver sendo lido.
  root.setAttribute('role', 'status');

  // Os pontos são DESENHO, e saem do que é lido em voz: animação não se lê, e
  // três pontos anunciados a cada quadro tornariam a tela impossível de ouvir.
  const dots = document.createElement('span');
  dots.className = 'nds-thinking-dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < DOT_COUNT; i += 1) dots.appendChild(document.createElement('span'));
  root.appendChild(dots);

  // A frase, escondida do olho e presente para o ouvido. Ela é o conteúdo da
  // região, e não um rótulo dela: rótulo substituiria o conteúdo no anúncio, e
  // aqui o conteúdo é a informação inteira.
  const label = document.createElement('span');
  label.className = 'nds-sr-only';
  label.textContent = options.label;
  root.appendChild(label);

  return root;
}
