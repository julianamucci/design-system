<script lang="ts" module>
  // ─── JobProgress ───────────────────────────────────────────────────────────
  //
  // O andamento de um trabalho longo que o agente disparou.
  //
  // Desenho em `nds/agent-run.css`, no bloco "Andamento de trabalho longo", que
  // também guarda as sete decisões de acessibilidade. O vocabulário —
  // `RunStatus`, `JobCount`, `hasKnownTotal`, `jobProgressValue`,
  // `isRunFinished` — vem de `@shared/primitives/chat-protocol`.
  //
  // NÃO É O ESTADO DA EXECUÇÃO, e a diferença é de escopo, não de aparência.
  // Aquela linha descreve a RESPOSTA que está sendo escrita agora; esta descreve
  // uma tarefa que o agente mandou fazer e que continua correndo depois de a
  // resposta terminar — indexar um repositório, processar um lote. É por isso
  // que ela tem conta e barra, e a outra tem só relógio: um trabalho longo se
  // mede em unidades feitas, e uma resposta, não.
  //
  // O ESTADO É O MESMO VOCABULÁRIO, de propósito. `RunStatus` já separa os cinco
  // momentos que este trabalho tem — em espera, correndo, interrompido por quem
  // lê, concluído, quebrado — e os separa pelos mesmos motivos: `stopped` oferece
  // retomar e `failed` oferece tentar de novo. Um tipo próprio aqui seria a mesma
  // lista com outro nome, e a divergência apareceria no dia em que um dos dois
  // ganhasse um estado.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: o que muda a cada quadro é DECORATIVO, e o
  // estado é TEXTO. A conta se reescreve a cada unidade processada e sai do que
  // é lido em voz; a palavra do estado fica, porque é ela que decide o que
  // fazer. Mesma escolha do relógio do estado da execução e da barra do anexo.
  //
  // E AQUI NÃO HÁ REGIÃO VIVA (decisão 1). A folha proíbe por padrão e as três
  // exceções dela não alcançam este caso: nada aqui está esperando por uma
  // pessoa, e nada aqui é o chão saindo. Um trabalho longo é justamente o que
  // anda sozinho enquanto quem pediu faz outra coisa.
  //
  // O QUE O COMPONENTE NÃO FAZ: executar, contar, formatar duração, parar,
  // retomar ou repetir. Ele desenha o andamento que recebe e avisa que alguém
  // pediu a ação — mesma divisão de `approval` no `chat-thread` e do estado da
  // execução.
  //
  // DIVERGÊNCIA DE API, em relação à referência: lá a peça é uma fábrica que
  // recebe um objeto de opções e devolve o elemento. Aqui ela é um componente,
  // as opções são props e o retorno chega por prop de callback — que mantém o
  // nome `onAction`. Markup, classes `.nds-*`, `data-slot`, ARIA e comportamento
  // são os mesmos.
  import type { RunStatus } from '@shared/primitives/chat-protocol';

  /**
   * O que a ação pede.
   *
   * É INTENÇÃO, e não o estado seguinte: entre pedir para parar e o trabalho
   * parar de fato há unidades ainda em curso, e um componente que anunciasse
   * `stopped` estaria adivinhando o que ainda não aconteceu.
   *
   * Tipo próprio, e não o do estado da execução, ainda que as duas palavras
   * sejam as mesmas: são duas peças que não se importam, e juntá-las faria uma
   * delas importar o módulo da outra para nomear duas cadeias de texto.
   * Divergência de API entre peças é registrada, não corrigida à força (§4.1 da
   * guideline 17).
   */
  export type JobProgressIntent = 'stop' | 'start';

  export interface JobProgressLabels {
    /**
     * A palavra de cada estado.
     *
     * É ela que descreve (decisão 2 da folha): a barra e a conta saem do que é
     * lido em voz, e sem a palavra o estado existiria só em cor e movimento —
     * que é o que WCAG 1.4.1 proíbe. `Record` completo de propósito: estado novo
     * no vocabulário compartilhado reprova a compilação aqui, em vez de desenhar
     * uma linha em branco que ninguém repara.
     */
    status: Record<RunStatus, string>;
    /**
     * A conta quando se sabe de quantas. `{done}` e `{total}` viram os números.
     *
     * Molde, e não texto pronto: os números são formatados no idioma de quem lê
     * e a palavra que os liga ("de", "of") é do idioma também. É a mesma divisão
     * do tamanho do anexo, onde o número sai de `toLocaleString` e a unidade sai
     * dos rótulos.
     */
    count: string;
    /**
     * A conta quando NÃO se sabe de quantas. Só `{done}`.
     *
     * Obrigatório junto com o de cima, e é decisão: quem escreve os rótulos é
     * obrigado a dizer como a peça fala do trabalho sem total. Um molde só, com
     * `{total}` vazio, produziria "1 240 de " — e ficar sem total é coisa que
     * acontece de verdade, não borda.
     */
    countWithoutTotal: string;
    /**
     * O rótulo da ação em cada estado. Estado sem entrada não oferece ação.
     *
     * Cada um diz O QUE FAZ naquele estado (decisão 6 da folha) — "Parar"
     * enquanto corre, "Retomar" depois de interrompido, "Tentar de novo" depois
     * de falhar. Botão que troca de função sem trocar de nome é o mesmo botão
     * fazendo coisas diferentes, e quem chega nele por tabulação não tem como
     * saber qual das duas.
     *
     * Em espera e concluído ficam de fora nas cinco stacks, e é decisão:
     * disparar o trabalho é de quem o enfileirou, e sobre um trabalho pronto não
     * há o que fazer aqui.
     */
    action?: Partial<Record<RunStatus, string>>;
  }
</script>

<script lang="ts">
  import {
    hasKnownTotal,
    isRunFinished,
    jobProgressValue,
    type JobCount,
  } from '@shared/primitives/chat-protocol';
  import { Progress } from '@/components/ui/progress';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';

  const {
    label,
    status = 'idle',
    count,
    labels,
    onAction,
    class: className,
  }: {
    /** O que está sendo feito. É também o nome acessível da barra. */
    label: string;
    /** Em que pé está o trabalho. Quem executa é quem sabe, e é quem passa. */
    status?: RunStatus;
    /**
     * Quanto já andou, e de quanto.
     *
     * Ausente é "não há conta nenhuma", e `total` ausente dentro dele é "não se
     * sabe de quantas" — dois graus de desconhecimento que desenham diferente.
     * Quem responde por isso é o vocabulário compartilhado, e não um `if` desta
     * stack.
     */
    count?: JobCount;
    labels: JobProgressLabels;
    /** Alguém pediu a ação. Parar, retomar e repetir de verdade são de quem consome. */
    onAction?: (intent: JobProgressIntent) => void;
    class?: string;
  } = $props();

  /**
   * A conta já escrita, ou nada quando não há conta.
   *
   * O molde escolhido é o que faz o trabalho sem total LER diferente, e não só
   * desenhar diferente: a barra indeterminada resolve o olho, e "1 240 até
   * agora" resolve a frase. Fosse um molde só, "de " ficaria pendurado no fim.
   */
  const countText = $derived.by(() => {
    if (!count) return undefined;
    const done = count.done.toLocaleString();
    return hasKnownTotal(count)
      ? labels.count.replace('{done}', done).replace('{total}', count.total!.toLocaleString())
      : labels.countWithoutTotal.replace('{done}', done);
  });

  /**
   * A BARRA É A DO DESIGN SYSTEM, e o que ela mostra sai do vocabulário
   * (decisão 5). `null` é "andando sem estimativa": a barra troca a fração por
   * um traço que percorre o trilho e deixa de escrever `aria-valuenow`, porque
   * zero mentiria sobre o que ninguém sabe.
   */
  const value = $derived(jobProgressValue(status, count));

  /**
   * A COR SEMÂNTICA SÓ EXISTE ONDE FOI MEDIDA — concluído e falhou. A folha
   * explica por que não há uma terceira. Quem troca o preenchimento é
   * `data-variant`, a API pública da barra, e nunca `data-status`.
   */
  const variant = $derived(
    status === 'complete' ? 'success' : status === 'failed' ? 'destructive' : undefined,
  );

  const actionLabel = $derived(labels.action?.[status]);

  /**
   * A INTENÇÃO SAI DO VOCABULÁRIO, e não de um `if` daqui: enquanto o trabalho
   * não terminou a ação INTERROMPE, e depois de terminado ela COMEÇA DE NOVO.
   * Quem responde "já terminou?" é `isRunFinished`, e é o que impede as cinco
   * stacks de escreverem cinco versões da mesma regra — uma delas discordaria
   * sobre `stopped`, que é o estado em que a resposta é menos óbvia.
   */
  const intent: JobProgressIntent = $derived(isRunFinished(status) ? 'start' : 'stop');
</script>

<!--
  `<div>`, e não `<p>`: aqui não há uma frase, há um bloco com uma barra dentro.
  Nenhum papel ARIA na raiz e nenhuma região viva (decisão 1) — o que dá nome ao
  conjunto é a própria barra, que carrega o rótulo do trabalho.

  OCUPADO ENQUANTO CORRE, e só (decisão 3, regra 1 da §8 da guideline 17).
  `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
  nada — é o contrário da região viva, e é o que o anexo em envio já usa.
-->
<div
  data-slot="job-progress"
  class={cn('nds-job-progress', className)}
  data-status={status}
  aria-busy={status === 'running' ? 'true' : undefined}
>
  <span class="nds-job-progress-label" data-slot="job-progress-label">{label}</span>

  <!--
    A CONTA É DECORATIVA (decisão 4). Ela se reescreve a cada unidade
    processada, e o que a barra já carrega em `aria-valuenow` chegaria duas vezes
    a quem ouve — sendo que a cópia que sobra é justamente a que rerroda.
  -->
  {#if count}
    <span
      class="nds-job-progress-count"
      data-slot="job-progress-count"
      aria-hidden="true">{countText}</span
    >
  {/if}

  <!--
    A BARRA guarda o papel e o NOME. Sem nome, `role="progressbar"` é anunciado
    como "barra de progresso, 24%": o leitor diz quanto, nunca de quê. O nome é o
    rótulo do trabalho, que é o mesmo texto que se vê ao lado.
  -->
  <Progress
    {value}
    class="nds-job-progress-bar"
    data-variant={variant}
    aria-label={label}
  />

  <!--
    A PALAVRA É O ESTADO, e é a única parte da peça que não sai do que é lido em
    voz (decisão 2).
  -->
  <span class="nds-job-progress-status" data-slot="job-progress-status"
    >{labels.status[status]}</span
  >

  <!--
    A AÇÃO DIZ O QUE FAZ (decisão 6), e o rótulo é o nome acessível: não há
    `aria-label` separado, porque o texto que se vê já diz o que o botão faz — e
    nome acessível que diverge do texto visível quebra WCAG 2.5.3 pelo caminho.
  -->
  {#if actionLabel}
    <Button
      class="nds-job-progress-action"
      data-slot="job-progress-action"
      variant="outline"
      size="sm"
      onclick={() => onAction?.(intent)}>{actionLabel}</Button
    >
  {/if}
</div>
