<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from './index';

  // Os quatro lados de abertura numa grade só. Fica num componente separado do
  // `HoverCardStory` porque aqui são QUATRO cartões na mesma tela — é o cenário
  // que revela nome acessível resolvido pelo gatilho errado quando a associação
  // vem de um seletor de documento em vez do contexto.
  const LADOS = [
    { rotulo: 'acima', side: 'top' as const },
    { rotulo: 'abaixo', side: 'bottom' as const },
    { rotulo: 'esquerda', side: 'left' as const },
    { rotulo: 'direita', side: 'right' as const },
  ];

  const CLASSES_BOTAO =
    'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';
</script>

<div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
  {#each LADOS as lado (lado.side)}
    <p class="nds-text-body nds-p-8">
      Abre
      <HoverCard open={true}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <button type="button" class={CLASSES_BOTAO} {...props}>{lado.rotulo}</button>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent side={lado.side} aria-label={`Cartão ${lado.rotulo} do gatilho`}>
          <p class="nds-text-caption">Lado preferido: {lado.rotulo}.</p>
        </HoverCardContent>
      </HoverCard>
      do gatilho.
    </p>
  {/each}
</div>
