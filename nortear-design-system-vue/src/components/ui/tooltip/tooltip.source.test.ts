import { describe, expect, it } from 'vitest';
import {
  tooltipOpenSource,
  actionsTooltipBarSource,
  tooltipButtonIconSource,
  tooltipWithShortcutSource,
  tooltipWithWaitSource,
  tooltipControlledSource,
  tooltipClosedSource,
  tooltipPersistenteSource,
  tooltipQuatroLadosSource,
  tooltipSource,
  tooltipTextCurtoSource,
  tooltipTextLongSource,
} from './tooltip.source';

describe('tooltipSource', () => {
  it('sem args, entrega a forma canônica: Provider, gatilho nomeado e balão', () => {
    expect(tooltipSource()).toBe(
      `<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Save } from 'lucide-vue-next'
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="outline" size="icon" aria-label="Salvar">
          <Save aria-hidden="true" class="nds-size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>`,
    );
  });

  it('não escreve os valores padrão de posicionamento nem de abertura', () => {
    const saida = tooltipSource('', { args: { side: 'top', align: 'center', defaultOpen: false } });
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
    expect(saida).not.toContain('default-open');
    // A espera padrão já vem do design system: declará-la ensinaria que a prop
    // é obrigatória.
    expect(saida).toContain('<TooltipProvider>');
  });

  it('os controls que diferem do padrão chegam ao balão e à raiz', () => {
    const saida = tooltipSource('', { args: { side: 'right', align: 'start', defaultOpen: true } });
    expect(saida).toContain('<Tooltip default-open>');
    expect(saida).toContain('<TooltipContent side="right" align="start">');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = tooltipSource('', {
      args: { side: (() => {}) as never, align: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
  });

  it('o nome acessível é do BOTÃO, e o ícone sai da árvore de acessibilidade', () => {
    const saida = tooltipSource();
    expect(saida).toContain('<Button variant="outline" size="icon" aria-label="Salvar">');
    expect(saida).toContain('<Save aria-hidden="true" class="nds-size-4" />');
    // `as-child` é o que faz o gatilho reaproveitar o botão em vez de embrulhá-lo
    // num segundo elemento focável.
    expect(saida).toContain('<TooltipTrigger as-child>');
  });
});

describe('transforms das stories de variante', () => {
  it('o texto curto cabe em linha, dentro do próprio balão', () => {
    expect(tooltipTextCurtoSource()).toContain('<TooltipContent side="bottom">Salvar</TooltipContent>');
  });

  it('o atalho vai em Kbd, e o balão vira bloco para caber a estrutura', () => {
    const saida = tooltipWithShortcutSource();
    expect(saida).toContain(`import { Kbd } from '@/components/ui/kbd'`);
    expect(saida).toContain(`        <span>Salvar</span>
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>`);
    // Solto no texto o atalho perderia a tecla que a folha compartilhada
    // reconhece pelo componente.
    expect(saida).not.toContain('Salvar (Ctrl+S)');
  });

  it('o texto longo troca o gatilho por um botão com rótulo visível', () => {
    const saida = tooltipTextLongSource();
    expect(saida).toContain('<Button variant="outline">Compartilhar</Button>');
    // Sem ícone não há o que importar da biblioteca de ícones.
    expect(saida).not.toContain('lucide-vue-next');
    expect(saida).not.toContain('aria-hidden');
    expect(saida).toContain('qualquer pessoa com o link vê o conteúdo');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado de partida não pede abertura nem lado', () => {
    const saida = tooltipClosedSource();
    expect(saida).not.toContain('default-open');
    expect(saida).not.toContain('side=');
    expect(saida).toContain('<TooltipContent>Salvar</TooltipContent>');
  });

  it('a abertura de saída é uma prop da raiz', () => {
    expect(tooltipOpenSource()).toContain('<Tooltip default-open>');
  });

  it('a espera mora no Provider, não na raiz do balão', () => {
    const saida = tooltipWithWaitSource();
    expect(saida).toContain('<TooltipProvider :delay-duration="600">');
    // Com espera declarada, abrir de saída apagaria justamente o que a story
    // mede: o intervalo entre chegar e abrir.
    expect(saida).not.toContain('default-open');
  });

  it('a persistência não tem prop a ligar — a tolerância já vem no componente', () => {
    const saida = tooltipPersistenteSource();
    expect(saida).toContain('<Button variant="outline">Compartilhar</Button>');
    expect(saida).not.toContain('hoverable');
    expect(saida).not.toContain('default-open');
  });

  it('o modo controlado leva o estado ao script e devolve a mudança à raiz', () => {
    const saida = tooltipControlledSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Tooltip :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // Dois botões, e não um que alterna: o clique fora já dispensa o balão antes
    // do `click`, e um alternador reabriria o que acabou de fechar.
    expect(saida).toContain('@click="aberto = true"');
    expect(saida).toContain('@click="aberto = false"');
    expect(saida).not.toContain('default-open');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição de referência é a mesma do texto curto', () => {
    expect(tooltipButtonIconSource()).toBe(tooltipTextCurtoSource());
  });

  it('a barra de ações serve cinco gatilhos com um Provider só', () => {
    const saida = actionsTooltipBarSource();
    expect(saida.match(/<Tooltip>/g)).toHaveLength(5);
    expect(saida.match(/<TooltipProvider>/g)).toHaveLength(1);
    expect(saida).toContain('role="toolbar"');
    expect(saida).toContain('aria-label="Ações do documento"');
    // Dentro de uma barra o botão perde o contorno próprio.
    expect(saida).toContain('<Button variant="ghost" size="icon" aria-label="Excluir">');
    expect(saida).toContain(
      `import { Save, Copy, Pencil, Share2, Trash2 } from 'lucide-vue-next'`,
    );
  });

  it('os quatro lados aparecem juntos, e o de cima dispensa a declaração', () => {
    const saida = tooltipQuatroLadosSource();
    expect(saida.match(/<Tooltip default-open>/g)).toHaveLength(4);
    for (const side of ['right', 'bottom', 'left']) {
      expect(saida).toContain(`<TooltipContent side="${side}">Tooltip ${side}</TooltipContent>`);
    }
    // O padrão não se escreve: a ausência é a lição de que o balão nasce em cima.
    expect(saida).not.toContain('side="top"');
    expect(saida).toContain('<TooltipContent>Tooltip top</TooltipContent>');
    expect(saida).toContain('<div class="nds-grid nds-p-8" data-spacing="xl" data-cols="2">');
  });
});
