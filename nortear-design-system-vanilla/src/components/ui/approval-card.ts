/**
 * A pergunta que precisa de resposta antes que algo com consequência aconteça.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Cartão de autorização", que também
 * guarda a árvore da marcação e as seis decisões de acessibilidade.
 *
 * ONDE ESTE CARTÃO MORA. Ele é o OUTRO LADO da decisão 3 do grupo de execução:
 * uma execução de ferramenta que espera por uma PESSOA não fica dentro da caixa
 * recolhida, porque pedir autorização sem mostrar é não pedir. Este é o lugar
 * para onde ela sai. Quem separa é quem consome, com `splitWaitingCalls` do
 * vocabulário compartilhado — um componente que filtrasse sozinho apagaria da
 * tela um dado que recebeu.
 *
 * O LIMITE DA PEÇA, e é a §7 da guideline 17 que o traça: o design system
 * desenha A PERGUNTA e o ESPAÇO DA RESPOSTA. Ele não decide o que a resposta
 * significa.
 *
 *   Fornece: o texto da pergunta, o alcance do que se aprova, o espaço dos
 *   controles (`actions`, o mesmo contrato da conversa) e o evento que diz
 *   qual foi a escolha.
 *
 *   NÃO fornece: o que acontece ao recusar, se há campo de motivo, se a
 *   escolha vale para as próximas, o que uma autorização permanente abrange.
 *   Nada disso está aqui, e nada disso vai estar.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: aqui EXISTE região viva, e é a terceira exceção
 * da folha — as duas primeiras são o indicador de geração e o estado da
 * ligação. A proibição padrão continua valendo e é boa: estado que se reanuncia
 * corta a leitura da resposta que está chegando. Uma PERGUNTA é de outra
 * natureza: o estado se anuncia para informar, e este cartão se anuncia porque,
 * sem ele, nada mais acontece. A máquina parou e espera por uma pessoa, e o
 * impasse é dos dois lados — quem não vê a tela fica esperando uma resposta que
 * nunca vem, porque quem a produziria está esperando por ela.
 *
 * E A REGIÃO PARA ANTES DOS CONTROLES. Ela envolve a pergunta e o alcance — o
 * que é preciso saber para decidir — e deixa de fora a caixa dos controles.
 * Botão dentro de anúncio é rótulo recitado que ninguém pode apertar dali.
 *
 * O QUE O COMPONENTE NÃO FAZ: desenhar controle, decidir qual escolha é a
 * recomendada, desabilitar-se depois de respondido, contar tempo ou impor
 * prazo. Ele desenha o que recebe e relata qual controle foi acionado.
 */

export interface ApprovalScopeItem {
  /** O rótulo daquela linha do alcance: o que o valor ao lado é. */
  term: string;
  /**
   * O valor, inteiro.
   *
   * Sem abreviar e sem reticências: alcance pela metade é autorização pela
   * metade, e a folha resolve o caminho comprido com quebra de linha.
   */
  detail: string;
}

export interface ApprovalCardOptions {
  /**
   * A pergunta. Abre o cartão e é a primeira coisa que o anúncio carrega.
   *
   * Ela diz o que vai acontecer se a resposta for sim — e não como o sistema
   * chama a si mesmo. Quem escreve é quem consome: a peça não a compõe a
   * partir do alcance, porque juntar "gravar_arquivo" com "?" produz uma
   * pergunta que ninguém faria.
   */
  question: string;
  /**
   * O alcance do que se aprova, em pares de termo e valor.
   *
   * Lista de definição, e não uma frase com dois-pontos (decisão 2 da folha):
   * o pareamento fica na estrutura, e não na pontuação, que não sobrevive à
   * navegação por lista de um leitor de tela. Ausente, a lista não é desenhada.
   */
  scope?: ApprovalScopeItem[];
  /**
   * Os controles da resposta, prontos.
   *
   * O MESMO contrato que a autorização dentro da conversa já usa. A peça dá o
   * lugar, a quebra de linha e o afastamento entre alvos vizinhos; o desenho de
   * cada controle, a ênfase de cada escolha e o que cada uma significa são de
   * quem consome (§7 da guideline 17).
   *
   * Vazio ou ausente não desenha a caixa: um vão com afastamento e sem nada
   * dentro é espaço reservado para quem nunca chegou.
   */
  actions?: HTMLElement[];
  /**
   * Alguém escolheu, e o valor daquela escolha vem junto.
   *
   * O valor sai do atributo `data-approval-choice` do controle acionado, que é
   * o único pedaço do contrato que atravessa a fronteira do que a peça desenha:
   * quem escreve o atributo é quem monta os controles. Controle sem ele não é
   * resposta — um link de "saiba mais" no meio dos controles continua sendo só
   * um link, e não dispara nada.
   */
  onChoose?: (choice: string) => void;
  class?: string;
}

/** O atributo com que um controle se declara resposta. Não é nosso: é do contrato. */
const CHOICE_ATTRIBUTE = 'data-approval-choice';

export function createApprovalCard(options: ApprovalCardOptions): HTMLElement {
  const { question, scope, actions, onChoose } = options;

  // `<div>`, e não `<section>` nem `<article>`: o cartão não é um marco de
  // navegação, e um marco a mais em cada pergunta encheria a lista de regiões
  // de quem navega por elas. Nenhum papel ARIA na raiz — a região viva é da
  // caixa da pergunta, e só dela (decisão 1).
  const root = document.createElement('div');
  root.dataset.slot = 'approval-card';
  root.className = ['nds-approval-card', options.class].filter(Boolean).join(' ');

  // A CAIXA QUE SE ANUNCIA (decisão 1), e ela existe como elemento justamente
  // para que a caixa dos controles fique de fora. Sem ela, o único lugar onde o
  // papel caberia seria a raiz — e a raiz contém os botões.
  //
  // `role="status"` é POLIDO: entra na fila e nunca corta o que estiver sendo
  // lido. Pedir autorização não é erro, e cortar a leitura é a armadilha com
  // que a regra 1 da §8 abre. A fila anda; o impasse não tem prazo.
  const ask = document.createElement('div');
  ask.className = 'nds-approval-card-ask';
  ask.dataset.slot = 'approval-card-ask';
  ask.setAttribute('role', 'status');
  root.appendChild(ask);

  const questionEl = document.createElement('p');
  questionEl.className = 'nds-approval-card-question';
  questionEl.dataset.slot = 'approval-card-question';
  questionEl.textContent = question;
  ask.appendChild(questionEl);

  // O ALCANCE É UMA LISTA DE DEFINIÇÃO (decisão 2). Com `<dl>`, o termo e o
  // valor continuam pareados quando alguém pula de item em item sem ler a linha
  // inteira — o que uma frase com dois-pontos não garante.
  if (scope?.length) {
    const list = document.createElement('dl');
    list.className = 'nds-approval-card-scope';
    list.dataset.slot = 'approval-card-scope';

    for (const item of scope) {
      const term = document.createElement('dt');
      term.className = 'nds-approval-card-scope-term';
      term.dataset.slot = 'approval-card-scope-term';
      term.textContent = item.term;

      const detail = document.createElement('dd');
      detail.className = 'nds-approval-card-scope-detail';
      detail.dataset.slot = 'approval-card-scope-detail';
      detail.textContent = item.detail;

      list.append(term, detail);
    }

    ask.appendChild(list);
  }

  // O ESPAÇO DA RESPOSTA, e ele vem POR ÚLTIMO na marcação (decisão 3): a ordem
  // de leitura é a ordem do foco, e a folha não move nada. Controle que é o
  // primeiro para o olho e o último para a tabulação faz duas perguntas
  // diferentes na mesma tela.
  if (actions?.length) {
    const actionsBox = document.createElement('div');
    actionsBox.className = 'nds-approval-card-actions';
    actionsBox.dataset.slot = 'approval-card-actions';
    actionsBox.append(...actions);

    // DELEGAÇÃO, e não um ouvinte por controle: os controles chegam prontos de
    // quem consome, e pendurar um ouvinte em cada um obrigaria a peça a
    // conhecer a forma de cada um deles. O que ela conhece é o atributo.
    //
    // `closest` porque o alvo do clique pode ser um ícone ou um `<span>` dentro
    // do botão; a guarda de contenção existe porque `closest` sobe sem limite,
    // e sem ela um atributo posto na raiz por engano viraria resposta.
    if (onChoose) {
      actionsBox.addEventListener('click', (event) => {
        const target = event.target as Element | null;
        const control = target?.closest(`[${CHOICE_ATTRIBUTE}]`);
        if (!control || !actionsBox.contains(control)) return;

        const choice = control.getAttribute(CHOICE_ATTRIBUTE);
        // Atributo vazio não é escolha: relatar `''` faria quem consome
        // procurar uma política com nome nenhum.
        if (choice) onChoose(choice);
      });
    }

    root.appendChild(actionsBox);
  }

  return root;
}
