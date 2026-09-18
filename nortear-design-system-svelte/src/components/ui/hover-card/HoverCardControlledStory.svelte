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
            <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
    há 2 horas.
  </p>

  <p class="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
    Estado externo: {open ? 'aberto' : 'fechado'}
  </p>
</div>
