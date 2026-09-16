<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';

  // Os quatro lados numa cena só. Antes eram quatro stories, uma por lado:
  // comparar os lados exigia trocar de página, e a regressão visual guardava
  // quatro fotos de uma lição só.
  //
  // UM PROVEDOR POR BALÃO, e é mecanismo, não estilo: o provedor mantém UM
  // tooltip aberto por vez — ao abrir o segundo ele fecha o primeiro. Com um
  // provedor só, esta cena mostraria um balão e três gatilhos mudos. Em
  // produção o provedor é único, no root da app, e é isso que o painel Code
  // publica.
  //
  // A FOLGA É PARTE DA CENA, e é o que dá dentes à asserção de lado exato.
  // Medido em 2026-09-16 no react: no viewport do runner sobravam ~38 px acima
  // do gatilho contra ~29 px de balão, e a lib virava para baixo — corretamente.
  // Quem afirma o lado PEDIDO tem de garantir o espaço daquele lado, senão a
  // asserção honesta reprova por falta de sala e a desonesta (`[lado, oposto]`)
  // passa sempre. Aqui a folga vem de duas fontes:
  //
  //  · VERTICAL — `nds-min-h-100` (400 px), e o número é MEDIDO, não estimado:
  //    com a grade a 280 px sobravam ~36 px acima do gatilho, menos que os
  //    ~41 px que balão, seta e afastamento somam, e a lib virava para baixo —
  //    corretamente, reprovando a asserção honesta. A 400 px o lado pedido
  //    cabe. Foi o que reprovou no react antes de ser medido;
  //  · HORIZONTAL — a ordem das colunas. Quem pede `right` fica na segunda
  //    coluna, com a largura toda à direita; quem pede `left`, na última, com a
  //    largura toda à esquerda. Invertê-las devolveria o aperto.
  //
  // A fuga de colisão fica LIGADA, como em produção: a cena dá o espaço, a lib
  // decide, e o lado que sai é o pedido.
  const SIDES = [
    { side: 'top', label: 'Top' },
    { side: 'right', label: 'Right' },
    { side: 'bottom', label: 'Bottom' },
    { side: 'left', label: 'Left' },
  ] as const;
</script>

<div
  class="nds-grid nds-w-full nds-min-h-100"
  data-cols="4"
  data-spacing="xl"
  style="contain: layout; place-items: center"
>
  {#each SIDES as item (item.side)}
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <!-- Gatilho de TEXTO: o rótulo visível já é o nome acessível, e um
                 aria-label diferente dele quebraria a WCAG 2.5.3. -->
            <Button variant="outline" {...props}>{item.label}</Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent side={item.side}>
          Tooltip {item.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/each}
</div>
