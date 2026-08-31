/**
 * Andaime das demonstrações da faixa de cota.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * USOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto. Mesmo arranjo das três peças de medição irmãs.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O HORIZONTE, e NOMEAR O
 * CONTROLE. Os dois são de propósito, e são a demonstração do contrato — aqui o
 * andaime está no papel de quem consome, e é quem consome que conhece o idioma
 * e sabe o que o botão faz. Um formatador de duração mora nesta camada em
 * qualquer produto de verdade; o que não pode é morar dentro do componente,
 * onde decidiria idioma em cinco stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma duração sai
 * `3 h 12 min` ou `3 hr 12 min`, e a abreviatura da hora troca com quem lê.
 * Nenhuma heurística de componente acerta as três.
 *
 * Os usos são escolhidos para cair EXATAMENTE onde a conta decide algo, e não
 * em números redondos bonitos: um deles encosta no limiar de aviso em ponto,
 * outro passa do teto. Exemplo que evita a borda é exemplo que nunca mostra a
 * regra.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { getLocale, useTranslation } from '@/lib/i18n';
import quotaTranslations from '@shared/content/quota-banner/translations.json';
import { BUDGET_LEVELS, type BudgetLevel } from '@shared/primitives/token-budget';
import type { QuotaAllowance, QuotaBannerLabels } from './quota-banner';

const { t } = useTranslation(quotaTranslations as Record<string, unknown>);

/**
 * A duração escrita, no idioma da página.
 *
 * Lê `getLocale()` A CADA CHAMADA, e não uma vez no topo do módulo: a docs page
 * se redesenha quando o idioma muda, e um formatador guardado no topo
 * continuaria escrevendo no idioma em que a página abriu. Mesma mecânica da
 * quantia escrita da peça do custo.
 *
 * As duas unidades saem sempre, mesmo quando a hora é zero: um ramo a menos
 * aqui seria um caminho que nenhuma story exercita, e o que se demonstra é o
 * FORMATO — que a abreviatura da hora e a do minuto vêm de quem lê.
 */
export function renewalIn(minutes: number): string {
  const locale = getLocale();
  const unit = (value: number, name: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short' }).format(value);

  return `${unit(Math.floor(minutes / 60), 'hour')} ${unit(minutes % 60, 'minute')}`;
}

/**
 * O nome da cota, o que é contado, e as palavras que acompanham cada parte.
 *
 * O mapa de níveis sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão:
 * nível novo no primitivo compartilhado entra aqui sozinho, e a story que
 * percorre os níveis passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function quotaBannerLabels(): QuotaBannerLabels {
  const level = {} as Record<BudgetLevel, string>;
  for (const item of BUDGET_LEVELS) level[item] = t(`labels.level.${item}`);

  return {
    title: t('labels.title'),
    unit: t('labels.unit'),
    left: t('labels.left'),
    exhausted: t('labels.exhausted'),
    renews: t('labels.renews'),
    of: t('labels.of'),
    level,
  };
}

/** Os casos que a peça desenha diferente. */
export type QuotaBannerCase =
  | 'normal'
  | 'threshold'
  | 'warning'
  | 'critical'
  | 'exhausted'
  | 'noRenewal';

/** Uma cota e, quando ela renova, quanto falta para isso. */
export interface QuotaExample {
  quota: QuotaAllowance;
  /** Minutos até renovar. Ausente é a cota que não renova. */
  renewalMinutes?: number;
}

/**
 * Um uso por caso, todos contra o mesmo teto de duzentas mensagens.
 *
 * O teto é o MESMO nos seis para que a diferença entre as fotos seja o uso, e
 * não a escala. Duzentos, e não cinquenta, porque três quartos de duzentos é um
 * número inteiro de mensagens: com um teto que não divide por quatro, a borda
 * do limiar cairia numa fração de mensagem e o exemplo deixaria de ser um
 * exemplo.
 *
 * `threshold` vale cento e cinquenta de duzentas, que são três quartos EM
 * PONTO: é a borda do limiar, e é o único uso aqui cujo valor não pode mudar
 * sem mudar o que a story prova. `exhausted` passa do teto de propósito — é ele
 * que mostra o piso do resto em zero E o recorte da razão em uma volta, que são
 * duas travas diferentes na mesma foto.
 *
 * `noRenewal` repete os números de `warning` de propósito: assim a única
 * diferença entre as duas fotos é a linha do horizonte, e é isso que a story
 * existe para mostrar.
 */
export const QUOTA_BANNER_USE: Record<QuotaBannerCase, QuotaExample> = {
  normal: { quota: { used: 72, limit: 200 }, renewalMinutes: 192 },
  threshold: { quota: { used: 150, limit: 200 }, renewalMinutes: 192 },
  warning: { quota: { used: 168, limit: 200 }, renewalMinutes: 192 },
  critical: { quota: { used: 188, limit: 200 }, renewalMinutes: 192 },
  exhausted: { quota: { used: 214, limit: 200 }, renewalMinutes: 192 },
  noRenewal: { quota: { used: 168, limit: 200 } },
};

/** A cota daquele caso. */
export function quotaOf(name: QuotaBannerCase): QuotaAllowance {
  return QUOTA_BANNER_USE[name].quota;
}

/**
 * O horizonte daquele caso, já escrito — ou nada, quando a cota não renova.
 *
 * É a AUSÊNCIA que decide, e não um sinalizador à parte: a cota sem renovação
 * simplesmente não traz os minutos, e o `undefined` atravessa até a peça, onde
 * vira a linha que não é montada.
 */
export function renewalOf(name: QuotaBannerCase): string | undefined {
  const { renewalMinutes } = QUOTA_BANNER_USE[name];
  if (renewalMinutes === undefined) return undefined;
  return renewalIn(renewalMinutes);
}

/**
 * A palavra do controle da faixa, escrita por QUEM CONSOME.
 *
 * Nesta stack o controle não nasce como elemento pronto: `actions` recebe
 * `TemplateRef`, e quem declara o `<ng-template>` é a story ou a docs page. O
 * que o andaime tem a dar é o TEXTO — ele tem três idiomas e sai da
 * `translations.json`, como qualquer palavra de tela.
 *
 * O que o botão FAZ continua de fora: a §7 da guideline 17 deixa o desenho do
 * controle, a ênfase dele e o significado da escolha do lado de fora do design
 * system, e é por isso que não há manipulador nenhum aqui.
 */
export function quotaBannerActionLabel(): string {
  return t('labels.action');
}
