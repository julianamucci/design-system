import { describe, expect, it } from 'vitest';
import {
  drawerOpenSource,
  drawerBaixoSource,
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerWithScrollSource,
  drawerControlledSource,
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerClosedSource,
  drawerNotDispensavelSource,
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
        <DrawerClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DrawerClose>
        <Button>Confirmar</Button>
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
    const saida = drawerClosedSource();
    expect(saida).toContain('<DrawerTrigger as-child>');
    expect(saida).not.toContain('DrawerBody');
    expect(saida).not.toContain('default-open');
  });

  it('só a story da montagem aberta escreve `default-open`, e ela dispensa o gatilho', () => {
    const saida = drawerOpenSource();
    expect(saida).toContain('<Drawer default-open>');
    // Não há o que clicar: o painel já está na tela quando a página monta.
    expect(saida).not.toContain('DrawerTrigger');
  });

  it('o controlado liga o par prop+evento e põe os botões do lado de fora', () => {
    const saida = drawerControlledSource();
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Drawer :open="aberto" @update:open="aberto = $event">');
    expect(saida).toContain('<Button @click="aberto = true">Abrir via estado externo</Button>');
    expect(saida).not.toContain('DrawerTrigger');
  });

  it('sem dispensa por gesto, a saída explícita do rodapé continua no snippet', () => {
    const saida = drawerNotDispensavelSource();
    expect(saida).toContain('<Drawer :dismissible="false">');
    // Escape e clique no overlay deixam de fechar: tirar a saída do rodapé
    // junto deixaria o painel sem fechamento alcançável por teclado.
    expect(saida).toContain('<Button variant="outline">Recusar</Button>');
    expect(saida).toContain('<DrawerClose as-child>');
  });
});

describe('transforms das stories de composição', () => {
  it('a saída vem PRIMEIRO no rodapé, e a ação primária depois', () => {
    // Regra transversal, a mesma do Dialog, do AlertDialog e do Sheet. Quem
    // resolve os dois eixos é a folha: abaixo de 40rem `.nds-drawer-footer`
    // empilha com `column-reverse` e a ação principal aparece no ALTO da pilha;
    // de 40rem para cima ela vira linha alinhada à direita, com a ação à
    // direita. A ordem de leitura e de tabulação continua sendo saída antes de
    // ação.
    //
    // Este caso já cobrou o contrário, quando a folha era `column` puro: ali o
    // primário no DOM primeiro era o que o punha embaixo na tela.
    const saida = drawerWithFormSource();
    const confirmar = saida.indexOf('Confirmar');
    const cancelar = saida.indexOf('Cancelar');
    expect(cancelar).toBeGreaterThan(-1);
    expect(cancelar).toBeLessThan(confirmar);
  });

  it('o formulário liga rótulo e campo pelo par for/id', () => {
    const saida = drawerWithFormSource();
    expect(saida).toContain('<Label for="drawer-email">E-mail</Label>');
    expect(saida).toContain('<Input id="drawer-email" type="email"');
    expect(saida).toContain(`import { Label } from '@/components/ui/label'`);
  });

  it('a confirmação é o ENVIO do formulário, religado pelo atributo form', () => {
    // O rodapé é irmão do corpo por construção do primitivo, então o botão fica
    // FORA do `form`: sem o par id ↔ `form`, um `type="submit"` ali é botão
    // inerte — não envia pelo clique nem pelo Enter num campo, continua clicável
    // e com a aparência certa, e nenhum type-checker das cinco stacks alcança.
    const saida = drawerWithFormSource();
    expect(saida).toContain('<form id="drawer-form" class="nds-grid" data-spacing="sm"');
    expect(saida).toContain('<Button type="submit" form="drawer-form">Confirmar</Button>');
    expect(saida).not.toContain('<Button type="submit">Confirmar</Button>');
    // O descartar não pode herdar `submit` do padrão do HTML.
    expect(saida).toContain('<Button type="button" variant="outline">Cancelar</Button>');
  });

  it('a confirmação marca a ação principal e dispensa o corpo', () => {
    const saida = drawerWithConfirmSource();
    expect(saida).toContain('<Button variant="destructive">Remover</Button>');
    expect(saida).not.toContain('DrawerBody');
    // A consequência está escrita, não subentendida.
    expect(saida).toContain('Você pode adicioná-lo novamente depois.');
  });

  it('a rolagem enche o CORPO, e não o painel', () => {
    const saida = drawerWithScrollSource();
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
