import { describe, expect, it } from 'vitest';
import {
  drawerAbertoSource,
  drawerBaixoSource,
  drawerComConfirmacaoSource,
  drawerComFormularioSource,
  drawerComRolagemSource,
  drawerControladoSource,
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerFechadoSource,
  drawerNaoDispensavelSource,
  drawerSource,
  drawerTopoSource,
} from './drawer.source';

describe('drawerSource', () => {
  it('sem args, entrega a forma canônica: gatilho, cabeçalho, corpo e ações', () => {
    expect(drawerSource()).toBe(
      `<script setup lang="ts">
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Drawer>
    <DrawerTrigger as-child>
      <Button variant="outline">Abrir drawer</Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Editar perfil</DrawerTitle>
        <DrawerDescription>Atualize seus dados pessoais e foto.</DrawerDescription>
      </DrawerHeader>
      <DrawerBody class="nds-text-body nds-text-muted-foreground">
        Conteúdo do drawer.
      </DrawerBody>
      <DrawerFooter>
        <Button>Confirmar</Button>
        <DrawerClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>`,
    );
  });

  it('não repete o `<div>` de contenção que só existe para o quadro do Storybook', () => {
    // Andaime da story: no produto o drawer portaliza para o `body` e não
    // precisa de contêiner nenhum em volta.
    expect(drawerSource()).not.toContain('contain');
    expect(drawerSource()).not.toContain('style=');
  });

  it('os três padrões da raiz ficam fora do snippet', () => {
    const saida = drawerSource('', {
      args: { direction: 'bottom', defaultOpen: false, dismissible: true, modal: true },
    });
    expect(saida).toContain('  <Drawer>\n');
    expect(saida).not.toContain('direction=');
    expect(saida).not.toContain('dismissible');
    expect(saida).not.toContain('modal');
  });

  it('cada control que sai do padrão escreve a sua prop', () => {
    expect(drawerSource('', { args: { direction: 'right' } })).toContain(
      '<Drawer direction="right">',
    );
    expect(drawerSource('', { args: { dismissible: false, modal: false } })).toContain(
      '<Drawer :dismissible="false" :modal="false">',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:open` é `fn()` no meta: interpolado direto, o corpo do mock
    // apareceria no painel como se fosse o exemplo.
    const saida = drawerSource('', {
      args: { direction: (() => {}) as never, dismissible: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).toContain('  <Drawer>\n');
  });
});

describe('transforms das stories de direção', () => {
  it('a direção padrão não é escrita; as outras três são', () => {
    expect(drawerBaixoSource()).not.toContain('direction=');
    expect(drawerTopoSource()).toContain('<Drawer direction="top">');
    expect(drawerEsquerdaSource()).toContain('<Drawer direction="left">');
    expect(drawerDireitaSource()).toContain('<Drawer direction="right">');
  });

  it('cada direção traz o texto do caso que ela serve', () => {
    expect(drawerEsquerdaSource()).toContain('<DrawerTitle>Menu</DrawerTitle>');
    expect(drawerDireitaSource()).toContain('<DrawerTitle>Filtros</DrawerTitle>');
    // O gatilho volta em todas: a story abre por `default-open` para a foto do
    // Chromatic, mas quem copia precisa de um caminho de entrada.
    expect(drawerTopoSource()).toContain('<DrawerTrigger as-child>');
    expect(drawerTopoSource()).not.toContain('default-open');
  });
});

describe('transforms das stories de estado', () => {
  it('o fechado é a forma canônica sem corpo, e o gatilho é a única entrada', () => {
    const saida = drawerFechadoSource();
    expect(saida).toContain('<DrawerTrigger as-child>');
    expect(saida).not.toContain('DrawerBody');
    expect(saida).not.toContain('default-open');
  });

  it('só a story da montagem aberta escreve `default-open`, e ela dispensa o gatilho', () => {
    const saida = drawerAbertoSource();
    expect(saida).toContain('<Drawer default-open>');
    // Não há o que clicar: o painel já está na tela quando a página monta.
    expect(saida).not.toContain('DrawerTrigger');
  });

  it('o controlado liga o par prop+evento e põe os botões do lado de fora', () => {
    const saida = drawerControladoSource();
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Drawer :open="aberto" @update:open="aberto = $event">');
    expect(saida).toContain('<Button @click="aberto = true">Abrir via estado externo</Button>');
    expect(saida).not.toContain('DrawerTrigger');
  });

  it('sem dispensa por gesto, a saída explícita do rodapé continua no snippet', () => {
    const saida = drawerNaoDispensavelSource();
    expect(saida).toContain('<Drawer :dismissible="false">');
    // Escape e clique no overlay deixam de fechar: tirar a saída do rodapé
    // junto deixaria o painel sem fechamento alcançável por teclado.
    expect(saida).toContain('<Button variant="outline">Recusar</Button>');
    expect(saida).toContain('<DrawerClose as-child>');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação primária do drawer vem PRIMEIRO no rodapé', () => {
    // É o inverso do Dialog, e de propósito: o rodapé empilha em coluna na tela
    // estreita, e a ação principal fica no alto da pilha.
    const saida = drawerComFormularioSource();
    const confirmar = saida.indexOf('Confirmar');
    const cancelar = saida.indexOf('Cancelar');
    expect(confirmar).toBeGreaterThan(-1);
    expect(confirmar).toBeLessThan(cancelar);
  });

  it('o formulário liga rótulo e campo pelo par for/id', () => {
    const saida = drawerComFormularioSource();
    expect(saida).toContain('<Label for="drawer-email">E-mail</Label>');
    expect(saida).toContain('<Input id="drawer-email" type="email"');
    expect(saida).toContain(`import { Label } from '@/components/ui/label'`);
  });

  it('a confirmação marca a ação principal e dispensa o corpo', () => {
    const saida = drawerComConfirmacaoSource();
    expect(saida).toContain('<Button variant="destructive">Remover</Button>');
    expect(saida).not.toContain('DrawerBody');
    // A consequência está escrita, não subentendida.
    expect(saida).toContain('Você pode adicioná-lo novamente depois.');
  });

  it('a rolagem enche o CORPO, e não o painel', () => {
    const saida = drawerComRolagemSource();
    expect(saida).toContain('const clausulas = [');
    expect(saida).toContain(
      '      <p v-for="(clausula, i) in clausulas" :key="i">{{ clausula }}</p>',
    );
    // O rodapé com as ações continua fora da área que rola.
    expect(saida).toContain('    <DrawerFooter>');
    // `tabindex` e `overflow` são do próprio DrawerBody: escrevê-los aqui
    // ensinaria uma prop que não existe.
    expect(saida).not.toContain('tabindex');
    expect(saida).not.toContain('overflow');
  });
});
