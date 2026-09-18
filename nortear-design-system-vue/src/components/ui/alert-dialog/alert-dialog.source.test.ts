import { describe, expect, it } from 'vitest';
import {
  alertDialogOpenSource,
  alertDialogCanceladoSource,
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogConfirmadoSource,
  alertDialogControlledSource,
  alertDialogDescriptionLongaSource,
  alertDialogDestructiveSource,
  alertDialogHeadingH3Source,
  alertDialogClosedSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
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
    const output = alertDialogSource('', { args: { defaultOpen: false, unmountOnHide: true } });
    expect(output).toContain('<AlertDialog>');
    expect(output).not.toContain('default-open');
    expect(output).not.toContain('unmount-on-hide');
  });

  it('o que difere do padrão entra, cada booleano na sua forma', () => {
    const output = alertDialogSource('', { args: { defaultOpen: true, unmountOnHide: false } });
    expect(output).toContain('<AlertDialog default-open :unmount-on-hide="false">');
  });

  it('o tom neutro apaga a variante do gatilho e da ação', () => {
    const output = alertDialogSource('', { args: { tone: 'default' } });
    expect(output).not.toContain('variant=');
  });

  it('o bloco de mídia entra pelo control, como primeiro filho do cabeçalho', () => {
    const output = alertDialogSource('', { args: { showMedia: true } });
    expect(output).toContain('AlertDialogMedia');
    expect(output).toContain(`import { TriangleAlert } from 'lucide-vue-next'`);
    expect(output).toContain(
      `        <AlertDialogMedia>
          <TriangleAlert aria-hidden="true" />
        </AlertDialogMedia>
        <AlertDialogTitle>`,
    );
  });

  it('sem mídia, nem o subcomponente nem o ícone entram no import', () => {
    const output = alertDialogSource('', { args: { showMedia: false } });
    expect(output).not.toContain('AlertDialogMedia');
    expect(output).not.toContain('lucide-vue-next');
  });

  it('os rótulos de demonstração viram texto do exemplo', () => {
    const output = alertDialogSource('', {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        description: 'O projeto sai da lista ativa.',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(output).toContain('>Arquivar projeto</Button>');
    expect(output).toContain('<AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>');
    expect(output).toContain('<AlertDialogCancel>Voltar</AlertDialogCancel>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = alertDialogSource('', {
      args: {
        tone: (() => {}) as never,
        triggerLabel: (() => {}) as never,
        title: (() => {}) as never,
      },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('[object Object]');
    expect(output).toBe(alertDialogSource());
  });
});

describe('transforms das stories de estado', () => {
  it('o fechado não declara abertura nenhuma: só o gatilho está na tela', () => {
    const output = alertDialogClosedSource();
    expect(output).toContain('<AlertDialog>');
    expect(output).not.toContain('default-open');
    expect(output).toContain('<AlertDialogTrigger as-child>');
  });

  it('o aberto é a confirmação canônica: o trecho não nasce aberto', () => {
    // A story abre na montagem para a captura; quem copia quer o diálogo
    // comandado pelo gatilho, não aberto sobre a página.
    expect(alertDialogOpenSource()).toBe(alertDialogSource());
    expect(alertDialogOpenSource()).toContain('<AlertDialog>');
    // E por isso igual ao fechado: o que separa os dois estados é o clique no
    // gatilho, que não se escreve.
    expect(alertDialogOpenSource()).toBe(alertDialogClosedSource());
  });

  it('as stories de estado usam o conjunto destrutivo de demonstration.labels', () => {
    for (const fn of [
      alertDialogClosedSource,
      alertDialogOpenSource,
      alertDialogConfirmadoSource,
      alertDialogCanceladoSource,
      alertDialogControlledSource,
    ]) {
      const output = fn();
      expect(output).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
      expect(output).toContain('<AlertDialogCancel');
      expect(output).toContain('>Excluir</AlertDialogAction>');
      // Título em pergunta e "Fechar" como Cancelar são o que o Do & Don't
      // reprova; o exemplo não pode ensinar os dois.
      expect(output).not.toMatch(/<AlertDialogTitle>[^<]*\?<\/AlertDialogTitle>/);
      expect(output).not.toContain('>Fechar<');
    }
  });

  it('o confirmado põe o handler na ação, e o fechamento não é escrito', () => {
    const output = alertDialogConfirmadoSource();
    expect(output).toContain('<AlertDialogAction variant="destructive" @click="excluirConta">');
    expect(output).toContain('function excluirConta() {');
    // Quem fecha é o componente: escrever um fechamento manual ensinaria a
    // duplicar o que já acontece.
    expect(output).not.toContain('open = false');
  });

  it('o cancelado dá handler às duas saídas, e o gatilho existe para receber o foco de volta', () => {
    const output = alertDialogCanceladoSource();
    expect(output).toContain('<AlertDialogCancel @click="aoDesistir">Cancelar</AlertDialogCancel>');
    expect(output).toContain('function aoDesistir() {');
    expect(output).toContain('<AlertDialogTrigger as-child>');
  });

  it('o controlado leva o estado e o gatilho para fora do componente', () => {
    const output = alertDialogControlledSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const aberto = ref(false)');
    expect(output).toContain(':open="aberto"');
    expect(output).toContain('@update:open="aberto = $event"');
    expect(output).toContain('<Button variant="destructive" @click="aberto = true">Excluir conta</Button>');
    // O gatilho do componente não convive com o botão externo neste modo.
    expect(output).not.toContain('AlertDialogTrigger');
    // A ação já pede o fechamento pelo evento de mudança: escrever outro
    // ensinaria a fechar duas vezes.
    expect(output).not.toContain('aberto = false');
  });

  it('nenhum trecho fixo escreve default-open', () => {
    for (const fn of [
      alertDialogClosedSource,
      alertDialogOpenSource,
      alertDialogConfirmadoSource,
      alertDialogCanceladoSource,
      alertDialogControlledSource,
      alertDialogWithIconSource,
      alertDialogDestructiveSource,
      alertDialogHeadingH3Source,
      alertDialogNeutralSource,
      alertDialogDescriptionLongaSource,
      alertDialogNoDescriptionSource,
      alertDialogClassNameExtraSource,
    ]) {
      expect(fn()).not.toContain('default-open');
    }
  });
});

describe('transforms das stories de composição', () => {
  it('a ordem do rodapé é Cancelar antes da ação em toda composição', () => {
    const funcoes = [
      alertDialogWithIconSource,
      alertDialogDestructiveSource,
      alertDialogHeadingH3Source,
      alertDialogNeutralSource,
      alertDialogNoDescriptionSource,
      alertDialogClassNameExtraSource,
    ];
    for (const fn of funcoes) {
      const output = fn();
      expect(output.indexOf('<AlertDialogCancel')).toBeLessThan(
        output.indexOf('<AlertDialogAction'),
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
    const output = alertDialogNeutralSource();
    expect(output).not.toContain('destructive');
    expect(output).toContain('<Button variant="outline">Sair da conta</Button>');
    expect(output).toContain('<AlertDialogAction>Sair</AlertDialogAction>');
  });

  it('a descrição longa quebra em bloco, e não numa linha só', () => {
    const output = alertDialogDescriptionLongaSource();
    expect(output).toContain(
      `        <AlertDialogDescription>
          Todos os seus dados, arquivos enviados, integrações ativas e o histórico`,
    );
    expect(output).toContain('        </AlertDialogDescription>');
  });

  it('sem descrição, o subcomponente some do import junto com a marcação', () => {
    const output = alertDialogNoDescriptionSource();
    expect(output).not.toContain('AlertDialogDescription');
    // Nada de atributo escrito à mão para compensar: o painel deixa de anunciar
    // descrição sozinho.
    expect(output).not.toContain('aria-describedby');
    expect(output).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('a classe extra é de LAYOUT, no painel e no bloco de mídia', () => {
    const output = alertDialogClassNameExtraSource();
    expect(output).toContain('<AlertDialogContent class="nds-overflow-hidden">');
    expect(output).toContain('<AlertDialogMedia class="nds-shrink-0">');
    // Largura máxima e espaçamento do painel não são extensíveis por classe: o
    // CSS do componente é carregado depois e vence no empate.
    expect(output).not.toContain('nds-max-w');
  });

  it('o nível do título é escrito, e é a ÚNICA coisa que difere da destrutiva', () => {
    const output = alertDialogHeadingH3Source();
    expect(output).toContain('<AlertDialogTitle as="h3">Excluir conta</AlertDialogTitle>');
    // `h2` é o padrão do primitivo: quem não pede nível não escreve prop
    // nenhuma, e o snippet não ensina a repetir o padrão.
    expect(alertDialogDestructiveSource()).toContain(
      '<AlertDialogTitle>Excluir conta</AlertDialogTitle>',
    );
    // Tirado o nível, sobra exatamente a confirmação destrutiva — a lição é a
    // tag, e não uma composição nova a comparar linha a linha.
    expect(output.replace(' as="h3"', '')).toBe(alertDialogDestructiveSource());
  });

  it('o ícone da mídia é decorativo — quem nomeia o painel é o título', () => {
    const output = alertDialogWithIconSource();
    expect(output).toContain('<TriangleAlert aria-hidden="true" />');
    expect(output).not.toContain('aria-label');
  });
});
