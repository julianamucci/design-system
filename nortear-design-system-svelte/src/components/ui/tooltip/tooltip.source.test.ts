import { describe, expect, it } from 'vitest';
import { tooltipAbertoSource, tooltipControladoSource, tooltipSource } from './tooltip.source';

describe('tooltipSource', () => {
  it('sem args, entrega o gatilho só de ícone com o balão complementar', () => {
    expect(tooltipSource()).toBe(
      `<script lang="ts">
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
  import { Button } from "@/components/ui/button";
  import Save from "@lucide/svelte/icons/save";
</script>

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
          <Save aria-hidden="true" class="nds-size-4" />
        </Button>
      {/snippet}
    </TooltipTrigger>
    <TooltipContent sideOffset={4}>Salvar (Ctrl+S)</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
    );
  });

  it('a abertura não entra no snippet canônico — ela é assunto de duas stories', () => {
    expect(tooltipSource()).not.toContain('defaultOpen');
    expect(tooltipSource()).not.toContain('bind:open');
  });

  it('só escreve side e align quando o valor difere do padrão', () => {
    expect(tooltipSource()).not.toContain('side=');
    expect(tooltipSource()).not.toContain('align');
    expect(tooltipSource('', { args: { side: 'bottom' } })).toContain('side="bottom"');
    expect(tooltipSource('', { args: { align: 'start' } })).toContain('align="start"');
  });

  it('o afastamento some quando é zero, que é o padrão do conteúdo', () => {
    expect(tooltipSource('', { args: { sideOffset: 0 } })).not.toContain('sideOffset');
    expect(tooltipSource('', { args: { sideOffset: 8 } })).toContain('sideOffset={8}');
  });

  it('a espera é declarada no Provider, que a compartilha entre os vizinhos', () => {
    expect(tooltipSource()).toContain('<TooltipProvider>');
    expect(tooltipSource('', { args: { delayDuration: 300 } })).toContain(
      '<TooltipProvider delayDuration={300}>',
    );
  });

  it('o atalho vai em kbd, e sai do texto para não aparecer duas vezes', () => {
    const saida = tooltipSource('', { args: { variant: 'withShortcut' } });
    expect(saida).toContain('<span>Salvar</span>');
    expect(saida).toContain('<kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>');
    expect(saida).not.toContain('(Ctrl+S)');
  });

  it('o texto longo ganha corpo próprio em vez de esticar a linha', () => {
    const saida = tooltipSource('', {
      args: {
        contentText:
          'Compartilhe o link público desta página com qualquer pessoa — o conteúdo pode ser visualizado sem login.',
      },
    });
    expect(saida).toContain('\n      Compartilhe o link público');
    expect(saida).toContain('\n    </TooltipContent>');
  });

  it('o ícone do gatilho acompanha a ação que ele representa', () => {
    expect(tooltipSource('', { args: { triggerLabel: 'Excluir' } })).toContain(
      'import Trash2 from "@lucide/svelte/icons/trash-2";',
    );
    expect(tooltipSource('', { args: { variant: 'longText' } })).toContain(
      'import Share2 from "@lucide/svelte/icons/share-2";',
    );
  });

  it('o nome acessível do gatilho vem do control, e não do balão', () => {
    expect(tooltipSource('', { args: { ariaLabel: 'Compartilhar link' } })).toContain(
      'aria-label="Compartilhar link"',
    );
  });
});

describe('transforms das stories de abertura', () => {
  it('o balão aberto por padrão usa o estado inicial, sem estado externo', () => {
    const saida = tooltipAbertoSource();
    expect(saida).toContain('<Tooltip defaultOpen>');
    expect(saida).not.toContain('$state');
  });

  it('o controlado liga a abertura a um estado local', () => {
    const saida = tooltipControladoSource();
    expect(saida).toContain('let aberto = $state(true);');
    expect(saida).toContain('<Tooltip bind:open={aberto}>');
  });
});
