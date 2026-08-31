import { createBadge, type BadgeVariant } from './badge';
import {
  isStepFinished,
  type PlanStep,
  type PlanStepState,
} from '@shared/primitives/chat-protocol';

/**
 * Os passos que se pretende dar, ou que já se deu.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Plano", que também guarda as cinco
 * decisões de acessibilidade. O vocabulário — `PlanStep`, `PlanStepState`,
 * `isStepFinished` — vem de `@shared/primitives/chat-protocol`.
 *
 * A LISTA DE TAREFAS DO CATÁLOGO É ESTA PEÇA, e não outra: plano e lista de
 * tarefas têm o mesmo desenho, os mesmos estados e o mesmo vocabulário. O que
 * muda é quando a lista aparece e quem a propôs — antes de agir, ou mantida
 * durante o trabalho —, e isso é política de produto, não forma. Duas peças
 * aqui seriam duas páginas para uma coisa só.
 *
 * O QUE O COMPONENTE NÃO FAZ: executar o plano, reordenar passos, decidir o que
 * "pular" significa ou marcar um passo como feito. Ele desenha a lista que
 * recebe; quem trabalha manda a lista nova. É a mesma divisão de `approval` no
 * `chat-thread` e da linha de estado da execução.
 *
 * A LISTA NÃO É REGIÃO VIVA, apesar de mudar sozinha. O plano anda passo a
 * passo enquanto a resposta é gerada logo ao lado, e narrar cada troca é a
 * mesma armadilha do relógio: quem ouve perde a leitura do que importa. Quem
 * quiser anunciar põe a região por fora, sabendo o que está fazendo.
 */

export interface AgentPlanLabels {
  /**
   * O nome acessível da lista.
   *
   * Uma lista sem nome é anunciada como "lista, cinco itens" e nada mais — quem
   * chega nela por navegação de marcos não tem como saber que aquilo é o plano.
   */
  plan: string;
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve, e não o marcador (decisão 3 da folha): cinco estados
   * distinguidos só por forma e cor não chegam a quem não os vê (WCAG 1.4.1).
   * `Record` completo de propósito — estado novo no vocabulário compartilhado
   * reprova a compilação aqui, em vez de desenhar uma etiqueta vazia que
   * ninguém repara.
   */
  state: Record<PlanStepState, string>;
}

export interface AgentPlanOptions {
  /** Os passos, na ordem em que se pretende dá-los. */
  steps: PlanStep[];
  labels: AgentPlanLabels;
  class?: string;
}

/**
 * A cor da etiqueta de cada estado.
 *
 * A etiqueta carrega a PALAVRA, que é o que descreve; a variante é reforço, e
 * existe para que uma lista longa não obrigue a ler cinco palavras iguais em
 * cinza para achar a que falhou. Cinco entradas distintas de propósito: duas
 * que dividissem a mesma cor voltariam a se distinguir só pela palavra num
 * lugar em que o olho já procura cor.
 *
 * A VARIANTE DA ETIQUETA SÓ PINTA A BORDA — a folha do badge é explícita, e a
 * ordem que ela estabelece não é a que o nome sugere: `default` é a borda de
 * destaque e `info` é a hairline neutra, a mesma que campo e cartão desenham.
 * Por isso o passo por fazer é `info` e o passo em curso é `default`, e não o
 * contrário: quem chega ao mapa pelo nome da variante acerta ao contrário.
 *
 * O par com o marcador é o que faz o desenho fechar: neutro no que não começou,
 * destaque no que está em curso, sucesso no que fechou, erro no que quebrou.
 * `skipped` fica em aviso, e não em erro: pular não é falhar. É a mesma leitura
 * que faz o marcador do pulado ficar tracejado em vez de apagado, e é o que o
 * separa do por fazer, que também tem marcador de borda neutra.
 */
const STATE_VARIANT: Record<PlanStepState, BadgeVariant> = {
  pending: 'info',
  running: 'default',
  done: 'success',
  failed: 'destructive',
  skipped: 'warning',
};

/**
 * Monta o plano, ou nada quando não há passo nenhum.
 *
 * `null` e não uma lista vazia: uma `<ol>` sem item é anunciada como "lista com
 * zero itens", que promete algo que não há. É a mesma decisão da fila de envio
 * e da lista de contexto do campo.
 */
export function createAgentPlan(options: AgentPlanOptions): HTMLOListElement | null {
  const { steps, labels } = options;

  if (steps.length === 0) return null;

  // `<ol>` e não `<ul>`: aqui a ordem É a informação (decisão 1 da folha). Quem
  // ouve quer saber que está no terceiro de cinco, e uma lista não ordenada
  // anuncia quantos itens há sem dizer em que lugar cada um está.
  const list = document.createElement('ol');
  list.dataset.slot = 'agent-plan';
  list.className = ['nds-agent-plan', options.class].filter(Boolean).join(' ');
  list.setAttribute('aria-label', labels.plan);

  // O PASSO ATUAL É O PRIMEIRO QUE AINDA NÃO TERMINOU, e quem responde "já
  // terminou?" é `isStepFinished`, do vocabulário compartilhado — nunca um `if`
  // local sobre o estado, que renderia cinco versões da mesma regra e uma delas
  // discordaria sobre `skipped`, que é o estado em que a resposta é menos
  // óbvia: pulado não aconteceu, e ainda assim é fim.
  //
  // UM SÓ, e é por isso que a busca para no primeiro: "atual" que aponta para
  // três lugares deixa de responder onde estamos. Quando tudo terminou, o
  // índice é -1 e nenhum passo é o atual — o plano acabou, e não há onde estar.
  const currentIndex = steps.findIndex((step) => !isStepFinished(step.state));

  steps.forEach((step, index) => {
    const item = document.createElement('li');
    item.className = 'nds-agent-plan-step';
    item.dataset.slot = 'agent-plan-step';
    item.dataset.state = step.state;
    if (step.id) item.dataset.stepId = step.id;

    // `aria-current="step"` é o padrão que o leitor de tela já anuncia como
    // "atual" (decisão 1 da folha). Ele responde "onde estamos" sem depender da
    // cor do marcador, que é justamente o que não chega a quem não a vê.
    if (index === currentIndex) item.setAttribute('aria-current', 'step');

    // O MARCADOR É DECORATIVO (decisão 3). Ele é a leitura rápida para quem vê,
    // e sai inteiro do que é lido em voz: a etiqueta ao lado já diz o estado, e
    // repeti-lo em desenho não acrescenta nada a quem ouve.
    const marker = document.createElement('span');
    marker.className = 'nds-agent-plan-marker';
    marker.dataset.slot = 'agent-plan-marker';
    marker.setAttribute('aria-hidden', 'true');
    item.appendChild(marker);

    // O rótulo inteiro, sem corte. A folha resolve a quebra com `overflow-wrap`
    // (decisão 5), e cortar aqui em JavaScript seria decidir por ela: um passo
    // pela metade é uma instrução pela metade.
    const label = document.createElement('span');
    label.className = 'nds-agent-plan-label';
    label.dataset.slot = 'agent-plan-label';
    label.textContent = step.label;
    item.appendChild(label);

    // A palavra do estado, em etiqueta curta. É `nds-badge` de propósito: a
    // folha da família não declara classe própria para ela, e inventar uma aqui
    // deixaria o desenho fora do lugar onde as decisões moram.
    const state = createBadge({
      variant: STATE_VARIANT[step.state],
      children: labels.state[step.state],
    });
    state.dataset.slot = 'agent-plan-state';
    item.appendChild(state);

    // O detalhe é o que o rótulo não diz: por que pulou, o que produziu, o que
    // falhou. Ele é texto corrido em container de estado, então fica na cor
    // neutra e nunca na semântica (regra do CLAUDE.md raiz).
    if (step.detail) {
      const detail = document.createElement('p');
      detail.className = 'nds-agent-plan-detail';
      detail.dataset.slot = 'agent-plan-detail';
      detail.textContent = step.detail;
      item.appendChild(detail);
    }

    list.appendChild(item);
  });

  return list;
}
