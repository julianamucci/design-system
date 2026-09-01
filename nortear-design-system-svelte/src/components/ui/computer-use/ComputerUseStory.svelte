<script lang="ts">
  /**
   * Andaime de uma tela só — o Playground e a maior parte das stories de estado.
   *
   * É componente, e não trecho no arquivo de story, por duas razões que se
   * somam: a TELA entra por `{#snippet}`, e snippet só existe dentro de
   * marcação; e num `*.stories.ts` todo export nomeado vira story, então não há
   * onde escrever a marcação sem publicar uma story a mais na barra lateral.
   *
   * Os rótulos são DERIVADOS do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra que
   * apresenta o endereço é texto de interface. Sem o invólucro, o `render`
   * montaria os rótulos no idioma em que a story abriu e eles ficariam para trás
   * na troca.
   *
   * O invólucro é também onde "houve passo?" vira lista vazia — que é a moldura
   * antes do primeiro toque, e o que existe antes de o agente tocar em qualquer
   * coisa.
   */
  import type { ComputerStep, RunStatus } from '@shared/primitives/chat-protocol';
  import {
    COMPUTER_STEPS_LOGIN,
    COMPUTER_URL,
  } from '@shared/primitives/computer-use-examples';
  import { locale } from '@/lib/i18n';
  import { cn } from '@/lib/utils.js';
  import { ComputerUse } from './index';
  import ComputerUseDemoScreen from './ComputerUseDemoScreen.svelte';
  import { computerUseLabelsFor } from './computer-use.fixtures';

  const {
    url = COMPUTER_URL,
    steps = COMPUTER_STEPS_LOGIN,
    withSteps = true,
    activeIndex = 0,
    status = 'idle',
    wrapperClass = 'nds-w-full',
  }: {
    /** O endereço da tela que está sendo dirigida. */
    url?: string;
    /** Os passos da sessão, na ordem em que aconteceram. */
    steps?: readonly ComputerStep[];
    /** Houve passo? Sem passo nenhum não há rastro nem legenda. */
    withSteps?: boolean;
    /** Qual passo está acontecendo agora. */
    activeIndex?: number;
    /** Em que pé está a sessão. Decide o ocupado e o anel que pulsa. */
    status?: RunStatus;
    /** A largura da foto. É o que aperta a moldura na story do texto longo. */
    wrapperClass?: string;
  } = $props();

  const labels = $derived(computerUseLabelsFor($locale));
  const shownSteps = $derived(withSteps ? steps : []);
  /**
   * A classe do invólucro é montada no SCRIPT, e não interpolada no atributo:
   * o auditor de classes lê o literal de `class`, e um `{trecho}` no meio dele
   * seria lido como nome de classe que não existe na folha.
   */
  const rootClass = $derived(cn('nds-stack', wrapperClass));
</script>

<!--
  A TELA É ESPAÇO DE QUEM CONSOME, e é aqui que ela entra. O `{#snippet}` é o
  tipo desse espaço nesta stack, e a peça o renderiza sem tocar em nada do que
  vem dentro — nem no texto alternativo, nem no `inert`.
-->
{#snippet screen()}
  <ComputerUseDemoScreen />
{/snippet}

<div class={rootClass} data-spacing="lg">
  <ComputerUse
    {url}
    {screen}
    steps={shownSteps}
    {activeIndex}
    {status}
    {labels}
  />
</div>
