import type { ContextPart } from '@shared/primitives/token-budget';
import { contextSlices, contextTotal } from '@shared/primitives/token-budget';

/**
 * De onde veio o contexto já gasto.
 *
 * Desenho em `nds/medicao.css`, no bloco "Repartição do contexto por origem",
 * que também guarda as cinco decisões de acessibilidade. A CONTA — o total, o
 * peso de cada parcela e o por cento que se lê — vem de
 * `@shared/primitives/token-budget`; o dado vem de `ContextPart`, do mesmo
 * módulo.
 *
 * A PERGUNTA É OUTRA, E É O QUE SEPARA ESTA PEÇA DA IRMÃ. "Quanto ainda cabe"
 * precisa de um teto; "de onde veio" não precisa de teto nenhum, e é por isso
 * que aqui não existe `limit`, não existe nível e não existe o caso de teto
 * desconhecido. O DENOMINADOR É O TOTAL REPARTIDO: quem quer a outra pergunta
 * monta a outra peça, e as duas convivem na mesma tela sem discordar, porque
 * nenhuma responde pela outra.
 *
 * AS TRÊS DECISÕES QUE O PRIMITIVO GUARDA, e que nenhum `if` daqui refaz:
 *
 *   - A ORDEM É A DE QUEM MEDIU, nunca a do tamanho. A legenda se lê por
 *     posição, e uma parcela que sobe de lugar entre um turno e o seguinte faz
 *     comparar duas fotos diferentes achando que é a mesma.
 *   - A PARCELA ZERADA CONTINUA NA LISTA. Fatia e linha da legenda se
 *     emparelham por posição para dividirem a cor; sumir com a zerada faria a
 *     cor apontar para a fatia da vizinha — e continuaria parecendo certa.
 *   - O POR CENTO É TEXTO, com as duas travas: uma parcela de verdade não sai
 *     como 0%, e uma parcela que não é tudo não sai como 100%.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
 * DECORATIVO, e o número é TEXTO. A barra é `aria-hidden`, não tem papel nem
 * valor, e não há `aria-live` em lugar nenhum — um contador que se reanuncia
 * torna a tela impossível de ouvir enquanto a resposta é gerada logo ao lado.
 *
 * O QUE O COMPONENTE NÃO FAZ: contar token, adivinhar de onde o contexto veio,
 * agrupar origens, esconder a legenda atrás de um clique. Ele recebe a
 * repartição e desenha — §2 da guideline 17.
 */

export interface ContextBreakdownLabels {
  /**
   * O que está sendo repartido.
   *
   * Aparece na tela, ao contrário do título da peça irmã: lá o número mora numa
   * linha cujo lugar já diz do que se trata, e aqui o que se vê é uma lista de
   * nomes e números que sem título não diz o que foi dividido.
   */
  title: string;
  /** O que está sendo contado. */
  unit: string;
  /**
   * A palavra de cada origem, por endereço.
   *
   * `Record` aberto, e não um `Record` de união fechada como o dos níveis da
   * peça irmã: quantas origens existem e como se chamam é conhecimento de quem
   * mediu, e não do design system — é a razão de `ContextPart.id` ser etiqueta
   * e não membro de tipo. Origem sem palavra aqui não some da lista: ela mostra
   * o próprio endereço, porque uma linha sem nome deixaria a cor sozinha
   * identificando a parcela.
   */
  parts: Record<string, string>;
}

export interface ContextBreakdownOptions {
  /** A repartição, na ordem em que quem mediu a produziu. */
  parts: readonly ContextPart[];
  labels: ContextBreakdownLabels;
  class?: string;
}

/** `25.000 tokens` — o mesmo formato no total e em cada parcela. */
function countText(tokens: number, unit: string): string {
  return `${tokens.toLocaleString()} ${unit}`;
}

/**
 * A barra repartida, que é só desenho.
 *
 * Uma fatia por parcela, SEMPRE — inclusive a que vale zero. É o que mantém a
 * contagem desta lista igual à da legenda, e é dessa igualdade que sai o
 * pareamento de cor por `:nth-child` que a folha declara. Uma fatia a menos
 * aqui não desapareceria da tela: ela deslocaria a cor de todas as seguintes.
 */
function createBar(shares: readonly number[]): HTMLElement {
  // A BARRA É DECORATIVA (decisão 1 da folha), e sai inteira do que é lido em
  // voz: a legenda abaixo já diz nome e número de cada parcela. Nenhum papel,
  // nenhum `aria-valuenow` — um segundo portador dos mesmos números os faria
  // ser lidos duas vezes, uma delas como controle.
  const bar = document.createElement('span');
  bar.className = 'nds-context-breakdown-bar';
  bar.dataset.slot = 'context-breakdown-bar';
  bar.setAttribute('aria-hidden', 'true');

  for (const share of shares) {
    const slice = document.createElement('span');
    slice.className = 'nds-context-breakdown-slice';
    slice.dataset.slot = 'context-breakdown-slice';
    // Valor de RUNTIME por custom property, como o medidor da peça irmã já faz.
    // O que entra é o MESMO inteiro que a legenda mostra, e não a fração crua:
    // uma fatia que discordasse do número ao lado seriam duas respostas para
    // uma pergunta só.
    slice.style.setProperty('--nds-context-share', String(share));
    bar.appendChild(slice);
  }

  return bar;
}

export function createContextBreakdown(options: ContextBreakdownOptions): HTMLElement {
  const { parts, labels } = options;

  // A CONTA SAI DO PRIMITIVO, e não de um `reduce` daqui: a ordem, a parcela
  // zerada e as duas travas do por cento são a mesma resposta nas cinco stacks.
  // Escritas aqui, uma delas ordenaria por peso "para ficar melhor".
  const slices = contextSlices(parts);
  const total = contextTotal(parts);

  // `<div>`, e não `<p>`: o corpo desta peça é uma lista, e lista não cabe
  // dentro de parágrafo. Nenhum papel ARIA, nenhuma região viva (decisão 1).
  const root = document.createElement('div');
  root.dataset.slot = 'context-breakdown';
  root.className = ['nds-context-breakdown', options.class].filter(Boolean).join(' ');

  // O TÍTULO É VISÍVEL (decisão 4), e o total ao lado dele é o denominador de
  // tudo o que vem abaixo: sem ele os por cento não têm grandeza nenhuma.
  const headline = document.createElement('p');
  headline.className = 'nds-context-breakdown-headline';
  headline.dataset.slot = 'context-breakdown-headline';

  const title = document.createElement('span');
  title.className = 'nds-context-breakdown-title';
  title.dataset.slot = 'context-breakdown-title';
  title.textContent = labels.title;

  const totalEl = document.createElement('span');
  totalEl.className = 'nds-context-breakdown-total';
  totalEl.dataset.slot = 'context-breakdown-total';
  totalEl.textContent = countText(total, labels.unit);

  headline.append(title, totalEl);
  root.appendChild(headline);

  root.appendChild(createBar(slices.map((slice) => slice.percent)));

  // A LEGENDA É UMA LISTA DE VERDADE (decisão 3): a contagem e a posição chegam
  // a quem ouve, e é por posição que esta repartição pede para ser comparada de
  // um turno para o seguinte.
  const legend = document.createElement('ul');
  legend.className = 'nds-context-breakdown-legend';
  legend.dataset.slot = 'context-breakdown-legend';

  for (const slice of slices) {
    const item = document.createElement('li');
    item.className = 'nds-context-breakdown-part';
    item.dataset.slot = 'context-breakdown-part';

    // O ponto de cor é o par visual da fatia, e fica fora do que é lido pela
    // mesma razão que ela: quem ouve recebe o nome e os dois números.
    const swatch = document.createElement('span');
    swatch.className = 'nds-context-breakdown-swatch';
    swatch.dataset.slot = 'context-breakdown-swatch';
    swatch.setAttribute('aria-hidden', 'true');

    // CADA PARCELA TEM NOME E NÚMERO EM TEXTO (decisão 2, WCAG 1.4.1). Sem
    // palavra para o endereço, o endereço é o que aparece: uma linha em branco
    // deixaria a cor sozinha dizendo de qual origem se trata.
    const name = document.createElement('span');
    name.className = 'nds-context-breakdown-name';
    name.dataset.slot = 'context-breakdown-name';
    name.textContent = labels.parts[slice.id] ?? slice.id;

    const tokens = document.createElement('span');
    tokens.className = 'nds-context-breakdown-tokens';
    tokens.dataset.slot = 'context-breakdown-tokens';
    tokens.textContent = countText(slice.tokens, labels.unit);

    const percent = document.createElement('span');
    percent.className = 'nds-context-breakdown-percent';
    percent.dataset.slot = 'context-breakdown-percent';
    percent.textContent = `${slice.percent}%`;

    item.append(swatch, name, tokens, percent);
    legend.appendChild(item);
  }

  root.appendChild(legend);

  return root;
}
