<script lang="ts" module>
  // ─── ContextDisplay ────────────────────────────────────────────────────────
  //
  // Quanto da janela de contexto já foi usada.
  //
  // Desenho em `nds/medicao.css`, no bloco "Uso da janela de contexto", que
  // também guarda as cinco decisões de acessibilidade. A CONTA — fração,
  // limiar de aviso, nível — vem de `@shared/primitives/token-budget`; o dado
  // vem de `TokenUsage`, em `@shared/primitives/chat-protocol`.
  //
  // É A PEÇA QUE DÁ NOME AO EIXO DA FAMÍLIA 5: o mesmo número em formas
  // diferentes. Anel, barra e texto desenham a MESMA medição, e a forma é
  // escolha de espaço, não de significado — quem troca de forma não troca de
  // informação.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: o que muda a cada quadro é DECORATIVO, e o
  // número é TEXTO. O medidor não tem papel ARIA nem valor, não há `aria-live`
  // em lugar nenhum, e nada aqui se reanuncia — um contador que se reanuncia
  // torna a tela impossível de ouvir. É a mesma decisão do contador do campo de
  // mensagem, do relógio do reprodutor de mídia e do medidor de voz.
  //
  // SEM TETO NÃO HÁ FRAÇÃO, SÓ CONTAGEM. O `limit` é opcional no vocabulário
  // porque nem sempre se sabe qual é, e a peça desenha os dois casos: com teto
  // mostra a fração e o nível; sem teto mostra a contagem e diz que não há teto
  // conhecido — e NÃO desenha medidor nenhum, porque um anel vazio lê como zero
  // por cento, que é o oposto de "não se sabe quanto cabe".
  //
  // O QUE O COMPONENTE NÃO FAZ: buscar consumo, contar token, formatar duração,
  // decidir o que fazer quando a janela enche. Ele recebe a medição e desenha —
  // §2 da guideline 17.
  //
  // DIVERGÊNCIA DE API, em relação à referência: lá a peça é uma fábrica que
  // recebe um objeto de opções e devolve o elemento. Aqui ela é um componente e
  // as opções são props. Não há evento nem retorno: a peça é só leitura.
  // Markup, classes `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.
  import type { BadgeVariant } from '@/components/ui/badge';
  import type { BudgetLevel } from '@shared/primitives/token-budget';

  /**
   * A forma com que o mesmo número se apresenta.
   *
   * `ring` cabe num trilho estreito ao lado de outros controles; `bar` toma a
   * largura e serve a um painel; `text` some com o desenho e fica só com o
   * número, para quando o espaço é uma linha de rodapé. Nenhuma das três muda o
   * que é dito, nem o que é lido em voz.
   */
  export type ContextDisplayForm = 'ring' | 'bar' | 'text';

  /** Na ordem do mais compacto para o mais nu. */
  export const CONTEXT_DISPLAY_FORMS: readonly ContextDisplayForm[] = [
    'ring',
    'bar',
    'text',
  ] as const;

  export interface ContextDisplayLabels {
    /**
     * De que número se trata.
     *
     * "62%" sozinho não diz de quê. O título não aparece na tela — o desenho já
     * dá o contexto a quem vê — e é o que responde a pergunta para quem ouve.
     */
    title: string;
    /**
     * A palavra de cada nível.
     *
     * É ela que descreve, e não a cor do medidor: cor sozinha não descreve
     * estado (WCAG 1.4.1). `Record` completo de propósito — nível novo no
     * primitivo compartilhado reprova a compilação aqui, em vez de desenhar uma
     * etiqueta em branco que ninguém repara.
     */
    level: Record<BudgetLevel, string>;
    /** Liga o consumido ao teto: dezenove mil DE trinta e dois mil. */
    of: string;
    /** O que está sendo contado. */
    unit: string;
    /**
     * Quando não se sabe o teto.
     *
     * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com
     * ela, a ausência de fração vira informação: o número é uma contagem, e não
     * uma fração que ficou pela metade.
     */
    unbounded: string;
  }

  /**
   * A cor de reforço de cada nível, em tabela.
   *
   * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
   * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA
   * é quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
   * limiar de 3:1.
   */
  const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
    normal: 'default',
    warning: 'warning',
    critical: 'destructive',
  };
</script>

<script lang="ts">
  import type { TokenUsage } from '@shared/primitives/chat-protocol';
  import { budgetLevel, usedPercent, usedTokens } from '@shared/primitives/token-budget';
  import { Badge } from '@/components/ui/badge';
  import { cn } from '@/lib/utils.js';

  const {
    usage,
    form = 'ring',
    labels,
    class: className,
  }: {
    /** A medição. Quem conta é quem sabe, e é quem passa. */
    usage: TokenUsage;
    /** Como desenhar o mesmo número. */
    form?: ContextDisplayForm;
    labels: ContextDisplayLabels;
    class?: string;
  } = $props();

  // A CONTA SAI DO PRIMITIVO, e não de um `if` daqui: `null` é a resposta de
  // que não há teto, e é a mesma resposta nas cinco stacks. Escrita aqui, uma
  // delas trataria teto zero como teto e desenharia uma fração infinita.
  const percent = $derived(usedPercent(usage));
  const level = $derived(budgetLevel(usage));
  const used = $derived(usedTokens(usage));

  /**
   * O VALOR é sempre o maior número disponível: a fração quando há teto, a
   * contagem quando não há. O que muda entre os dois casos é o que se pode
   * dizer, e não o lugar onde se diz.
   */
  const valueText = $derived(
    percent === null ? `${used.toLocaleString()} ${labels.unit}` : `${percent}%`,
  );

  /**
   * E O DETALHE é sempre o que qualifica o valor: o teto quando ele existe, e a
   * notícia de que não existe quando não existe.
   */
  const detailText = $derived(
    percent === null
      ? labels.unbounded
      : `${used.toLocaleString()} ${labels.of} ${usage.limit!.toLocaleString()} ${labels.unit}`,
  );
</script>

<!--
  `<p>`, e não `<div>`: é uma frase sobre uma medição, e a etiqueta de nível é
  conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1).

  Sem teto não há nível, e o atributo fica FORA — em vez de sair como uma
  palavra vazia que a folha ainda tentaria colorir.
-->
<p
  data-slot="context-display"
  class={cn('nds-context-display', className)}
  data-form={form}
  data-level={level ?? undefined}
>
  <!--
    O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe do
    que se trata pelo lugar em que a peça está, e quem ouve não sabe.
  -->
  <span class="nds-sr-only" data-slot="context-display-title">{labels.title}</span>

  <!--
    SEM TETO NÃO SE DESENHA MEDIDOR (decisão 5), e a forma de texto não desenha
    medidor nenhum.

    O MEDIDOR É DECORATIVO (decisão 1 da folha), e sai inteiro do que é lido em
    voz: o número ao lado já diz tudo, e repeti-lo em desenho não acrescenta
    nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um segundo portador
    do mesmo número o faria ser lido duas vezes.

    A custom property é valor de RUNTIME, como o progresso do anexo já faz, e
    fica no MEDIDOR nas duas formas — no trilho, nunca no preenchimento, que a
    herda de graça. O que entra é o mesmo inteiro que o texto mostra, e não a
    fração crua: um anel cheio ao lado de "99%" seriam duas respostas para uma
    pergunta.
  -->
  {#if percent !== null && form === 'ring'}
    <span
      class="nds-context-display-ring"
      data-slot="context-display-meter"
      aria-hidden="true"
      style="--nds-context-used: {percent}"
    ></span>
  {:else if percent !== null && form === 'bar'}
    <!--
      O preenchimento vem colado ao trilho de propósito: espaço entre as tags
      viraria nó de texto dentro de um elemento cujo conteúdo tem de ser vazio —
      o medidor não fala, ele desenha.
    -->
    <span
      class="nds-context-display-bar"
      data-slot="context-display-meter"
      aria-hidden="true"
      style="--nds-context-used: {percent}"
      ><span class="nds-context-display-bar-fill"></span></span
    >
  {/if}

  <span
    class="nds-context-display-value"
    data-slot="context-display-value">{valueText}</span
  >

  <span
    class="nds-context-display-detail"
    data-slot="context-display-detail">{detailText}</span
  >

  <!--
    O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir. Ele
    aparece SEMPRE que há teto, inclusive com folga: uma peça que só falasse
    quando a notícia é ruim deixaria a boa notícia indistinguível de uma medição
    que não chegou.
  -->
  {#if level}
    <Badge
      class="nds-context-display-level"
      data-slot="context-display-level"
      variant={LEVEL_VARIANT[level]}>{labels.level[level]}</Badge
    >
  {/if}
</p>
