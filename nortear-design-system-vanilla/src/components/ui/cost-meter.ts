import { createBadge, type BadgeVariant } from './badge';
import {
  fractionLevel,
  fractionPercent,
  type BudgetLevel,
} from '@shared/primitives/token-budget';

/**
 * Quanto uma execução custou, em dinheiro.
 *
 * Desenho em `nds/medicao.css`, no bloco "Custo de uma execução", que também
 * guarda as seis decisões de acessibilidade. A CONTA — o por cento que se lê, o
 * limiar e o nível — vem de `@shared/primitives/token-budget`, e é a MESMA que
 * a peça da janela de contexto lê: se as duas aparecem lado a lado usando a
 * palavra "perto do teto", ela precisa querer dizer a mesma coisa nas duas.
 *
 * A DECISÃO QUE SÓ ESTA PEÇA TEM: O DINHEIRO CHEGA ESCRITO. A quantia entra
 * como texto — "US$ 0,42" —, nunca como número com uma moeda ao lado. É o
 * precedente que o tempo decorrido do ditado, o relógio do estado da execução e
 * o carimbo da faixa de rascunho já fixaram, e aqui ele vale com mais força:
 * duração tem separador e ordem; moeda tem símbolo, POSIÇÃO do símbolo,
 * separador de milhar, separador decimal e número de casas — e os cinco variam
 * por idioma E por moeda. A mesma quantia se escreve `US$ 0,42`, `$0.42` ou
 * `0,42 US$` conforme quem lê, e o símbolo troca de ponta entre um idioma e
 * outro. Quem sabe disso é quem escolheu a moeda, e não um componente que
 * decidiria idioma em cinco stacks.
 *
 * O QUE ATRAVESSA A CONTA É A FRAÇÃO, e não a quantia: a razão entre o gasto e
 * o teto é número puro, sem moeda e sem idioma. Por isso o teto chega como um
 * par — a quantia ESCRITA e a fração JÁ CALCULADA (`spentFraction`) —, e não
 * como dois números que a peça dividiria: um par de números ao lado das duas
 * cadeias seriam dois portadores do mesmo fato, e dois portadores discordam.
 *
 * SEM TETO NÃO HÁ FRAÇÃO, SÓ A QUANTIA. Custo sem orçamento declarado é o caso
 * comum, e a peça o desenha: sem o teto não há medidor, não há nível e o
 * detalhe passa a dizer que não há teto — porque um trilho vazio lê como "não
 * gastou nada", que é o oposto do que se sabe.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
 * DECORATIVO, e o número é TEXTO. O medidor não tem papel ARIA nem valor, não
 * há `aria-live` em lugar nenhum, e nada aqui se reanuncia — um contador que se
 * reanuncia torna a tela impossível de ouvir enquanto a resposta é gerada logo
 * ao lado.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar preço, calcular tarifa, converter moeda,
 * formatar dinheiro, decidir o que fazer quando o orçamento acaba. Ele recebe o
 * que custou e desenha — §2 da guideline 17.
 */

/**
 * O teto de gasto, quando há um declarado.
 *
 * Os dois lados andam juntos de propósito, num objeto só: quem tem teto tem a
 * quantia dele E a fração já gasta, e quem não tem não tem nenhuma das duas.
 * Como duas propriedades soltas, existiria o estado meio declarado — teto
 * escrito sem fração desenha uma frase sem medidor, fração sem teto escrito
 * desenha um medidor que ninguém sabe de quê —, e nenhum dos dois é uma peça
 * que alguém queira montar.
 */
export interface CostBudget {
  /**
   * O teto, JÁ ESCRITO.
   *
   * Mesma decisão da quantia gasta, e o mesmo motivo: a moeda é de quem mediu.
   */
  amount: string;
  /**
   * Quanto do teto já foi gasto, de 0 a 1.
   *
   * Número puro: não tem moeda nem idioma, e é justamente por isso que é ele
   * que entra na conta. Sai de `spentFraction`, do primitivo compartilhado, que
   * é quem guarda o recorte em uma volta e a resposta de que sem teto não há
   * fração nenhuma.
   */
  fraction: number;
}

export interface CostMeterLabels {
  /**
   * De que número se trata.
   *
   * "US$ 0,42" sozinho não diz de quê — nem de qual execução, nem se é do turno
   * ou da conversa inteira. O título não aparece na tela, porque quem vê já
   * sabe pelo lugar em que a peça está; quem ouve não sabe.
   */
  title: string;
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor do medidor: cor sozinha não descreve estado
   * (WCAG 1.4.1). `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>;
  /** Liga a fração ao teto: oitenta e quatro por cento DE cinquenta centavos. */
  of: string;
  /**
   * Quando não há teto declarado.
   *
   * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com ela,
   * a ausência de fração vira informação: o que se sabe é quanto custou, e não
   * quanto ainda pode custar.
   */
  unbounded: string;
}

export interface CostMeterOptions {
  /**
   * O que já custou, JÁ ESCRITO.
   *
   * Não há rótulo de unidade nesta peça, ao contrário das duas irmãs: a moeda
   * já está dentro desta cadeia, e um rótulo à parte seria uma segunda chance
   * de discordar dela.
   */
  amount: string;
  /** O teto declarado. Ausente quando não há — e aí não há fração, só a quantia. */
  budget?: CostBudget;
  labels: CostMeterLabels;
  class?: string;
}

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 *
 * Os mesmos três valores da peça da janela de contexto, e isso é o eixo da
 * família: mesmo limiar, mesma palavra, mesma cor. Uma tabela diferente aqui
 * faria duas medições da mesma tela discordarem sobre o que é aviso.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
};

/**
 * O trilho e o preenchimento — o único desenho da peça.
 *
 * Só é montado quando há teto: sem teto não há fração, e um trilho vazio leria
 * como "não gastou nada" (decisão 5 da folha).
 */
function createMeter(percent: number): HTMLElement {
  // O MEDIDOR É DECORATIVO (decisão 1 da folha), e sai inteiro do que é lido em
  // voz: o por cento ao lado já diz o mesmo, e repeti-lo em desenho não
  // acrescenta nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um
  // segundo portador do mesmo número o faria ser lido duas vezes, uma delas
  // como controle.
  const track = document.createElement('span');
  track.className = 'nds-cost-meter-bar';
  track.dataset.slot = 'cost-meter-meter';
  track.setAttribute('aria-hidden', 'true');
  // Valor de RUNTIME por custom property, como o medidor das duas peças irmãs.
  // O que entra é o MESMO inteiro que o detalhe mostra, e não a fração crua:
  // uma barra cheia ao lado de "99%" seriam duas respostas para uma pergunta.
  //
  // A propriedade fica no TRILHO, e não no preenchimento — ela herda, então o
  // preenchimento a lê de graça, e o número mora sempre no mesmo elemento.
  track.style.setProperty('--nds-cost-spent', String(percent));

  const fill = document.createElement('span');
  fill.className = 'nds-cost-meter-bar-fill';
  track.appendChild(fill);

  return track;
}

export function createCostMeter(options: CostMeterOptions): HTMLElement {
  const { amount, budget, labels } = options;

  // `<p>`, e não `<div>`: é uma frase sobre uma quantia, e a etiqueta de nível
  // é conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1).
  const root = document.createElement('p');
  root.dataset.slot = 'cost-meter';
  root.className = ['nds-cost-meter', options.class].filter(Boolean).join(' ');

  // O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe do
  // que se trata pelo lugar em que a peça está, e quem ouve não sabe.
  const title = document.createElement('span');
  title.className = 'nds-sr-only';
  title.dataset.slot = 'cost-meter-title';
  title.textContent = labels.title;
  root.appendChild(title);

  // A QUANTIA É SEMPRE A QUANTIA (decisão 6). Ao contrário da peça da janela,
  // o valor não troca de significado entre os dois casos: dinheiro é dinheiro
  // com teto e sem teto, e o que aparece e some é o que o QUALIFICA.
  const amountEl = document.createElement('span');
  amountEl.className = 'nds-cost-meter-amount';
  amountEl.dataset.slot = 'cost-meter-amount';
  amountEl.textContent = amount;
  root.appendChild(amountEl);

  const detail = document.createElement('span');
  detail.className = 'nds-cost-meter-detail';
  detail.dataset.slot = 'cost-meter-detail';
  root.appendChild(detail);

  // SEM TETO NÃO HÁ FRAÇÃO (decisão 5): nem medidor, nem nível, nem por cento.
  // A ausência vira informação em vez de parecer medição pela metade.
  if (!budget) {
    detail.textContent = labels.unbounded;
    return root;
  }

  // A CONTA SAI DO PRIMITIVO, e não de um arredondamento daqui: as duas travas
  // do número que se lê em voz — um gasto de verdade não sai como 0%, e um
  // gasto que não é tudo não sai como 100% — e o limiar de cada nível são a
  // mesma resposta nas cinco stacks. Escritas aqui, uma delas arredondaria para
  // cima e diria "100%" com espaço sobrando.
  const percent = fractionPercent(budget.fraction);
  const level = fractionLevel(budget.fraction);
  root.dataset.level = level;

  // O DETALHE MANTÉM A FRAÇÃO EM TEXTO, e não é adorno: é ele que permite à
  // barra ser só desenho. Se o por cento saísse da tela, a barra viraria a
  // única portadora da fração e passaria a dever 3:1 entre a parte cheia e a
  // vazia — que é exatamente a diferença entre este medidor e uma barra de
  // progresso.
  detail.textContent = `${percent}% ${labels.of} ${budget.amount}`;

  // O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir. Ele
  // aparece SEMPRE que há teto, inclusive com folga: uma peça que só falasse
  // quando a notícia é ruim deixaria a boa notícia indistinguível de uma
  // medição que não chegou.
  const badge = createBadge({
    variant: LEVEL_VARIANT[level],
    text: labels.level[level],
    className: 'nds-cost-meter-level',
  });
  badge.dataset.slot = 'cost-meter-level';
  root.appendChild(badge);

  // O medidor vem POR ÚLTIMO no DOM, e a folha o joga para a segunda linha com
  // uma declaração só. Ele é `aria-hidden`, então a ordem de leitura não muda.
  root.appendChild(createMeter(percent));

  return root;
}
