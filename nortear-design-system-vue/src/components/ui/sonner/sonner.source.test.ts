import { describe, expect, it } from 'vitest';
import {
  sonnerAvisoSource,
  sonnerCarregandoSource,
  sonnerComAcaoSource,
  sonnerComDescricaoSource,
  sonnerErroSource,
  sonnerInfoSource,
  sonnerNeutraSource,
  sonnerPersistenteSource,
  sonnerPilhaSource,
  sonnerPlaygroundSource,
  sonnerPosicaoSource,
  sonnerPromessaSource,
  sonnerSaidaAutomaticaSource,
  sonnerSemRegiaoSource,
  sonnerSucessoSource,
  sonnerTemaEscuroSource,
} from './sonner.source';

const TODAS = [
  sonnerPlaygroundSource,
  sonnerNeutraSource,
  sonnerSucessoSource,
  sonnerErroSource,
  sonnerAvisoSource,
  sonnerInfoSource,
  sonnerCarregandoSource,
  sonnerSaidaAutomaticaSource,
  sonnerPilhaSource,
  sonnerPosicaoSource,
  sonnerSemRegiaoSource,
  sonnerTemaEscuroSource,
  sonnerComDescricaoSource,
  sonnerComAcaoSource,
  sonnerPromessaSource,
  sonnerPersistenteSource,
];

describe('sonnerPlaygroundSource', () => {
  // Sem args nada difere do padrão do componente, então a região sai nua — é a
  // forma mínima que quem consome escreve na raiz da aplicação.
  it('sem args, entrega o gatilho, a chamada e a região', () => {
    expect(sonnerPlaygroundSource()).toBe(
      `<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'

function notificar() {
  toast.success('Alterações salvas.')
}
</script>

<template>
  <Button variant="outline" @click="notificar">Disparar notificação</Button>

  <Toaster />
</template>`,
    );
  });

  it('com os args da story, a região declara o canto e as cores do tema', () => {
    expect(sonnerPlaygroundSource('', { args: { position: 'top-right', richColors: true } })).toContain(
      '<Toaster position="top-right" rich-colors />',
    );
  });

  it('o tipo é o método da fila, e a neutra é a função direta', () => {
    expect(sonnerPlaygroundSource('', { args: { type: 'warning' } })).toContain('toast.warning(');
    const neutra = sonnerPlaygroundSource('', { args: { type: 'default' } });
    expect(neutra).toContain(`  toast('Alterações salvas.')`);
    // Não existe `type: 'default'` na API: o tipo neutro é a ausência de método.
    expect(neutra).not.toContain('default');
  });

  it('descrição e ação só entram quando o control traz texto', () => {
    const so = sonnerPlaygroundSource();
    expect(so).not.toContain('description:');
    expect(so).not.toContain('action:');

    const cheia = sonnerPlaygroundSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(cheia).toContain(`description: 'Detalhe da mudança.',`);
    expect(cheia).toContain(`action: { label: 'Desfazer', onClick: desfazer },`);
    // A ação some junto com a notificação: o manipulador precisa existir fora.
    expect(cheia).toContain('function desfazer() {');
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const saida = sonnerPlaygroundSource('', {
      args: { position: 'bottom-right', richColors: false, closeButton: false, duration: 4000 },
    });
    expect(saida).toContain('<Toaster />');
    expect(saida).not.toContain('position=');
    expect(saida).not.toContain('rich-colors');
    expect(saida).not.toContain('close-button');
    expect(saida).not.toContain('duration');
  });

  it('escreve o que difere do padrão na região', () => {
    const saida = sonnerPlaygroundSource('', {
      args: { position: 'bottom-center', richColors: true, closeButton: true, duration: 8000 },
    });
    expect(saida).toContain(
      '<Toaster position="bottom-center" rich-colors close-button :duration="8000" />',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = sonnerPlaygroundSource('', {
      args: {
        title: (() => {}) as never,
        description: (() => {}) as never,
        actionLabel: (() => {}) as never,
        type: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function notificar() {\n  toast.function');
    expect(saida).not.toContain('=> {}');
    expect(saida).not.toContain('description:');
    expect(saida).not.toContain('action:');
    // Cai no padrão em vez de interpolar o espião.
    expect(saida).toContain(`toast.success('Alterações salvas.')`);
  });

  it('escapa a aspa do literal em vez de encerrar a string', () => {
    const saida = sonnerPlaygroundSource('', { args: { title: "Não foi possível 'salvar'." } });
    expect(saida).toContain(`toast.success('Não foi possível \\'salvar\\'.')`);
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('nenhuma traz o quadro de andaime das stories', () => {
    for (const fn of TODAS) {
      const saida = fn();
      // O quadro existe para prender uma região `position: fixed` dentro do
      // canvas do Storybook — quem consome monta a região na raiz.
      expect(saida).not.toContain('style=');
      expect(saida).not.toContain('contain: layout');
      expect(saida).not.toContain('min-height');
    }
  });

  it('nenhuma importa texto nem apoio do módulo de fixtures', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('TEXTOS');
      expect(saida).not.toContain('PERSISTENTE');
      expect(saida).not.toContain('esperarTorrada');
      expect(saida).not.toContain('limparTorradas');
    }
  });

  it('a fila vem de vue-sonner e a região vem do design system', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).toContain(`import { toast } from 'vue-sonner'`);
      if (saida.includes('<Toaster')) {
        expect(saida).toContain(`import { Toaster } from '@/components/ui/sonner'`);
      }
    }
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo é o próprio método, com o texto que descreve o estado', () => {
    expect(sonnerNeutraSource()).toContain(`toast('Código copiado.')`);
    expect(sonnerSucessoSource()).toContain(`toast.success('Alterações salvas.')`);
    expect(sonnerErroSource()).toContain(
      `toast.error('Não foi possível salvar. Tente novamente.')`,
    );
    expect(sonnerAvisoSource()).toContain(`toast.warning('Sua sessão expira em 5 minutos.')`);
    expect(sonnerInfoSource()).toContain(`toast.info('Nova versão disponível.')`);
  });

  it('o carregamento não recebe prazo — quem o encerra é a operação', () => {
    const saida = sonnerCarregandoSource();
    expect(saida).toContain(`toast.loading('Enviando arquivo...')`);
    expect(saida).not.toContain('duration');
  });
});

describe('transforms das stories de estado', () => {
  it('a pilha aberta precisa de expand na região e de mais de uma chamada', () => {
    const saida = sonnerPilhaSource();
    expect(saida).toContain('<Toaster position="top-right" rich-colors expand />');
    expect((saida.match(/toast\./g) ?? []).length).toBe(3);
  });

  it('o canto muda só na região', () => {
    expect(sonnerPosicaoSource()).toContain('<Toaster position="bottom-center" rich-colors />');
  });

  it('sem região montada, o snippet não monta região nenhuma', () => {
    const saida = sonnerSemRegiaoSource();
    expect(saida).not.toContain('Toaster');
    // A fila continua existindo: é essa a lição da story.
    expect(saida).toContain(`toast.success('Alterações salvas.')`);
  });

  it('o tema escuro é declarado na região, com os cinco tipos na tela', () => {
    const saida = sonnerTemaEscuroSource();
    expect(saida).toContain('theme="dark"');
    expect((saida.match(/^ {2}toast/gm) ?? []).length).toBe(5);
  });
});

describe('transforms das stories de composição', () => {
  it('a descrição acompanha o título na mesma chamada', () => {
    const saida = sonnerComDescricaoSource();
    expect(saida).toContain(`toast.success('Preferências atualizadas.', {`);
    expect(saida).toContain(
      `  description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',`,
    );
  });

  it('a ação leva um manipulador que existe fora da notificação', () => {
    const saida = sonnerComAcaoSource();
    expect(saida).toContain(`action: { label: 'Desfazer', onClick: desfazer },`);
    expect(saida).toContain(`function desfazer() {\n  toast.success('Item restaurado.')\n}`);
    // O rótulo do gatilho é a ação real, não "Disparar notificação".
    expect(saida).toContain('>Excluir item</Button>');
  });

  it('a promessa é UMA chamada para os três estados', () => {
    const saida = sonnerPromessaSource();
    expect(saida).toContain('toast.promise(enviarArquivo(), {');
    expect(saida).toContain(`  loading: 'Enviando arquivo...',`);
    expect(saida).toContain(`  success: 'Arquivo enviado com sucesso.',`);
    expect(saida).toContain(`  error: 'Erro ao enviar. Tente novamente.',`);
    // Nada de encadear três chamadas: o nó no DOM é o mesmo do começo ao fim.
    expect((saida.match(/toast\./g) ?? []).length).toBe(1);
  });

  it('a persistente combina prazo infinito na chamada com fechar na região', () => {
    const saida = sonnerPersistenteSource();
    expect(saida).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(saida).toContain('<Toaster position="top-right" rich-colors close-button />');
  });
});
