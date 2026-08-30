import { createButton } from './button';

/**
 * A faixa que oferece de volta o que ficou escrito e não foi enviado.
 *
 * Desenho em `nds/composer.css`, no bloco do rascunho recuperado, que também
 * guarda as quatro decisões de acessibilidade.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: o design system desenha a PERGUNTA, não a
 * política (guideline 17 §7). A faixa não guarda rascunho, não decide quando um
 * expira e não diz o que descartar apaga — ela mostra o que foi encontrado e
 * avisa qual controle a pessoa apertou. Tirar a faixa da tela depois da
 * resposta também é de quem consome. Uma faixa que soubesse o que "descartar"
 * significa traria política de produto junto, e política envelhece por produto,
 * não por sistema.
 *
 * A PEÇA É AUTÔNOMA. Ela fica ACIMA do campo, e não dentro dele: o campo
 * desenha o que se escreve agora, e isto é uma pergunta sobre antes. Nenhum
 * arquivo do campo sabe que ela existe.
 *
 * O RASCUNHO VAI INTEIRO PARA O DOCUMENTO. O corte de duas linhas é da folha,
 * por `line-clamp` — nunca um corte no texto. É o que mantém o rascunho
 * achável pela busca do navegador e audível por completo; reticências feitas
 * em código viram mentira para quem ouve.
 */

/** A escolha que sai da faixa. Uma das duas, e nada mais. */
export type DraftRestoreAction = 'restore' | 'discard';

export interface DraftRestoreLabels {
  /** O que a faixa diz ter encontrado. Frase curta, no passado. */
  title: string;
  /**
   * O nome do controle que traz o rascunho de volta.
   *
   * Ele NOMEIA o rascunho, e não traz só o verbo: "Restaurar" sozinho é um
   * destino sem assunto para quem chega nele por tabulação vindo de outro lugar
   * da tela (decisão 3 da folha).
   */
  restore: string;
  /** O nome do controle que o dispensa. Também nomeia o rascunho. */
  discard: string;
}

export interface DraftRestoreOptions {
  labels: DraftRestoreLabels;
  /**
   * O rascunho encontrado, INTEIRO.
   *
   * Passe o texto completo: o corte é da folha, e cortar antes tira do texto a
   * busca do navegador e a leitura por completo.
   */
  draft: string;
  /**
   * Quando o rascunho foi escrito, JÁ ESCRITO.
   *
   * String, e não uma data: formato de data é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   * É a mesma escolha que o tempo decorrido do ditado por voz já tinha feito.
   */
  timestamp?: string;
  /** Alguém escolheu restaurar ou descartar. O que cada uma faz é de quem consome. */
  onAction?: (action: DraftRestoreAction) => void;
  class?: string;
}

export function createDraftRestore(options: DraftRestoreOptions): HTMLElement {
  const { labels, draft, timestamp, onAction } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'composer-draft';
  root.className = ['nds-composer-draft', options.class].filter(Boolean).join(' ');

  // `role="status"`, e NÃO `role="alert"` (decisão 1 da folha). A faixa nasce
  // junto com a tela e quem lê está começando a ler: `alert` interromperia a
  // leitura em curso por algo que não é urgente. `status` anuncia na primeira
  // pausa — e é por isso também que nada aqui chama `focus()`: a faixa não
  // rouba o foco (decisão 4), ela só está antes do campo na ordem de leitura.
  root.setAttribute('role', 'status');

  // ── O título ───────────────────────────────────────────────────────────────
  const title = document.createElement('p');
  title.className = 'nds-composer-draft-title';
  title.dataset.slot = 'composer-draft-title';
  title.textContent = labels.title;

  // O CARIMBO DE TEMPO É LIDO JUNTO DO TÍTULO, e de propósito.
  //
  // Ele é o oposto do cronômetro do ditado por voz: aquele se reescreve a cada
  // segundo, e por isso sai do que se anuncia (regra 9 da guideline 17); este
  // chega pronto e não muda mais. Esconder um carimbo parado não protegeria
  // ninguém — só tiraria de quem ouve a informação de quando o rascunho é.
  //
  // O `<span>` sem classe é ESTRUTURA, e não desenho: ele herda tudo do título
  // e não pede nada da folha.
  if (timestamp) {
    const stamp = document.createElement('span');
    stamp.dataset.slot = 'composer-draft-timestamp';
    stamp.textContent = ` · ${timestamp}`;
    title.appendChild(stamp);
  }
  root.appendChild(title);

  // ── A prévia ───────────────────────────────────────────────────────────────
  //
  // O texto vai inteiro (decisão 2 da folha). Quem corta é `line-clamp`, na
  // folha, e o corte é só visual: o rascunho continua no documento, achável
  // pela busca do navegador e audível do começo ao fim.
  const preview = document.createElement('p');
  preview.className = 'nds-composer-draft-preview';
  preview.dataset.slot = 'composer-draft-preview';
  preview.textContent = draft;
  root.appendChild(preview);

  // ── Os controles ───────────────────────────────────────────────────────────
  //
  // Cada um leva o NOME do rascunho, e não só o verbo (decisão 3). O rótulo é
  // visível e é também o nome acessível: não há `aria-label` separado, porque
  // o texto que se vê já diz sobre o que o controle age — e nome acessível que
  // diverge do texto visível quebra WCAG 2.5.3 pelo caminho.
  const actions = document.createElement('div');
  actions.className = 'nds-composer-draft-actions';
  actions.dataset.slot = 'composer-draft-actions';

  // Restaurar é o caminho afirmativo e vem primeiro; descartar é o silencioso.
  // A hierarquia está na variante do botão, e nunca só na ordem: quem navega
  // por audição percorre os dois em sequência e não vê peso nenhum.
  const restore = createButton({
    variant: 'default',
    size: 'sm',
    label: labels.restore,
    onClick: () => onAction?.('restore'),
  });
  restore.dataset.slot = 'composer-draft-restore';

  const discard = createButton({
    variant: 'ghost',
    size: 'sm',
    label: labels.discard,
    onClick: () => onAction?.('discard'),
  });
  discard.dataset.slot = 'composer-draft-discard';

  actions.append(restore, discard);
  root.appendChild(actions);

  return root;
}
