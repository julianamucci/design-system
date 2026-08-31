import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import {
  isStepFinished,
  type PlanStep,
  type PlanStepState,
} from '@shared/primitives/chat-protocol';
import { NdsBadge, type BadgeVariant } from './badge';

// ─── AgentPlan ────────────────────────────────────────────────────────────────
//
// Os passos que se pretende dar, ou que já se deu.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Plano", que também
// guarda as cinco decisões de acessibilidade. O vocabulário — `PlanStep`,
// `PlanStepState`, `isStepFinished` — vem de `@shared/primitives/chat-protocol`.
//
// A LISTA DE TAREFAS DO CATÁLOGO É ESTA PEÇA, e não outra: plano e lista de
// tarefas têm o mesmo desenho, os mesmos estados e o mesmo vocabulário. O que
// muda é quando a lista aparece e quem a propôs — antes de agir, ou mantida
// durante o trabalho —, e isso é política de produto, não forma. Duas peças aqui
// seriam duas páginas para uma coisa só.
//
// O QUE O COMPONENTE NÃO FAZ: executar o plano, reordenar passos, decidir o que
// "pular" significa ou marcar um passo como feito. Ele desenha a lista que
// recebe; quem trabalha manda a lista nova. É a mesma divisão de `approval` no
// `chat-thread` e da linha de estado da execução.
//
// A LISTA NÃO É REGIÃO VIVA, apesar de mudar sozinha. O plano anda passo a passo
// enquanto a resposta é gerada logo ao lado, e narrar cada troca é a mesma
// armadilha do relógio: quem ouve perde a leitura do que importa. Quem quiser
// anunciar põe a região por fora, sabendo o que está fazendo — e é por isso que
// não há `aria-live` nem `role` nenhum aqui.
//
// A RAIZ É A PRÓPRIA LISTA, e é por isso que o seletor é de ATRIBUTO. Um seletor
// de elemento (`<nds-agent-plan>`) somaria uma caixa sem papel entre a pilha e a
// lista — as cinco stacks deixariam de renderizar a mesma árvore, e markup
// divergente não é a exceção de "API de framework". Ou se perderia a `<ol>`, que
// é a semântica escolhida de propósito: aqui a ordem É a informação, e quem ouve
// quer saber que está no terceiro de cinco. Mesma escolha do
// `ul[ndsComposerContext]`, do `p[ndsAgentStatus]` e do `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - COMO A RAIZ É O HOST, a peça NÃO SE APAGA SOZINHA quando não há passo
//     nenhum: o elemento já existe no template de quem consome antes de o
//     componente ter opinião sobre ele. Quem consome escreve
//     `@if (steps.length) { … }` em volta, e é o que o snippet de importação
//     ensina na primeira linha. Uma `<ol>` sem item seria anunciada como "lista
//     com zero itens", que promete algo que não há.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento.
//   - nenhuma saída: a peça não executa nada do que desenha, então não há o que
//     avisar.

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

/**
 * A cor da etiqueta de cada estado.
 *
 * A etiqueta carrega a PALAVRA, que é o que descreve; a variante é reforço, e
 * existe para que uma lista longa não obrigue a ler cinco palavras iguais em
 * cinza para achar a que falhou. Cinco entradas distintas de propósito: duas que
 * dividissem a mesma cor voltariam a se distinguir só pela palavra num lugar em
 * que o olho já procura cor.
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

/** Um passo já resolvido: o dado, quem é o atual, e a cor da etiqueta. */
interface PlanRow {
  step: PlanStep;
  current: boolean;
  variant: BadgeVariant;
}

@Component({
  selector: 'ol[ndsAgentPlan]',
  standalone: true,
  imports: [NdsBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-agent-plan',
    '[attr.data-slot]': '"agent-plan"',
    // O nome acessível da lista. Sem ele, quem chega por navegação de marcos
    // ouve "lista, cinco itens" e nada mais.
    '[attr.aria-label]': 'labels().plan',
    // Nenhum papel ARIA e nenhuma região viva (decisão 4 da folha), e a ausência
    // é deliberada: quem quiser anunciar põe a região por fora.
  },
  template: `
    @for (row of rows(); track $index) {
      <!-- \`aria-current="step"\` é o padrão que o leitor de tela já anuncia como
           "atual" (decisão 1 da folha). Ele responde "onde estamos" sem depender
           da cor do marcador, que é justamente o que não chega a quem não a vê. -->
      <li
        class="nds-agent-plan-step"
        data-slot="agent-plan-step"
        [attr.data-state]="row.step.state"
        [attr.data-step-id]="row.step.id ?? null"
        [attr.aria-current]="row.current ? 'step' : null"
      >
        <!-- O MARCADOR É DECORATIVO (decisão 3). Ele é a leitura rápida para
             quem vê, e sai inteiro do que é lido em voz: a etiqueta ao lado já
             diz o estado, e repeti-lo em desenho não acrescenta nada a quem
             ouve. -->
        <span
          class="nds-agent-plan-marker"
          data-slot="agent-plan-marker"
          aria-hidden="true"
        ></span>

        <!-- O rótulo inteiro, sem corte. A folha resolve a quebra com
             \`overflow-wrap\` (decisão 5), e cortar aqui seria decidir por ela:
             um passo pela metade é uma instrução pela metade. -->
        <span
          class="nds-agent-plan-label"
          data-slot="agent-plan-label"
        >{{ row.step.label }}</span>

        <!-- A palavra do estado, em etiqueta curta. É a etiqueta comum de
             propósito: a folha da família não declara classe própria para ela, e
             inventar uma aqui deixaria o desenho fora do lugar onde as decisões
             moram. -->
        <span
          ndsBadge
          [variant]="row.variant"
          data-slot="agent-plan-state"
        >{{ labels().state[row.step.state] }}</span>

        <!-- O detalhe é o que o rótulo não diz: por que pulou, o que produziu, o
             que falhou. Ele é texto corrido em container de estado, então fica
             na cor neutra e nunca na semântica. -->
        @if (row.step.detail; as detail) {
          <p
            class="nds-agent-plan-detail"
            data-slot="agent-plan-detail"
          >{{ detail }}</p>
        }
      </li>
    }
  `,
})
export class NdsAgentPlan {
  /** Os passos, na ordem em que se pretende dá-los. */
  readonly steps = input.required<PlanStep[]>();

  /** O texto da lista. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<AgentPlanLabels>();

  /**
   * Os passos com o que a tela precisa saber de cada um.
   *
   * O PASSO ATUAL É O PRIMEIRO QUE AINDA NÃO TERMINOU, e quem responde "já
   * terminou?" é `isStepFinished`, do vocabulário compartilhado — nunca um `if`
   * local sobre o estado, que renderia cinco versões da mesma regra e uma delas
   * discordaria sobre `skipped`, que é o estado em que a resposta é menos
   * óbvia: pulado não aconteceu, e ainda assim é fim.
   *
   * UM SÓ, e é por isso que a busca para no primeiro: "atual" que aponta para
   * três lugares deixa de responder onde estamos. Quando tudo terminou, o índice
   * é -1 e nenhum passo é o atual — o plano acabou, e não há onde estar.
   */
  protected readonly rows = computed<PlanRow[]>(() => {
    const list = this.steps();
    const currentIndex = list.findIndex((step) => !isStepFinished(step.state));

    return list.map((step, index) => ({
      step,
      current: index === currentIndex,
      variant: STATE_VARIANT[step.state],
    }));
  });
}
