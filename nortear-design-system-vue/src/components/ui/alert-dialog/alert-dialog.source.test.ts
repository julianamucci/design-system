import { describe, expect, it } from 'vitest';
import {
  alertDialogAbertoSource,
  alertDialogCanceladoSource,
  alertDialogClasseExtraSource,
  alertDialogComIconeSource,
  alertDialogConfirmadoSource,
  alertDialogControladoSource,
  alertDialogDescricaoLongaSource,
  alertDialogDestructiveSource,
  alertDialogClosedSource,
  alertDialogNeutroSource,
  alertDialogSemDescricaoSource,
  alertDialogSource,
} from './alert-dialog.source';

describe('alertDialogSource', () => {
  it('sem args, entrega a composição canônica de confirmação destrutiva', () => {
    expect(alertDialogSource()).toBe(
      `<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="destructive">Excluir conta</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir conta</AlertDialogTitle>
        <AlertDialogDescription>Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>`,
    );
  });

  it('não escreve os padrões da raiz', () => {
    const saida = alertDialogSource('', { args: { defaultOpen: false, unmountOnHide: true } });
    expect(saida).toContain('<AlertDialog>');
    expect(saida).not.toContain('default-open');
    expect(saida).not.toContain('unmount-on-hide');
  });

  it('o que difere do padrão entra, cada booleano na sua forma', () => {
    const saida = alertDialogSource('', { args: { defaultOpen: true, unmountOnHide: false } });
    expect(saida).toContain('<AlertDialog default-open :unmount-on-hide="false">');
  });

  it('o tom neutro apaga a variante do gatilho e da ação', () => {
    const saida = alertDialogSource('', { args: { tone: 'default' } });
    expect(saida).not.toContain('variant=');
  });

  it('o bloco de mídia entra pelo control, como primeiro filho do cabeçalho', () => {
    const saida = alertDialogSource('', { args: { showMedia: true } });
    expect(saida).toContain('AlertDialogMedia');
    expect(saida).toContain(`import { TriangleAlert } from 'lucide-vue-next'`);
    expect(saida).toContain(
      `        <AlertDialogMedia>
          <TriangleAlert aria-hidden="true" />
        </AlertDialogMedia>
        <AlertDialogTitle>`,
    );
  });

  it('sem mídia, nem o subcomponente nem o ícone entram no import', () => {
    const saida = alertDialogSource('', { args: { showMedia: false } });
    expect(saida).not.toContain('AlertDialogMedia');
    expect(saida).not.toContain('lucide-vue-next');
  });

  it('os rótulos de demonstração viram texto do exemplo', () => {
    const saida = alertDialogSource('', {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        description: 'O projeto sai da lista ativa.',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(saida).toContain('>Arquivar projeto</Button>');
    expect(saida).toContain('<AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>');
    expect(saida).toContain('<AlertDialogCancel>Voltar</AlertDialogCancel>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = alertDialogSource('', {
      args: {
        tone: (() => {}) as never,
        triggerLabel: (() => {}) as never,
        title: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('[object Object]');
    expect(saida).toBe(alertDialogSource());
  });
});

describe('transforms das stories de estado', () => {
  it('o fechado não declara abertura nenhuma: só o gatilho está na tela', () => {
    const saida = alertDialogClosedSource();
    expect(saida).toContain('<AlertDialog>');
    expect(saida).not.toContain('default-open');
    expect(saida).toContain('<AlertDialogTrigger as-child>');
  });

  it('o aberto vem de um atributo na raiz, não de clique na play', () => {
    expect(alertDialogAbertoSource()).toContain('<AlertDialog default-open>');
  });

  it('o confirmado põe o handler na ação, e o fechamento não é escrito', () => {
    const saida = alertDialogConfirmadoSource();
    expect(saida).toContain('<AlertDialogAction variant="destructive" @click="excluirItem">');
    expect(saida).toContain('function excluirItem() {');
    // Quem fecha é o componente: escrever um fechamento manual ensinaria a
    // duplicar o que já acontece.
    expect(saida).not.toContain('open = false');
  });

  it('o cancelado dá handler às duas saídas, e a ação não roda por ele', () => {
    const saida = alertDialogCanceladoSource();
    expect(saida).toContain('<AlertDialogCancel @click="aoDesistir">Cancelar</AlertDialogCancel>');
    expect(saida).toContain('function aoDesistir() {');
    // A story não renderiza gatilho: o painel nasce aberto.
    expect(saida).not.toContain('AlertDialogTrigger');
  });

  it('o controlado leva o estado e o gatilho para fora do componente', () => {
    const saida = alertDialogControladoSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain(':open="aberto"');
    expect(saida).toContain('@update:open="aberto = $event"');
    expect(saida).toContain('<Button variant="destructive" @click="aberto = true">');
    // O gatilho do componente não convive com o botão externo neste modo.
    expect(saida).not.toContain('AlertDialogTrigger');
  });
});

describe('transforms das stories de composição', () => {
  it('a ordem do rodapé é Cancelar antes da ação em toda composição', () => {
    const funcoes = [
      alertDialogComIconeSource,
      alertDialogDestructiveSource,
      alertDialogNeutroSource,
      alertDialogSemDescricaoSource,
      alertDialogClasseExtraSource,
    ];
    for (const fn of funcoes) {
      const saida = fn();
      expect(saida.indexOf('<AlertDialogCancel')).toBeLessThan(
        saida.indexOf('<AlertDialogAction'),
      );
    }
  });

  it('o gatilho veste o botão em vez de embrulhá-lo', () => {
    // Botão dentro de botão não é marcação válida, e o foco iria para o de fora.
    expect(alertDialogDestructiveSource()).toContain(
      `    <AlertDialogTrigger as-child>
      <Button variant="destructive">Excluir conta</Button>
    </AlertDialogTrigger>`,
    );
  });

  it('a confirmação neutra não pinta nada de destrutivo', () => {
    const saida = alertDialogNeutroSource();
    expect(saida).not.toContain('destructive');
    expect(saida).toContain('<Button variant="outline">Sair da conta</Button>');
    expect(saida).toContain('<AlertDialogAction>Sair</AlertDialogAction>');
  });

  it('a descrição longa quebra em bloco, e não numa linha só', () => {
    const saida = alertDialogDescricaoLongaSource();
    expect(saida).toContain(
      `        <AlertDialogDescription>
          Todos os seus dados, arquivos enviados, integrações ativas e o histórico`,
    );
    expect(saida).toContain('        </AlertDialogDescription>');
  });

  it('sem descrição, o subcomponente some do import junto com a marcação', () => {
    const saida = alertDialogSemDescricaoSource();
    expect(saida).not.toContain('AlertDialogDescription');
    // Nada de atributo escrito à mão para compensar: o painel deixa de anunciar
    // descrição sozinho.
    expect(saida).not.toContain('aria-describedby');
    expect(saida).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('a classe extra é de LAYOUT, no painel e no bloco de mídia', () => {
    const saida = alertDialogClasseExtraSource();
    expect(saida).toContain('<AlertDialogContent class="nds-overflow-hidden">');
    expect(saida).toContain('<AlertDialogMedia class="nds-shrink-0">');
    // Largura máxima e espaçamento do painel não são extensíveis por classe: o
    // CSS do componente é carregado depois e vence no empate.
    expect(saida).not.toContain('nds-max-w');
  });

  it('o ícone da mídia é decorativo — quem nomeia o painel é o título', () => {
    const saida = alertDialogComIconeSource();
    expect(saida).toContain('<TriangleAlert aria-hidden="true" />');
    expect(saida).not.toContain('aria-label');
  });
});
