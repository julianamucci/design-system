import { describe, expect, it } from 'vitest';
import {
  sheetAbertoSource,
  sheetControladoSource,
  sheetEditPerfilSource,
  sheetClosedSource,
  sheetFiltrosAvancadosSource,
  sheetFormLongSource,
  sheetSideDireitoSource,
  sheetLadoEsquerdoSource,
  sheetLadoInferiorSource,
  sheetLadoSuperiorSource,
  sheetNavigationSecundariaSource,
  sheetPlaygroundSource,
  sheetSemBotaoFecharSource,
} from './sheet.source';

describe('sheetPlaygroundSource', () => {
  it('sem args, entrega a forma canônica do painel', () => {
    expect(sheetPlaygroundSource()).toBe(
      `<script setup lang="ts">
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline">Abrir filtros</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Filtros avançados</SheetTitle>
        <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <SheetClose as-child>
          <Button variant="outline">Cancelar</Button>
        </SheetClose>
        <Button>Aplicar filtros</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>`,
    );
  });

  it('o lado mora no conteúdo, nunca na raiz', () => {
    const saida = sheetPlaygroundSource('', { args: { side: 'left' } });
    expect(saida).toContain('<SheetContent side="left">');
    expect(saida).toContain('<Sheet>');
  });

  it('não escreve os padrões — repetir valor padrão ensina ruído', () => {
    const saida = sheetPlaygroundSource('', {
      args: { side: 'right', showCloseButton: true, modal: true, defaultOpen: false },
    });
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('show-close-button');
    expect(saida).not.toContain('modal');
    expect(saida).not.toContain('default-open');
  });

  it('desliga o que nasce ligado e liga o que nasce desligado', () => {
    const saida = sheetPlaygroundSource('', {
      args: { showCloseButton: false, modal: false, defaultOpen: true },
    });
    expect(saida).toContain('<Sheet default-open :modal="false">');
    expect(saida).toContain('<SheetContent :show-close-button="false">');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(sheetPlaygroundSource('', { args: { triggerLabel: 'Abrir preferências' } })).toContain(
      '<Button variant="outline">Abrir preferências</Button>',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = sheetPlaygroundSource('', {
      args: { onOpenChange: () => {}, triggerLabel: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('@update:open');
    // O rótulo cai no padrão em vez de interpolar o espião.
    expect(saida).toContain('<Button variant="outline">Abrir filtros</Button>');
  });
});

describe('transforms das stories de direção', () => {
  it('a direita é o padrão, e por ser padrão a prop não aparece', () => {
    const saida = sheetSideDireitoSource();
    expect(saida).toContain('<SheetContent>');
    expect(saida).not.toContain('side=');
    expect(saida).toContain('<SheetTitle>Painel direito</SheetTitle>');
  });

  it('cada outra direção escreve o próprio lado, e no conteúdo', () => {
    expect(sheetLadoEsquerdoSource()).toContain('<SheetContent side="left">');
    expect(sheetLadoSuperiorSource()).toContain('<SheetContent side="top">');
    expect(sheetLadoInferiorSource()).toContain('<SheetContent side="bottom">');
  });

  it('as quatro nascem abertas — é o que explica a imagem ao lado do snippet', () => {
    for (const fn of [
      sheetSideDireitoSource,
      sheetLadoEsquerdoSource,
      sheetLadoSuperiorSource,
      sheetLadoInferiorSource,
    ]) {
      expect(fn()).toContain('<Sheet default-open>');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é a ausência de default-open, e sobra só o gatilho', () => {
    const saida = sheetClosedSource();
    expect(saida).toContain('<Sheet>');
    expect(saida).not.toContain('default-open');
    // Fechado o painel nem chega ao DOM: não há rodapé a mostrar.
    expect(saida).not.toContain('SheetFooter');
  });

  it('aberto é a mesma composição com a prop ligada', () => {
    const saida = sheetAbertoSource();
    expect(saida).toContain('<Sheet default-open>');
    expect(saida).toContain('<SheetTrigger as-child>');
  });

  it('sem o botão do canto, a saída passa a ser o rodapé', () => {
    const saida = sheetSemBotaoFecharSource();
    expect(saida).toContain('<SheetContent :show-close-button="false">');
    expect(saida).toContain('<Button variant="outline">Mais tarde</Button>');
    // Não há gatilho nesta composição: o painel monta aberto.
    expect(saida).not.toContain('SheetTrigger');
  });

  it('o controlado liga o valor de fora e devolve cada mudança', () => {
    const saida = sheetControladoSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // Controlado e não-controlado não convivem: `default-open` seria ignorado.
    expect(saida).not.toContain('default-open');
  });
});

describe('transforms das stories de composição', () => {
  it('o corpo rolável é SheetBody, e ele é o que segura o rodapé', () => {
    const saida = sheetFiltrosAvancadosSource();
    expect(saida).toContain('<SheetBody>');
    expect(saida).toContain('  SheetBody,\n');
    expect(saida).toContain('<Input id="cat" default-value="Componentes" />');
    // O rótulo se liga ao campo pelo id, e não por proximidade visual.
    expect(saida).toContain('<Label for="cat">Categoria</Label>');
  });

  it('a edição de perfil embrulha os campos num form e confirma por submit', () => {
    const saida = sheetEditPerfilSource();
    expect(saida).toContain('<form class="nds-grid" data-spacing="sm">');
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
  });

  it('a navegação secundária abre à esquerda e não tem rodapé', () => {
    const saida = sheetNavigationSecundariaSource();
    expect(saida).toContain('<SheetContent side="left">');
    expect(saida).toContain('<nav class="nds-stack" data-spacing="xs" aria-label="Seções">');
    expect(saida).not.toContain('SheetFooter');
    // Sem botão nenhum, o import do Button seria import morto no exemplo.
    expect(saida).not.toContain('@/components/ui/button');
  });

  it('o formulário longo repete campos para que haja o que rolar', () => {
    const saida = sheetFormLongSource();
    expect(saida).toContain('<div v-for="i in 12" :key="i"');
    expect(saida).toContain('<Label :for="`notif-${i}`">Categoria {{ i }}</Label>');
    expect(saida).toContain('<SheetBody>');
  });
});
