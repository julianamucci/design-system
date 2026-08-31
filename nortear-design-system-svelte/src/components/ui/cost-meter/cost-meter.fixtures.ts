/**
 * Andaime das demonstrações do custo de uma execução.
 *
 * Existe pelo mesmo motivo do andaime do uso do contexto: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * GASTOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto. Mesmo arranjo da peça da janela de contexto.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O DINHEIRO. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem consome a peça, e é quem consome que conhece a moeda e o idioma. Um
 * `Intl.NumberFormat` mora nesta camada em qualquer produto de verdade; o que
 * não pode é morar dentro do componente, onde decidiria idioma e moeda em cinco
 * stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma quantia sai
 * `US$ 0,84`, `$0.84` ou `0,84 US$`, e o símbolo TROCA DE PONTA. Nenhuma
 * heurística de componente acerta as três.
 *
 * Os gastos são escolhidos para cair EXATAMENTE onde a conta decide algo, e não
 * em números redondos bonitos: um deles encosta no limiar de aviso em ponto,
 * outro passa do teto. Exemplo que evita a borda é exemplo que nunca mostra a
 * regra.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import costTranslations from '@shared/content/cost-meter/translations.json';
import { spentFraction } from '@shared/primitives/token-budget';
import type { CostBudget, CostMeterLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `CostMeterLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela. Um nível sem palavra deixaria a
 * linha distinguindo o orçamento só pela cor do medidor, que é exatamente o que
 * a decisão 3 da folha proíbe.
 */
const CONTENT: Record<Locale, { labels: CostMeterLabels }> = costTranslations;

/**
 * A moeda dos exemplos.
 *
 * Dólar porque é a moeda em que preço de modelo é cotado, e porque ela deixa a
 * demonstração honesta: quem consome o design system em outra moeda escreve
 * outra, e a peça não muda de linha por causa disso.
 */
const EXAMPLE_CURRENCY = 'USD';

/** A quantia escrita, num idioma — a forma para quem já tem o locale em mãos. */
export function costAmountFor(target: Locale, value: number): string {
  return new Intl.NumberFormat(target, {
    style: 'currency',
    currency: EXAMPLE_CURRENCY,
  }).format(value);
}

/**
 * A quantia escrita, no idioma da página.
 *
 * Lê a store de locale A CADA CHAMADA, e não uma vez no topo do módulo: a docs
 * page se redesenha quando o idioma muda, e um formatador guardado no topo
 * continuaria escrevendo no idioma em que a página abriu.
 */
export function costAmount(value: number): string {
  return costAmountFor(get(locale), value);
}

/**
 * O nome da medida, a palavra de cada nível, a ligação e o que dizer sem teto —
 * num idioma.
 *
 * Não há unidade aqui, ao contrário dos rótulos das duas peças irmãs: a moeda já
 * vem dentro da quantia escrita.
 */
export function costMeterLabelsFor(target: Locale): CostMeterLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function costMeterLabels(): CostMeterLabels {
  return costMeterLabelsFor(get(locale));
}

/** Os casos que a peça desenha diferente. */
export type CostMeterCase =
  | 'normal'
  | 'threshold'
  | 'warning'
  | 'critical'
  | 'over'
  | 'unbounded';

/** Um gasto e o teto contra o qual ele se mede, quando há teto. */
export interface CostExample {
  spent: number;
  budget?: number;
}

/**
 * Um gasto por caso, todos contra o mesmo teto de um dólar.
 *
 * O teto é o MESMO em cinco dos seis para que a diferença entre as fotos seja o
 * gasto, e não a escala. O sexto não tem teto — é o caso de que ele não foi
 * declarado, e é justamente o que não pode parecer "não gastou nada".
 *
 * `threshold` vale setenta e cinco centavos de um dólar, que são três quartos
 * EM PONTO: é a borda do limiar, e é o único gasto aqui cujo valor não pode
 * mudar sem mudar o que a story prova. `over` passa do teto de propósito, e é
 * ele que mostra o recorte em uma volta.
 */
export const COST_METER_SPEND: Record<CostMeterCase, CostExample> = {
  normal: { spent: 0.36, budget: 1 },
  threshold: { spent: 0.75, budget: 1 },
  warning: { spent: 0.84, budget: 1 },
  critical: { spent: 0.94, budget: 1 },
  over: { spent: 1.24, budget: 1 },
  unbounded: { spent: 0.84 },
};

/** O gasto daquele caso, já escrito num idioma. */
export function amountOfFor(target: Locale, name: CostMeterCase): string {
  return costAmountFor(target, COST_METER_SPEND[name].spent);
}

/** O gasto daquele caso, já escrito no idioma da página. */
export function amountOf(name: CostMeterCase): string {
  return amountOfFor(get(locale), name);
}

/**
 * O teto daquele caso — a quantia escrita e a fração já gasta —, ou nada.
 *
 * A FRAÇÃO SAI DO PRIMITIVO, e não de uma divisão daqui: é `spentFraction` que
 * guarda o recorte em uma volta e a resposta de que teto ausente é `null`. É
 * esse `null` que vira "sem teto declarado" na tela, e é por ele que o caso sem
 * orçamento se produz sem nenhum sinalizador à parte.
 */
export function budgetOfFor(target: Locale, name: CostMeterCase): CostBudget | undefined {
  const { spent, budget } = COST_METER_SPEND[name];
  const fraction = spentFraction(spent, budget);
  // É o `null` que decide, e não um sinalizador à parte: teto ausente, zero ou
  // não-finito já saem daqui como ausência de fração. O `budget` reaparece na
  // condição só para o compilador — sem ele a fração já teria saído `null`.
  if (fraction === null || budget === undefined) return undefined;
  return { amount: costAmountFor(target, budget), fraction };
}

/** O teto daquele caso, no idioma da página. */
export function budgetOf(name: CostMeterCase): CostBudget | undefined {
  return budgetOfFor(get(locale), name);
}

/**
 * A fração daquele caso, pela MESMA conta que a peça lê.
 *
 * Existe aqui, e não copiada em cada arquivo de story, porque é ela que liga o
 * exemplo à conta compartilhada: uma divisão escrita na story provaria o que a
 * story fez, e não o que o primitivo decide.
 */
export function fractionOf(name: CostMeterCase): number | null {
  const { spent, budget } = COST_METER_SPEND[name];
  return spentFraction(spent, budget);
}
