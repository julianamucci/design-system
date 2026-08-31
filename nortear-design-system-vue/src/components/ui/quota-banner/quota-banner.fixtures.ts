/**
 * Andaime das demonstrações da faixa de cota.
 *
 * Existe pelo mesmo motivo do andaime das medições irmãs: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * USOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O HORIZONTE, e MONTAR O
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
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, h, type ComputedRef, type VNode } from 'vue';
import { Button } from '@/components/ui/button';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import quotaTranslations from '@shared/content/quota-banner/translations.json';
import type { QuotaAllowance, QuotaBannerLabels } from './QuotaBanner.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `QuotaBannerLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela.
 *
 * É também o que faz o mapa de níveis acompanhar o primitivo compartilhado sem
 * que ninguém precise lembrar: `level` é `Record<BudgetLevel, string>`, e um
 * nível novo em `BUDGET_LEVELS` reprova a compilação aqui em vez de desenhar
 * uma etiqueta em branco que ninguém repara.
 *
 * O `action` entra na mesma anotação, e não numa leitura solta: ele é o rótulo
 * do CONTROLE, que nasce neste arquivo e não na peça — mas continua sendo texto
 * de interface, com as mesmas três traduções.
 */
const CONTENT: Record<Locale, { labels: QuotaBannerLabels & { action: string } }> =
  quotaTranslations;

/**
 * A duração escrita, num idioma — a forma para quem já tem o locale em mãos.
 *
 * As duas unidades saem sempre, mesmo quando a hora é zero: um ramo a menos
 * aqui seria um caminho que nenhuma story exercita, e o que se demonstra é o
 * FORMATO — que a abreviatura da hora e a do minuto vêm de quem lê.
 */
export function renewalInFor(target: Locale, minutes: number): string {
  const unit = (value: number, name: 'hour' | 'minute') =>
    new Intl.NumberFormat(target, { style: 'unit', unit: name, unitDisplay: 'short' }).format(
      value,
    );

  return `${unit(Math.floor(minutes / 60), 'hour')} ${unit(minutes % 60, 'minute')}`;
}

/**
 * A duração escrita fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que os composables abaixo, e monta o formatador A
 * CADA CHAMADA: a docs page se redesenha quando o idioma muda, e um formatador
 * guardado no topo do módulo continuaria escrevendo no idioma em que a página
 * abriu.
 */
export function renewalIn(minutes: number): string {
  return renewalInFor(useI18nStore().locale, minutes);
}

/** Os rótulos da faixa num idioma. */
export function quotaBannerLabelsFor(target: Locale): QuotaBannerLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da faixa fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function quotaBannerLabels(): QuotaBannerLabels {
  return quotaBannerLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da faixa no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useQuotaBannerLabels(): ComputedRef<QuotaBannerLabels> {
  const { locale } = useTranslation(quotaTranslations);
  return computed(() => quotaBannerLabelsFor(locale.value as Locale));
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
export function renewalOfFor(target: Locale, name: QuotaBannerCase): string | undefined {
  const { renewalMinutes } = QUOTA_BANNER_USE[name];
  if (renewalMinutes === undefined) return undefined;
  return renewalInFor(target, renewalMinutes);
}

/** O mesmo, fora de um componente — `play` não é render. */
export function renewalOf(name: QuotaBannerCase): string | undefined {
  return renewalOfFor(useI18nStore().locale, name);
}

/**
 * Um horizonte qualquer no idioma corrente — a forma dos controls.
 *
 * Recebe um GETTER, e não um número: os args do Playground trocam com o painel
 * aberto, e um valor lido uma vez congelaria a foto no horizonte com que a
 * story abriu. Ausência entra e ausência sai — é assim que o interruptor da
 * renovação chega até a linha que não é montada.
 */
export function useQuotaRenewal(
  minutes: () => number | undefined,
): ComputedRef<string | undefined> {
  const { locale } = useTranslation(quotaTranslations);
  return computed(() => {
    const value = minutes();
    return value === undefined ? undefined : renewalInFor(locale.value as Locale, value);
  });
}

/** Os seis horizontes no idioma corrente, prontos para a peça. */
export function useQuotaRenewals(): ComputedRef<Record<QuotaBannerCase, string | undefined>> {
  const { locale } = useTranslation(quotaTranslations);
  return computed(() => {
    const target = locale.value as Locale;
    const renewals = {} as Record<QuotaBannerCase, string | undefined>;
    for (const name of Object.keys(QUOTA_BANNER_USE) as QuotaBannerCase[]) {
      renewals[name] = renewalOfFor(target, name);
    }
    return renewals;
  });
}

/**
 * O controle da faixa, montado por QUEM CONSOME.
 *
 * Ele nasce aqui e não dentro da peça porque a §7 da guideline 17 deixa o
 * desenho do controle, a ênfase dele e o significado da escolha do lado de fora
 * do design system. A faixa desenha o LUGAR de quem responde; o que o botão faz
 * é de quem o passou — e é por isso que ele não tem manipulador nenhum aqui:
 * demonstrar a política seria demonstrar o que a peça não tem.
 */
function quotaBannerActionFor(target: Locale): VNode {
  return h(
    Button,
    { variant: 'outline', size: 'sm' },
    () => CONTENT[target].labels.action,
  );
}

/**
 * O controle no idioma corrente, numa lista pronta para a propriedade.
 *
 * Um `computed`, e não um nó guardado: o rótulo é texto de interface, e a barra
 * de idioma do Storybook troca o idioma com a story montada.
 */
export function useQuotaBannerActions(): ComputedRef<VNode[]> {
  const { locale } = useTranslation(quotaTranslations);
  return computed(() => [quotaBannerActionFor(locale.value as Locale)]);
}
