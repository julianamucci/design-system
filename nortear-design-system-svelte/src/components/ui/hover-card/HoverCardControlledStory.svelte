<script lang="ts">
  import { HoverCard, HoverCardTrigger, HoverCardContent } from './index';
  import { Button } from '@/components/ui/button';

  // Andaime da story `States/Controlled`, e ele existe separado do
  // `HoverCardStory` porque o assunto aqui está FORA do cartão: dois botões que
  // movem o estado e um espelho que o mostra. Sem eles a story nascia com
  // `open: true` e afirmava só que abriu e que o Escape fecha — três asserções
  // contra as onze da referência, e nenhuma delas exercitava o controle de
  // fora, que é o que a story declara cobrir.
  //
  // O gatilho fica numa frase, como nas outras stories: o cartão enriquece um
  // texto que já existe.
  let open = $state(false);
</script>

<div
  class="nds-stack nds-max-w-sm nds-min-h-70"
  data-spacing="md"
  style="contain: layout"
>
  <div class="nds-cluster" data-spacing="sm">
    <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o mesmo
         nome acessível são ambíguos em leitor de tela. -->
    <Button size="sm" variant="outline" onclick={() => (open = true)}>
      Abrir pelo estado externo
    </Button>
    <Button size="sm" variant="outline" onclick={() => (open = false)}>
      Fechar pelo estado externo
    </Button>
  </div>

  <!-- A lista de comentários rola DENTRO da caixa, e o gatilho vive nela. É cena
       de produto, e é também o que a D10 precisa para ser medida: um ancestral
       rolável de verdade. Rolar aqui move o gatilho sem mover a janela — que é o
       caso em que uma das cinco libs DISPENSA o cartão em vez de reposicioná-lo.
       A altura sai da escada `--box-height-*` pelo `data-size` da folha, e não
       de um `style`: cravada, sairia do tema e da escala.
       Marcação igual à do vanilla, que é a referência: o `ScrollArea` de lib
       traria viewport e barra próprios de cada lib, e a cena das cinco deixaria
       de ser comparável. -->
  <div class="nds-scroll-area" data-size="md">
    <div
      class="nds-scroll-area-viewport nds-stack"
      data-spacing="md"
      data-testid="ancestral-rolavel"
    >
      <!-- O primeiro comentário é o mais longo de propósito, e não é capricho de
           texto: é ele que dá RESPIRO VERTICAL ao gatilho. Com um comentário
           curto aqui o gatilho nascia a 134px do topo da janela e o painel, que
           abre acima dele, tinha 56px de folga; rolar 60px punha o painel fora
           da janela e a lib VIRAVA o cartão para baixo. Virar é reposicionar
           certo, mas o passo mede o deslocamento e o flip o descaracteriza.
           Medido em 2026-09-18, nesta story: gatilho -60px, painel +42px, lado
           top → bottom. -->
      <p class="nds-text-body">
        A última rodada de testes com pessoas usuárias apontou duas telas em que o resumo some
        antes da hora. Vale revisar antes de fechar a sprint, porque as duas aparecem no fluxo
        de entrada e é lá que a maior parte das pessoas chega pela primeira vez.
      </p>

      <p class="nds-text-body">
        Comentário de
        <HoverCard bind:open>
          <HoverCardTrigger>
            {#snippet child({ props })}
              <a
                href="/users/joana"
                class="nds-text-primary nds-font-medium nds-hover-underline"
                {...props}>@joana</a
              >
            {/snippet}
          </HoverCardTrigger>
          <HoverCardContent>
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
                <p class="nds-text-caption nds-text-muted-foreground">
                  Designer · 142 seguidores
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>

      <p class="nds-text-body">
        Concordo com a primeira parte. A segunda depende de a equipe de conteúdo confirmar o
        texto novo, que ainda está em revisão.
      </p>

      <p class="nds-text-body">
        Deixei as duas telas anotadas no arquivo compartilhado, com a gravação da sessão ao
        lado de cada uma.
      </p>
    </div>
  </div>

  <p class="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
    Estado externo: {open ? 'aberto' : 'fechado'}
  </p>
</div>
