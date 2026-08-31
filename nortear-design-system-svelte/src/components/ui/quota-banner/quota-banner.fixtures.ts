/**
 * Andaime das demonstrações da faixa de cota.
 *
 * Existe pelo mesmo motivo do andaime das três medições irmãs: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode morar
 * lá, e a saída fácil — copiar a constante para cada arquivo — produz cópias que
 * divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * USOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O HORIZONTE. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem consome, e é quem consome que conhece o idioma. Um formatador de duração
 * mora nesta camada em qualquer produto de verdade; o que não pode é morar
 * dentro do componente, onde decidiria idioma em cinco stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma duração sai
 * `3 h 12 min` ou `3 hr 12 min`, e a abreviatura da hora troca com quem lê.
 * Nenhuma heurística de componente acerta as três.
 *
 * O CONTROLE não nasce aqui, e essa é a diferença desta stack para a
 * referência: lá o andaime devolve um nó do documento pronto; aqui o espaço dos
 * controles é um snippet, e snippet só existe dentro de um
 * componente. O que este arquivo entrega é a PALAVRA do controle — que é texto
 * de interface e sai da `translations.json` como qualquer outro rótulo.
 *
 * Os usos são escolhidos para cair EXATAMENTE onde a conta decide algo, e não
 * em números redondos bonitos: um deles encosta no limiar de aviso em ponto,
 * outro passa do teto. Exemplo que evita a borda é exemplo que nunca mostra a
 * regra.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import quotaTranslations from '@shared/content/quota-banner/translations.json';
import { spentFraction } from '@shared/primitives/token-budget';
import type { QuotaAllowance, QuotaBannerLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `QuotaBannerLabels` em CADA idioma, então rótulo que sumir do JSON — ou idioma
 * que ficar para trás — reprova no type-check, e não na tela. Um nível sem
 * palavra deixaria a faixa distinguindo a folga só pela cor da moldura, que é
 * exatamente o que a decisão 3 da folha proíbe.
 *
 * O `action` entra na anotação e não em `QuotaBannerLabels`: ele é a palavra do
 * controle, e o controle é de QUEM CONSOME — a peça não o conhece. Ele é rótulo
 * do andaime, e é aqui que o andaime declara precisar dele.
 */
const CONTENT: Record<Locale, { labels: QuotaBannerLabels & { action: string } }> =
  quotaTranslations;

/**
 * A duração escrita, num idioma — a forma para quem já tem o locale em mãos.
 *
 * As duas unidades saem sempre, mesmo quando a hora é zero: um ramo a menos aqui
 * seria um caminho que nenhuma story exercita, e o que se demonstra é o FORMATO
 * — que a abreviatura da hora e a do minuto vêm de quem lê.
 */
export function renewalInFor(target: Locale, minutes: number): string {
  const unit = (value: number, name: 'hour' | 'minute') =>
    new Intl.NumberFormat(target, { style: 'unit', unit: name, unitDisplay: 'short' }).format(value);

  return `${unit(Math.floor(minutes / 60), 'hour')} ${unit(minutes % 60, 'minute')}`;
}

/**
 * A duração escrita, no idioma da página.
 *
 * Lê a store de locale A CADA CHAMADA, e não uma vez no topo do módulo: a docs
 * page se redesenha quando o idioma muda, e um formatador guardado no topo
 * continuaria escrevendo no idioma em que a página abriu.
 */
export function renewalIn(minutes: number): string {
  return renewalInFor(get(locale), minutes);
}

/**
 * O nome da cota, o que é contado, e as palavras que acompanham cada parte —
 * num idioma.
 */
export function quotaBannerLabelsFor(target: Locale): QuotaBannerLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function quotaBannerLabels(): QuotaBannerLabels {
  return quotaBannerLabelsFor(get(locale));
}

/**
 * A palavra do controle, num idioma.
 *
 * Ela não está em `QuotaBannerLabels` de propósito: o controle é de quem
 * consome, e a peça não sabe o que ele diz nem o que ele faz (§7 da guideline
 * 17). Quem o monta é que precisa da palavra, e é quem a pede aqui.
 *
 * Só a forma COM idioma existe, ao contrário dos rótulos e do horizonte: quem
 * monta o controle é sempre marcação — o invólucro da composição e a
 * demonstração da docs page —, e marcação já tem o idioma em mãos. Uma segunda
 * forma que lesse a store seria um export que nada renderiza.
 */
export function quotaBannerActionLabelFor(target: Locale): string {
  return CONTENT[target].labels.action;
}

/** Os usos que a peça desenha diferente. */
export type QuotaBannerCase =
  | 'normal'
  | 'threshold'
  | 'warning'
  | 'critical'
  | 'exhausted'
  | 'noRenewal';

/**
 * Quantos minutos faltam para a renovação, nos exemplos que renovam.
 *
 * Um valor só, exportado, porque ele é lido em TRÊS lugares — a tabela abaixo, o
 * invólucro do Playground e a `play` que confere a linha do horizonte. Três
 * cópias do mesmo número concordariam hoje e divergiriam no dia em que alguém
 * mudasse uma delas, e a asserção passaria a comparar a story consigo mesma.
 *
 * Três horas e doze minutos, e não uma hora redonda: com uma hora cheia o
 * exemplo nunca mostraria o minuto, que é metade do que o formato demonstra.
 */
export const RENEWAL_MINUTES = 192;

/** Uma cota e, quando ela renova, quanto falta para isso. */
export interface QuotaExample {
  quota: QuotaAllowance;
  /** Minutos até renovar. Ausente é a cota que não renova. */
  renewalMinutes?: number;
}

/**
 * Um uso por exemplo, todos contra o mesmo teto de duzentas mensagens.
 *
 * O teto é o MESMO nos seis para que a diferença entre as fotos seja o uso, e
 * não a escala. Duzentos, e não cinquenta, porque três quartos de duzentos é um
 * número inteiro de mensagens: com um teto que não divide por quatro, a borda do
 * limiar cairia numa fração de mensagem e o exemplo deixaria de ser um exemplo.
 *
 * `threshold` vale cento e cinquenta de duzentas, que são três quartos EM PONTO:
 * é a borda do limiar, e é o único uso aqui cujo valor não pode mudar sem mudar
 * o que a story prova. `exhausted` passa do teto de propósito — é ele que mostra
 * o piso do resto em zero E o recorte da razão em uma volta, que são duas travas
 * diferentes na mesma foto.
 *
 * `noRenewal` repete os números de `warning` de propósito: assim a única
 * diferença entre as duas fotos é a linha do horizonte, e é isso que a story
 * existe para mostrar.
 */
export const QUOTA_BANNER_USE: Record<QuotaBannerCase, QuotaExample> = {
  normal: { quota: { used: 72, limit: 200 }, renewalMinutes: RENEWAL_MINUTES },
  threshold: { quota: { used: 150, limit: 200 }, renewalMinutes: RENEWAL_MINUTES },
  warning: { quota: { used: 168, limit: 200 }, renewalMinutes: RENEWAL_MINUTES },
  critical: { quota: { used: 188, limit: 200 }, renewalMinutes: RENEWAL_MINUTES },
  exhausted: { quota: { used: 214, limit: 200 }, renewalMinutes: RENEWAL_MINUTES },
  noRenewal: { quota: { used: 168, limit: 200 } },
};

/** A cota daquele exemplo. */
export function quotaOf(name: QuotaBannerCase): QuotaAllowance {
  return QUOTA_BANNER_USE[name].quota;
}

/**
 * O horizonte daquele exemplo, já escrito num idioma — ou nada, quando a cota
 * não renova.
 *
 * É a AUSÊNCIA que decide, e não um sinalizador à parte: a cota sem renovação
 * simplesmente não traz os minutos, e o `undefined` atravessa até a peça, onde
 * vira a linha que não é montada.
 */
export function renewalOfFor(target: Locale, name: QuotaBannerCase): string | undefined {
  const { renewalMinutes } = QUOTA_BANNER_USE[name];
  if (renewalMinutes === undefined) return undefined;
  return renewalInFor(target, renewalMinutes);
}

/** O horizonte daquele exemplo, no idioma da página. */
export function renewalOf(name: QuotaBannerCase): string | undefined {
  return renewalOfFor(get(locale), name);
}

/**
 * A fração daquele exemplo, pela MESMA conta que a peça lê.
 *
 * Existe aqui, e não copiada em cada arquivo de story, porque é ela que liga o
 * exemplo à conta compartilhada: uma divisão escrita na story provaria o que a
 * story fez, e não o que o primitivo decide.
 */
export function fractionOf(name: QuotaBannerCase): number | null {
  const { used, limit } = quotaOf(name);
  return spentFraction(used, limit);
}
