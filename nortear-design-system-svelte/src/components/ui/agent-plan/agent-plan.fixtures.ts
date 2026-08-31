/**
 * Andaime das demonstrações do plano — um construtor por caso.
 *
 * Existe pelo mesmo motivo do andaime da linha de estado: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS DE INTERFACE saem da `translations.json`: o nome da lista e a
 * palavra de cada estado são texto de tela. O TEXTO DOS PASSOS é dado de
 * exemplo e fica igual nos três idiomas — traduzi-lo faria as stories
 * fotografarem listas de larguras diferentes conforme o idioma da foto, e o
 * assunto da peça não é a fala.
 *
 * Os passos ficam aqui, e não num módulo compartilhado de `docs/shared`, pelo
 * mesmo motivo que os da linha de estado: a folha e o vocabulário desta família
 * são UM arquivo cada, e duas peças escritas ao mesmo tempo colidem neles. O
 * andaime é por slug e por stack, que é onde ninguém se atropela.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import planTranslations from '@shared/content/agent-plan/translations.json';
import {
  PLAN_STEP_STATES,
  type PlanStep,
  type PlanStepState,
} from '@shared/primitives/chat-protocol';
import type { AgentPlanLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `AgentPlanLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela. Um estado sem palavra deixaria a
 * lista distinguindo os passos só pela forma e pela cor do marcador.
 */
const CONTENT: Record<Locale, { labels: AgentPlanLabels }> = planTranslations;

/** Os rótulos da lista num idioma — a forma para quem já tem o locale em mãos. */
export function agentPlanLabelsFor(target: Locale): AgentPlanLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da lista fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a lista desenha.
 */
export function agentPlanLabels(): AgentPlanLabels {
  return agentPlanLabelsFor(get(locale));
}

/**
 * Os cinco passos de exemplo, na ordem em que se daria.
 *
 * Cinco porque é quantos estados existem, e a grade precisa de um passo por
 * estado. São dado, e por isso ficam fora da tradução.
 */
const SAMPLE_STEPS = [
  'Ler o relatório de custos do trimestre',
  'Comparar com o trimestre anterior',
  'Buscar o histórico no arquivo antigo',
  'Montar o gráfico de variação',
  'Escrever o resumo para a diretoria',
] as const;

/** O passo que o Playground desenha. */
export const SAMPLE_STEP = SAMPLE_STEPS[1];

/** O motivo que o Playground desenha quando alguém preenche o detalhe. */
export const SAMPLE_DETAIL = 'Doze meses de dados, mês a mês.';

/** O motivo de ter pulado — é o detalhe que faz `skipped` valer a pena. */
const SKIPPED_DETAIL = 'O relatório já trazia os doze meses.';

/** O que quebrou — sem isso, "Falhou" é uma palavra sem informação nenhuma. */
const FAILED_DETAIL = 'A planilha de origem não respondeu.';

/** O detalhe que cabe àquele estado, ou nada quando não há o que explicar. */
function detailOf(state: PlanStepState): string | undefined {
  if (state === 'skipped') return SKIPPED_DETAIL;
  if (state === 'failed') return FAILED_DETAIL;
  return undefined;
}

/** Monta a lista a partir dos estados, na ordem dos passos de exemplo. */
function planOf(states: readonly PlanStepState[]): PlanStep[] {
  return states.map((state, index): PlanStep => ({
    id: `s${index + 1}`,
    label: SAMPLE_STEPS[index % SAMPLE_STEPS.length]!,
    state,
    detail: detailOf(state),
  }));
}

/**
 * O plano PROPOSTO, antes de agir: nada começou.
 *
 * O primeiro passo é o atual, porque é o primeiro que ainda não terminou — e é
 * o que responde "por onde isto começa" a quem chega pela audição.
 */
export function proposedPlan(): PlanStep[] {
  return planOf(['pending', 'pending', 'pending', 'pending', 'pending']);
}

/**
 * A lista mantida DURANTE o trabalho: dois passos fechados, um em curso.
 *
 * É o mesmo desenho do plano proposto, e é justamente esse o ponto: o que muda
 * é quando a lista aparece e quem a propôs, não a forma.
 */
export function runningPlan(): PlanStep[] {
  return planOf(['done', 'done', 'running', 'pending', 'pending']);
}

/**
 * O plano ENCERRADO: nada mais vai acontecer.
 *
 * Traz o passo pulado e o que falhou lado a lado, que é o par que a peça existe
 * para desenhar — os dois terminaram sem produzir, e ainda assim dizem coisas
 * opostas. Com tudo terminado, nenhum passo é o atual.
 */
export function finishedPlan(): PlanStep[] {
  return planOf(['done', 'done', 'skipped', 'done', 'failed']);
}

/**
 * Um passo por estado, percorrendo o vocabulário compartilhado.
 *
 * A lista sai de `PLAN_STEP_STATES`: estado novo entra nesta grade sozinho, que
 * é exatamente o que aquela constante existe para garantir.
 */
export function everyStatePlan(): PlanStep[] {
  return planOf(PLAN_STEP_STATES);
}

/**
 * Um passo de rótulo longo, do tamanho que uma instrução de verdade tem.
 *
 * Ele existe para provar que o rótulo QUEBRA em linhas em vez de receber
 * reticências: um passo pela metade é uma instrução pela metade, e o corte é
 * justamente o que ninguém percebe até ler o passo errado.
 */
export function longLabelPlan(): PlanStep[] {
  return [
    {
      id: 's1',
      label:
        'Comparar o relatório de custos do trimestre com o do trimestre anterior, mês a mês, separando o que subiu por preço do que subiu por volume',
      state: 'running',
    },
  ];
}
