<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from './index';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'withDelay'
    | 'userProfile'
    | 'linkPreview'
    | 'definition'
    | 'metric'
    | 'extraClass';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    openDelay?: number;
    closeDelay?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    href?: string;
    variant?: Variant;
    /** Cada abertura e cada fechamento, com o novo estado. */
    onOpenChange?: (open: boolean) => void;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    openDelay = 600,
    closeDelay = 300,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = '@joana',
    href,
    variant = 'default',
    onOpenChange,
  }: Props = $props();

  // A MOLDURA, por composição — e ela é a mesma das outras quatro, conferida nos
  // arquivos do react e do vanilla em vez de transcrita de memória.
  //
  // Esta stack cravava `Comentário de … há 2 horas.` para as sete variantes,
  // enquanto as outras quatro trocam a frase. Sozinha nenhuma estava errada;
  // juntas, comparar as páginas deixava de responder alguma coisa — e depois de
  // a métrica passar a valer `3,42%` a moldura fixa virou prosa impossível
  // ("Comentário de 3,42% há 2 horas."). É a forma 2 da regra de não criar
  // divergência nova.
  const FRASES: Record<Variant, { antes: string; depois: string }> = {
    default: { antes: 'Comentário de', depois: 'há 2 horas.' },
    withDelay: { antes: 'Documentação em', depois: '— leitura de 8 minutos.' },
    userProfile: { antes: 'Comentário de', depois: 'há 2 horas.' },
    linkPreview: { antes: 'O guia completo está em', depois: '.' },
    definition: { antes: 'Todo componente do sistema atende', depois: ', sem exceção.' },
    metric: { antes: 'A página inicial fechou o mês em', depois: ', dentro da meta.' },
    extraClass: { antes: 'Resumo da entrega de', depois: 'nesta sprint.' },
  };
  const frase = $derived(FRASES[variant] ?? FRASES.default);

  // O DESTINO de cada gatilho (D15). Termo e métrica deixaram de ser `<button>`:
  // o C8 exige que o cartão não seja o único caminho para a informação, e o
  // conteúdo compartilhado manda ter glossário ou página dedicada como
  // alternativa. Eram justamente as duas composições em que esse julgamento
  // morde — e as duas que não ofereciam saída nenhuma no toque.
  //
  // URL não se traduz: os destinos são os mesmos nas cinco stacks e nos três
  // idiomas, como o `/users/joana` da `UserProfile` já era.
  // Os destinos saem de CONSTANTES, e não de literais dentro da tabela, por um
  // motivo de portão: a chave da variante de classe extra termina nas cinco
  // letras de "Class", e uma URL entre aspas logo depois dos dois-pontos casa o
  // formato que o `legacy_class_in_story` varre — a regra acusou a URL de ser
  // classe `nds-*` inexistente. Nomear o valor também apaga a repetição tripla
  // do destino do perfil.
  //
  // (E este comentário é a segunda ocorrência do mesmo defeito: escrito com a
  // chave e a URL lado a lado, ele REPROVAVA sozinho, sem uma linha de código.
  // Portão que casa palavra solta mede prosa.)
  const HREF_PERFIL = '/users/joana';
  const HREF_DOCS = 'https://design-system.dev';
  const HREF_GLOSSARIO = '/glossario/wcag-2-2-aa';
  const HREF_METRICA = '/metricas/conversao';

  const HREFS: Record<Variant, string> = {
    default: HREF_PERFIL,
    withDelay: HREF_DOCS,
    userProfile: HREF_PERFIL,
    linkPreview: HREF_DOCS,
    definition: HREF_GLOSSARIO,
    metric: HREF_METRICA,
    extraClass: HREF_PERFIL,
  };
  const hrefFinal = $derived(href ?? HREFS[variant] ?? HREF_PERFIL);

  // Gatilho de termo e de métrica: LINK, mas com a affordance de definição — o
  // sublinhado pontilhado e o cursor de ajuda continuam, porque é o que diz ao
  // leitor que há explicação ali. Saem só as três utilitárias que existiam para
  // apagar o cromo de `<button>` (`nds-bg-transparent`, `nds-border-none`,
  // `nds-p-0`), que num `<a>` não neutralizam nada.
  const CLASSES_DOTTED =
    'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help';
  const CLASSES_LINK = 'nds-text-primary nds-font-medium nds-hover-underline';
  const triggerClasses = $derived(
    variant === 'definition' || variant === 'metric' ? CLASSES_DOTTED : CLASSES_LINK,
  );
</script>

<p class="nds-text-body nds-max-w-sm nds-min-h-50" style="contain: layout">
  {frase.antes}
  {#key `${side}-${align}-${defaultOpen}-${openDelay}-${closeDelay}-${variant}`}
    <HoverCard bind:open {openDelay} {closeDelay} {onOpenChange}>
      <HoverCardTrigger>
        {#snippet child({ props })}
          <a href={hrefFinal} class={triggerClasses} {...props}>{triggerLabel}</a>
        {/snippet}
      </HoverCardTrigger>
      <HoverCardContent
        {side}
        {align}
        {sideOffset}
        class={variant === 'extraClass' ? 'nds-w-md nds-text-center' : undefined}
      >
        {#if variant === 'linkPreview'}
          <div class="nds-stack" data-spacing="sm">
            <div
              class="nds-cluster nds-text-caption nds-text-muted-foreground"
              data-align="center"
              data-spacing="xs"
            >
              <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
              <span class="nds-truncate">design-system.dev/overlays</span>
            </div>
            <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
            </p>
          </div>
        {:else if variant === 'definition'}
          <!-- O termo e a definição são os do conteúdo compartilhado
               (`variants.items.definitionTooltip.cardTerm` / `cardMeaning`), que é
               o que a docs page publica. A story dizia "WCAG 2.2 nível AA" e uma
               definição própria: quem comparasse página e story via duas
               respostas para a mesma variante. O termo em destaque é a MESMA
               sigla do gatilho — era aí que as stacks se dividiam. -->
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 AA</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Web Content Accessibility Guidelines: padrão internacional de acessibilidade para
              conteúdo web.
            </p>
          </div>
        {:else if variant === 'metric'}
          <!-- A métrica, o valor e a conta são os do conteúdo compartilhado
               (`variants.items.metricExplainer.cardMetric` / `cardValue` /
               `cardFormula`). A story mostrava "Largest Contentful Paint" e
               "LCP 1.8s": dois exemplos diferentes para a mesma variante, e quem
               comparasse os dois não teria como saber qual é o do sistema. -->
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">Conversão (últimos 30d)</p>
              <span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>
            </div>
            <p class="nds-text-caption nds-text-muted-foreground">
              Cliques no CTA / usuários únicos
            </p>
          </div>
        {:else if variant === 'withDelay'}
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Espera de 150ms para abrir e 100ms para fechar.
            </p>
          </div>
        {:else if variant === 'default'}
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Espera padrão: 600ms para abrir e 300ms para fechar.
            </p>
          </div>
        {:else if variant === 'extraClass'}
          <!-- A variante da CLASSE EXTRA tem miolo próprio, e por isto: a story
               `ExtraPanelClass` afirma a largura e o alinhamento, e um cartão de
               perfil — com avatar à esquerda e texto à direita — não deixa o
               `nds-text-center` aparecer em foto nenhuma. A variante não tinha
               ramo aqui e caía no `{:else}`, então esta stack fotografava o
               perfil enquanto as outras quatro fotografavam a entrega; a story
               passava porque só afirmava classe e largura. -->
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
            </p>
          </div>
        {:else}
          <div class="nds-cluster" data-spacing="sm" data-align="start">
            <div
              class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
              data-align="center"
              data-justify="center"
              aria-hidden="true"
            >
              JS
            </div>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        {/if}
      </HoverCardContent>
    </HoverCard>
  {/key}
  {frase.depois}
</p>
