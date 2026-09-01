<script lang="ts" module>
  // ─── InlineCitation ────────────────────────────────────────────────────────
  //
  // A marca numerada que liga uma frase à fonte em que ela se apoia.
  //
  // Desenho em `nds/evidencia.css`, no bloco "Citação em linha", que também
  // guarda as dez decisões da peça e o eixo da família. O vocabulário —
  // `Citation`, `ChatSource` — vem de `@shared/primitives/chat-protocol`.
  //
  // POR QUE ELA É PEÇA, e não um cartão de ponteiro com título e link. A
  // pergunta veio antes do desenho, e a resposta tem duas metades que nenhum
  // painel flutuante genérico resolve:
  //
  //   · ELA VIVE DENTRO DE TEXTO CORRIDO, e isso é geometria própria. A marca
  //     interrompe um parágrafo: assenta na linha de base sem esticar a
  //     entrelinha, não se separa da palavra que a antecede quando a linha
  //     quebra, e mesmo assim oferece um alvo de toque de 24 px. As três
  //     exigências brigam entre si, e nenhuma classe desta base as concilia —
  //     as irmãs desenham listas e caixas, onde a altura do elemento é livre
  //     por não haver linha de texto em volta dele.
  //   · TOQUE NÃO TEM PONTEIRO. O cartão de ponteiro desta base abre por
  //     `mouseenter` e por `focus`, com 600 ms de espera. Em telefone o
  //     primeiro não existe; e percorrer com Tab um parágrafo de cinco citações
  //     pelo segundo abriria cinco painéis, um por parada de tabulação.
  //
  // É POR ISSO QUE A PEÇA NÃO USA O PAINEL ANCORADO DA LIB HEADLESS DESTA
  // STACK. Ele nasce `role="dialog"` e abre no foco: papel de diálogo exige
  // nome acessível, e com um gatilho cujo texto é "1" o resultado seria um
  // diálogo chamado "1". A marcação é própria, e é a mesma das cinco.
  //
  // O QUE O COMPONENTE NÃO FAZ: buscar a fonte, resolver o endereço, recortar o
  // trecho, numerar as marcas de uma página, decidir se duas podem estar
  // abertas ao mesmo tempo. Ele desenha o que recebe (§2 da guideline 17).
  //
  // DIVERGÊNCIA DE API, em relação à referência, e ela se REGISTRA em vez de se
  // "alinhar" (§4.1 da guideline 17): lá a peça é uma fábrica que devolve o
  // elemento, e os comandos moram no próprio elemento devolvido. Aqui ela é um
  // componente, as cinco propriedades têm os MESMOS nomes, e os comandos são
  // exports de instância — alcançados por `bind:this`. Markup, classes
  // `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.

  export interface InlineCitationLabels {
    /**
     * O nome acessível da marca, JÁ ESCRITO.
     *
     * O que se vê é um número, e "1" sozinho não diz nada a quem ouve. O nome
     * chega escrito porque junta três coisas que só quem monta conhece — a
     * palavra para "fonte", o número e o título do documento —, e a ordem entre
     * elas troca com o idioma.
     *
     * Ele PRECISA conter o número que a marca mostra (WCAG 2.5.3, rótulo no
     * nome), e é por isso que quem o escreve recebe o número junto no andaime.
     */
    marker: string;
    /**
     * O que se diz no lugar do endereço quando ele foi recusado.
     *
     * Endereço recusado não é um lugar, e imprimi-lo responderia com ruído a
     * pergunta que a linha existe para responder — de onde isto vem. O título
     * continua legível; o que sai é o link e o endereço.
     */
    unsafeSource: string;
  }

  /**
   * Os comandos da marca, para quem controla de fora.
   *
   * É a forma que um componente sem propriedade controlada tem de ser
   * controlado: quem controla chama `open()`/`close()` e recebe cada mudança de
   * volta por `onOpenChange`. Nesta stack eles são exports de instância, e o
   * caminho até eles é `bind:this` — a divergência de forma que se registra.
   *
   * É este par que resolve a exclusão mútua entre marcas: a peça não conhece as
   * vizinhas, e não conhecê-las é o que permite que duas marcas da mesma frase
   * venham de lugares diferentes da resposta.
   */
  export interface InlineCitationCommands {
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
  }

  let counter = 0;

  /**
   * Espera antes de abrir ao passar o ponteiro.
   *
   * Menor que os 600 ms do cartão de ponteiro, e de propósito: lá o gatilho é
   * um nome de pessoa ou um link, e abrir cedo demais atrapalha quem só
   * atravessa a frase; aqui o gatilho é uma marca deliberadamente pequena,
   * difícil de pegar por acidente. Quem parou o ponteiro em cima dela quis
   * parar.
   */
  const OPEN_DELAY = 300;

  /**
   * Espera antes de fechar depois que o ponteiro sai.
   *
   * Dá tempo de atravessar o vão entre a marca e a caixa. Mesmo valor do cartão
   * de ponteiro, e pelo mesmo motivo.
   */
  const CLOSE_DELAY = 300;

  /**
   * Folga entre a caixa e a borda da janela, em pixels.
   *
   * Número mecânico, e não valor de desenho: ele não pinta nada e não entra em
   * folha nenhuma — é o limite contra o qual a caixa é empurrada de volta para
   * dentro da tela.
   */
  const VIEWPORT_GUTTER = 8;

  /**
   * Empurra a caixa de volta para dentro da janela, e escolhe o lado.
   *
   * A FOLHA POSICIONA; esta função só MEDE, e devolve o resultado por uma
   * custom property e por um atributo. É a divisão que mantém o desenho na
   * folha: sem ela, o deslocamento viraria `left` em `style` inline, e no dia
   * em que a folha mudasse a largura da caixa o número inline continuaria o
   * mesmo.
   *
   * Roda uma vez por abertura, e fora de qualquer espera com observador de
   * mutação — ela LÊ layout, e leitura que provoca a própria reavaliação é a
   * armadilha que pendura a aba (regra do `waitFor` no CLAUDE.md raiz).
   */
  function fitPanel(marker: HTMLElement, panel: HTMLElement): void {
    panel.style.removeProperty('--nds-inline-citation-shift');
    panel.dataset.side = 'bottom';

    const markerRect = marker.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    // ABAIXO NÃO CABE? Abre para cima — e só quando ACIMA cabe. Sem a segunda
    // metade da pergunta, uma marca numa janela baixa trocaria um transbordo
    // por outro, e o de cima é pior: a caixa cobriria a frase que se estava
    // lendo.
    const roomBelow = window.innerHeight - markerRect.bottom - VIEWPORT_GUTTER;
    if (panelRect.height > roomBelow && markerRect.top > panelRect.height + VIEWPORT_GUTTER) {
      panel.dataset.side = 'top';
    }

    // O DESVIO HORIZONTAL é medido depois do lado, com a caixa já onde vai
    // ficar. Só a componente horizontal é empurrada: a vertical já foi
    // resolvida pelo lado, e empurrar as duas faria a caixa descolar da marca
    // que a abriu.
    const placed = panel.getBoundingClientRect();
    let shift = 0;
    if (placed.right > window.innerWidth - VIEWPORT_GUTTER) {
      shift = window.innerWidth - VIEWPORT_GUTTER - placed.right;
    }
    if (placed.left + shift < VIEWPORT_GUTTER) {
      shift = VIEWPORT_GUTTER - placed.left;
    }
    if (shift !== 0) {
      panel.style.setProperty('--nds-inline-citation-shift', `${Math.round(shift)}px`);
    }
  }
</script>

<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Citation } from '@shared/primitives/chat-protocol';
  import { isSafeUrl } from '@shared/primitives/markdown-ast';
  import { cn } from '@/lib/utils.js';

  const {
    citation,
    index,
    defaultOpen = false,
    onOpenChange,
    labels,
    class: className,
  }: {
    /**
     * A citação: a fonte, o trecho e onde dentro dela.
     *
     * Vem inteira de `@shared/primitives/chat-protocol`. `excerpt` e `anchor`
     * são opcionais lá e continuam opcionais aqui: quem cita um documento sem
     * saber a página tem uma citação legítima, e a caixa simplesmente não monta
     * a parte que não veio — nunca um traço no lugar dela.
     */
    citation: Citation;
    /**
     * O número que a marca mostra.
     *
     * É CONTEÚDO, e não decoração: é por ele que a frase se refere à fonte, e é
     * ele que amarra a marca à lista de fontes do turno. Quem numera é quem
     * escreve a frase — uma marca que se numerasse sozinha precisaria conhecer
     * as irmãs, e marcas irmãs podem nem estar no mesmo parágrafo.
     */
    index: number;
    /** Nasce com a prévia montada — o estado inicial, e não uma composição. */
    defaultOpen?: boolean;
    /** Cada abertura e cada fechamento, para quem controla de fora. */
    onOpenChange?: (open: boolean) => void;
    labels: InlineCitationLabels;
    class?: string;
  } = $props();

  const id = `inline-citation-${++counter}`;
  const panelId = `${id}-panel`;

  // `untrack` diz o que a leitura quer dizer: o VALOR DE PARTIDA, e não uma
  // ligação. Quem passa `defaultOpen` pede como a marca nasce; depois disso
  // quem manda é quem lê e quem controla — uma ligação faria a propriedade
  // reabrir a prévia que a pessoa acabou de fechar.
  let expanded = $state(untrack(() => defaultOpen));
  let rootEl = $state<HTMLElement | null>(null);
  let markerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLElement | null>(null);

  /**
   * Quem abriu.
   *
   * `pointer` fecha sozinho quando o ponteiro sai; `control` fica até alguém
   * fechar. Sem essa distinção, a caixa aberta por clique sumiria ao primeiro
   * movimento do mouse — e quem abriu por toque veria a prévia piscar.
   */
  let openedBy: 'pointer' | 'control' = 'control';
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  // O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é ENTRADA:
  // `javascript:` num `href` executa. A pergunta é feita NO PONTO em que o
  // endereço encosta no DOM — o `href`, o `cite` e a própria linha do endereço
  // dependem dela. Aqui ela é explícita porque a regra `href_unvalidated` do
  // auditor só enxerga JSX: nesta stack nenhum portão a cobra, e o que resta é
  // a leitura.
  const safe = $derived(isSafeUrl(citation.source.url));

  function clearTimers(): void {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  function show(): void {
    clearTimers();
    if (expanded) return;
    expanded = true;
    onOpenChange?.(true);
  }

  function hide(): void {
    clearTimers();
    if (!expanded) return;
    expanded = false;
    onOpenChange?.(false);
  }

  function scheduleShow(): void {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (expanded) return;
    openTimer = setTimeout(() => { openedBy = 'pointer'; show(); }, OPEN_DELAY);
  }

  function scheduleHide(): void {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    // Aberta por controle, o ponteiro que sai não fecha: quem clicou pediu que
    // ficasse, e em toque não há "sair" nenhum para desfazer o pedido.
    if (openedBy === 'control') return;
    closeTimer = setTimeout(() => { hide(); }, CLOSE_DELAY);
  }

  function cancelHide(): void {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  // PONTEIRO, TOQUE E TECLADO, e nenhum deles sozinho. O clique é o caminho que
  // serve aos três — em toque ele é o único que existe, e no teclado ele é o
  // que Enter e Espaço já disparam num botão. O ponteiro ganha a abertura por
  // espera como CONVENIÊNCIA, nunca como único caminho (regra 3 da §8).
  //
  // A MARCA NÃO ABRE POR FOCO, e é a divergência deliberada em relação ao
  // cartão de ponteiro: percorrer com Tab um parágrafo de cinco citações
  // abriria cinco caixas, uma por parada.
  function onMarkerClick(): void {
    clearTimers();
    openedBy = 'control';
    if (expanded) hide(); else show();
  }

  function onOutsidePointer(event: Event): void {
    const target = event.target;
    if (target instanceof Node && rootEl?.contains(target)) return;
    hide();
  }

  function onKeyDown(event: KeyboardEvent): void {
    // Escape fecha e o foco NÃO se move: ele já está na marca, que é de onde a
    // caixa saiu (WCAG 2.1.2, e a regra 2 da §8 da guideline 17).
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    hide();
    markerEl?.focus();
  }

  // ENCAIXAR RODA UMA VEZ POR ABERTURA, e depois de o layout existir: a
  // referência da caixa só chega aqui quando ela já está no documento. Nada de
  // espera por observador de mutação — a medição LÊ layout, e leitura que
  // provoca a própria reavaliação pendura a aba sem reprovar.
  $effect(() => {
    const panel = panelEl;
    const marker = markerEl;
    if (!panel || !marker) return;
    fitPanel(marker, panel);
  });

  // Os dois ouvintes de documento só existem enquanto a caixa está aberta, e a
  // limpeza do efeito os solta — inclusive quando a marca sai da página com a
  // caixa aberta.
  $effect(() => {
    if (!expanded) return;
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onOutsidePointer, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onOutsidePointer, true);
    };
  });

  /** Temporizador pendente não sobrevive à marca. */
  $effect(() => () => clearTimers());

  // Nascer aberta é uma ABERTURA, e quem controla de fora recebe todas — é o
  // que a referência faz ao agendar a primeira no quadro seguinte ao da
  // montagem. Uma vez, e nunca de novo: o estado inicial só acontece uma vez.
  onMount(() => {
    if (defaultOpen) onOpenChange?.(true);
  });

  export function open(): void {
    openedBy = 'control';
    show();
  }

  export function close(): void {
    hide();
  }

  export function toggle(): void {
    openedBy = 'control';
    if (expanded) hide(); else show();
  }

  export function isOpen(): boolean {
    return expanded;
  }
</script>

<!--
  A RAIZ É UM `<span>` EM LINHA, e a caixa é FILHA dela — não um portal para o
  fim do documento. Duas coisas dependem disso, e as duas são desta peça:

    · A ORDEM DE TABULAÇÃO fica natural. Da marca, o Tab entra na caixa e
      alcança o link do título. Portalada, o Tab sairia da marca para a próxima
      palavra do parágrafo e o link ficaria inalcançável sem mover o foco à mão
      — e mover o foco é o que a regra 2 da §8 proíbe.
    · O POSICIONAMENTO fica na FOLHA. A raiz é `position: relative`, então a
      caixa se ancora nela por CSS; o único número que o código escreve é o
      empurrão de volta para dentro da janela.
-->
<span
  bind:this={rootEl}
  class={cn('nds-inline-citation', className)}
  data-slot="inline-citation"
>
  <!--
    A MARCA É UM BOTÃO QUE EXPANDE, e não um link nem um gatilho de diálogo.
    `aria-expanded` é o que diz o estado, e ele é PALAVRA para quem ouve — nada
    aqui depende de a marca mudar de cor (WCAG 1.4.1). O número é o texto, e o
    nome acessível o contém (WCAG 2.5.3).

    O ALVO DE TOQUE cresce por pseudo-elemento posicionado, FORA do fluxo, e
    isso está na folha: aumentar a marca em si esticaria a entrelinha do
    parágrafo em toda linha que trouxesse uma citação.
  -->
  <button
    bind:this={markerEl}
    {id}
    type="button"
    class="nds-inline-citation-marker"
    data-slot="inline-citation-marker"
    aria-expanded={expanded}
    aria-controls={panelId}
    aria-label={labels.marker}
    onclick={onMarkerClick}
    onmouseenter={scheduleShow}
    onmouseleave={scheduleHide}>{index}</button
  >

  {#if expanded}
    <!--
      A CAIXA É `<span>`, e não `<div>`: a marca vive dentro de um parágrafo, e
      `<p>` só aceita conteúdo de frase. Um `<div>` aqui fecharia o parágrafo
      antes da metade da frase, e o resto do texto viraria irmão do parágrafo em
      vez de continuação dele. Dentro de uma caixa flexível todo filho é
      blocado de qualquer jeito, então nada se perde no desenho.

      A SUPERFÍCIE É A COMPARTILHADA: fundo, borda, raio, sombra e respiro vêm
      do painel ancorado desta base; o que a folha desta família acrescenta é o
      que só a citação tem.

      E A CAIXA NÃO GANHA PAPEL — decisão 1 da folha: papel de diálogo exige
      nome acessível, e o texto do gatilho é "1". A supressão logo abaixo é
      disso: o aviso genérico pede um papel por causa dos dois ouvintes de
      ponteiro, mas eles são CONVENIÊNCIA (a travessia do vão entre a marca e a
      caixa) e nada aqui depende deles — o caminho que serve aos três meios é o
      clique, e quem chega pelo teclado entra na caixa pela ordem de tabulação.
      Dar papel para calar o aviso trocaria uma decisão medida por um silêncio.
    -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      bind:this={panelEl}
      id={panelId}
      class="nds-popover-content nds-inline-citation-panel"
      data-slot="inline-citation-panel"
      data-side="bottom"
      onmouseenter={cancelHide}
      onmouseleave={scheduleHide}
    >
      {#if safe}
        <span
          class="nds-inline-citation-address nds-font-mono nds-truncate"
          data-slot="inline-citation-address">{citation.source.url}</span
        >
      {:else}
        <!--
          O MONOESPAÇADO SÓ ENTRA QUANDO A LINHA É MESMO UM ENDEREÇO. Recusado,
          o que fica ali são PALAVRAS — endereço recusado não é um lugar, e
          imprimi-lo responderia com ruído a pergunta que a linha existe para
          responder.
        -->
        <span
          class="nds-inline-citation-address"
          data-slot="inline-citation-address">{labels.unsafeSource}</span
        >
      {/if}

      {#if safe}
        <a
          class="nds-inline-citation-title"
          data-slot="inline-citation-title"
          href={citation.source.url}
          rel="noreferrer">{citation.source.title}</a
        >
      {:else}
        <!--
          O TÍTULO CONTINUA LEGÍVEL quando o endereço foi recusado, e deixa de
          ser link: não há para onde ir, e um link que não leva a lugar nenhum é
          uma parada de tabulação sem destino.
        -->
        <span
          class="nds-inline-citation-title"
          data-slot="inline-citation-title"
          data-unsafe>{citation.source.title}</span
        >
      {/if}

      <!--
        O TRECHO É UMA CITAÇÃO, e `<q>` é o elemento que diz isso — com as
        aspas do idioma vindo do navegador em vez de escritas no texto, que é o
        mesmo motivo pelo qual nenhum glifo entra na `translations.json`. `cite`
        leva o endereço só quando ele passou, porque o atributo é um endereço
        como o `href`.
      -->
      {#if citation.excerpt}
        <q
          class="nds-inline-citation-excerpt"
          data-slot="inline-citation-excerpt"
          cite={safe ? citation.source.url : undefined}>{citation.excerpt}</q
        >
      {/if}

      <!--
        ONDE DENTRO DA FONTE — página, âncora, intervalo de linhas. Chega
        escrito, porque "12" sozinho não é um lugar e o que precede o número é
        idioma. Ausente é ausente: nada é montado no lugar dele.
      -->
      {#if citation.anchor}
        <span
          class="nds-inline-citation-anchor"
          data-slot="inline-citation-anchor">{citation.anchor}</span
        >
      {/if}
    </span>
  {/if}
</span>
