<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';
</script>

<!--
  O gatilho ENCOSTADO na borda de cima da janela — é a cena que força a virada.

  Prender por coordenada (`position: fixed` com `inset-block-start: 0`), e não
  por um espaçador acima, é o que torna a cena independente do tamanho da
  janela: com o gatilho a zero pixel do topo não existe tamanho de tela em que
  o balão caiba acima dele, então `side="top"` SEMPRE vira para `bottom`. Um
  espaçador deixaria a virada depender da altura da janela do teste, que é
  justamente o que faz asserção de lado passar sem provar nada.

  Nenhuma das declarações inline é valor de design: `position`, `inset-*` e
  `place-items` são geometria da cena, e a medida que sobrou (`nds-min-h-40`)
  vem da folha.
-->
<div class="nds-min-h-40 nds-w-full">
  <div style="position: fixed; inset-block-start: 0; inset-inline: 0">
    <div class="nds-cluster nds-w-full" data-justify="center" data-align="center">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Sem espaço acima</Button>
            {/snippet}
          </TooltipTrigger>
          <!-- `side="top"` é o lado PEDIDO. O lado final é o que o `data-side`
               publicar, e a play exige que ele seja o oposto. -->
          <TooltipContent side="top">Viro para baixo sozinho</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</div>
