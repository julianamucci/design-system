import { describe, expect, it } from 'vitest';
import {
  tooltipOpenSource,
  tooltipControlledSource,
  tooltipSource,
  tooltipPlacementSidesSource,
  tooltipCollisionSource,
  tooltipFormFieldHelpSource,
  tooltipMetricDescriptionSource,
  tooltipGroupWaitSource,
} from './tooltip.source';

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
    expect(tooltipSource('', { args: { delayDuration: 600 } })).toContain(
      '<TooltipProvider delayDuration={600}>',
    );
  });

  it('a espera só entra no snippet quando difere do padrão de 300 ms', () => {
    // O padrão sai: escrever `delayDuration={300}` é repetir o default.
    expect(tooltipSource('', { args: { delayDuration: 300 } })).toContain('<TooltipProvider>');
    // E o ZERO entra, que é o caso que a mudança de 2026-09-12 destravou:
    // enquanto o padrão era zero, `delayDuration ? …` omitia os dois casos pelo
    // mesmo teste de falsy, e a story que desliga a espera mostrava um snippet
    // sem ela — indistinguível do padrão.
    expect(tooltipSource('', { args: { delayDuration: 0 } })).toContain(
      '<TooltipProvider delayDuration={0}>',
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
  });

  it('o texto longo tem gatilho de TEXTO, sem ícone e sem import órfão', () => {
    const saida = tooltipSource('', {
      args: {
        variant: 'longText',
        triggerLabel: 'Compartilhar',
        contentText: 'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo',
      },
    });
    // A tag INTEIRA: asserção por pedaço já aprovou markup errado nesta campanha.
    expect(saida).toContain('        <Button variant="outline" {...props}>Compartilhar</Button>');
    expect(saida).toContain(
      '\n      Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo\n    ',
    );
    // Import órfão é código que não compila na mão de quem copia.
    expect(saida).not.toContain('@lucide/svelte/icons');
    expect(saida).not.toContain('aria-label');
  });

  it('o nome acessível do gatilho vem do control, e não do balão', () => {
    expect(tooltipSource('', { args: { ariaLabel: 'Compartilhar link' } })).toContain(
      'aria-label="Compartilhar link"',
    );
  });
});

describe('transforms das stories de abertura', () => {
  it('o balão aberto por padrão usa o estado inicial, sem estado externo', () => {
    const saida = tooltipOpenSource();
    expect(saida).toContain('<Tooltip defaultOpen>');
    expect(saida).not.toContain('$state');
  });

  it('o controlado liga a abertura a um estado local', () => {
    const saida = tooltipControlledSource();
    expect(saida).toContain('let aberto = $state(true);');
    expect(saida).toContain('<Tooltip bind:open={aberto}>');
  });
});

describe('transforms das stories de posicionamento e de grupo', () => {
  it('os quatro lados saem de uma lista declarada no próprio exemplo', () => {
    const saida = tooltipPlacementSidesSource();
    // O `{#each}` só resolve se a lista viajar DENTRO do snippet: uma constante
    // do módulo fica para trás na mão de quem copia.
    expect(saida).toContain('const SIDES = [');
    expect(saida).toContain('{#each SIDES as item (item.side)}');
    expect(saida).toContain('<TooltipContent side={item.side}>');
  });

  it('o exemplo dos lados ensina UM provedor, e não o andaime da cena', () => {
    const saida = tooltipPlacementSidesSource();
    // A story dá um provedor a cada balão para mostrar os quatro abertos ao
    // mesmo tempo — andaime de regressão visual. Em produção o provedor é
    // único, e a abertura vem do ponteiro ou do foco.
    expect(saida.match(/<TooltipProvider/g)).toHaveLength(1);
    expect(saida).not.toContain('defaultOpen');
  });

  it('a colisão não se configura — o que o snippet ensina é que o lado é preferência', () => {
    const saida = tooltipCollisionSource();
    expect(saida).toContain('<TooltipContent side="top">');
    // Fuga de colisão é o padrão: um exemplo que ligasse alguma coisa ensinaria
    // que ela precisa ser ligada.
    expect(saida).not.toContain('avoidCollisions');
    expect(saida).toContain('data-side');
  });

  it('a ajuda do campo nomeia o ícone e deixa o rótulo com o campo', () => {
    const saida = tooltipFormFieldHelpSource();
    // O `for`/`id` é o que mantém o rótulo ligado ao CAMPO: trocar isso pelo
    // balão deixaria o input sem nome em touch, onde não há ponteiro.
    expect(saida).toContain('<label for="api-token"');
    expect(saida).toContain('id="api-token"');
    expect(saida).toContain('aria-label="Ajuda sobre Token de API"');
  });

  it('a descrição de métrica define a sigla que o cabeçalho abrevia', () => {
    const saida = tooltipMetricDescriptionSource();
    expect(saida).toContain('aria-label="O que é LCP"');
    expect(saida).toContain('Largest Contentful Paint');
  });

  it('a espera de grupo publica os DOIS números, que só se leem juntos', () => {
    const saida = tooltipGroupWaitSource();
    expect(saida).toContain('<TooltipProvider delayDuration={600} skipDelayDuration={1000}>');
    expect(saida).toContain('const ACTIONS = [');
    expect(saida).toContain('{#each ACTIONS as action (action.id)}');
    expect(saida).toContain('aria-label={action.label}');
  });
});
