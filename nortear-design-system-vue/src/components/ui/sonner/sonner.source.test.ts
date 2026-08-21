import { describe, expect, it } from 'vitest';
import {
  sonnerWarningSource,
  sonnerLoadingSource,
  sonnerWithActionSource,
  sonnerWithDescriptionSource,
  sonnerErrorSource,
  sonnerInfoSource,
  sonnerNeutralSource,
  sonnerPersistentSource,
  sonnerStackSource,
  sonnerPlaygroundSource,
  sonnerPositionSource,
  sonnerPromiseSource,
  sonnerAutoDismissSource,
  sonnerNoRegionSource,
  sonnerSuccessSource,
  sonnerDarkThemeSource,
} from './sonner.source';

const ALL = [
  sonnerPlaygroundSource,
  sonnerNeutralSource,
  sonnerSuccessSource,
  sonnerErrorSource,
  sonnerWarningSource,
  sonnerInfoSource,
  sonnerLoadingSource,
  sonnerAutoDismissSource,
  sonnerStackSource,
  sonnerPositionSource,
  sonnerNoRegionSource,
  sonnerDarkThemeSource,
  sonnerWithDescriptionSource,
  sonnerWithActionSource,
  sonnerPromiseSource,
  sonnerPersistentSource,
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
    const neutral = sonnerPlaygroundSource('', { args: { type: 'default' } });
    expect(neutral).toContain(`  toast('Alterações salvas.')`);
    // Não existe `type: 'default'` na API: o tipo neutro é a ausência de método.
    expect(neutral).not.toContain('default');
  });

  it('descrição e ação só entram quando o control traz texto', () => {
    const so = sonnerPlaygroundSource();
    expect(so).not.toContain('description:');
    expect(so).not.toContain('action:');

    const full = sonnerPlaygroundSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(full).toContain(`description: 'Detalhe da mudança.',`);
    expect(full).toContain(`action: { label: 'Desfazer', onClick: desfazer },`);
    // A ação some junto com a notificação: o manipulador precisa existir fora.
    expect(full).toContain('function desfazer() {');
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'bottom-right', richColors: false, closeButton: false, duration: 4000 },
    });
    expect(exit).toContain('<Toaster />');
    expect(exit).not.toContain('position=');
    expect(exit).not.toContain('rich-colors');
    expect(exit).not.toContain('close-button');
    expect(exit).not.toContain('duration');
  });

  it('escreve o que difere do padrão na região', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'bottom-center', richColors: true, closeButton: true, duration: 8000 },
    });
    expect(exit).toContain(
      '<Toaster position="bottom-center" rich-colors close-button :duration="8000" />',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const exit = sonnerPlaygroundSource('', {
      args: {
        title: (() => {}) as never,
        description: (() => {}) as never,
        actionLabel: (() => {}) as never,
        type: (() => {}) as never,
      },
    });
    expect(exit).not.toContain('function notificar() {\n  toast.function');
    expect(exit).not.toContain('=> {}');
    expect(exit).not.toContain('description:');
    expect(exit).not.toContain('action:');
    // Cai no padrão em vez de interpolar o espião.
    expect(exit).toContain(`toast.success('Alterações salvas.')`);
  });

  it('escapa a aspa do literal em vez de encerrar a string', () => {
    const exit = sonnerPlaygroundSource('', { args: { title: "Não foi possível 'salvar'." } });
    expect(exit).toContain(`toast.success('Não foi possível \\'salvar\\'.')`);
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('nenhuma traz o quadro de andaime das stories', () => {
    for (const fn of ALL) {
      const exit = fn();
      // O quadro existe para prender uma região `position: fixed` dentro do
      // canvas do Storybook — quem consome monta a região na raiz.
      expect(exit).not.toContain('style=');
      expect(exit).not.toContain('contain: layout');
      expect(exit).not.toContain('min-height');
    }
  });

  it('nenhuma importa texto nem apoio do módulo de fixtures', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).not.toContain('TEXTS');
      expect(exit).not.toContain('PERSISTENT');
      expect(exit).not.toContain('waitForToast');
      expect(exit).not.toContain('clearToasts');
    }
  });

  it('a fila vem de vue-sonner e a região vem do design system', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).toContain(`import { toast } from 'vue-sonner'`);
      if (exit.includes('<Toaster')) {
        expect(exit).toContain(`import { Toaster } from '@/components/ui/sonner'`);
      }
    }
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo é o próprio método, com o texto que descreve o estado', () => {
    expect(sonnerNeutralSource()).toContain(`toast('Código copiado.')`);
    expect(sonnerSuccessSource()).toContain(`toast.success('Alterações salvas.')`);
    expect(sonnerErrorSource()).toContain(
      `toast.error('Não foi possível salvar. Tente novamente.')`,
    );
    expect(sonnerWarningSource()).toContain(`toast.warning('Sua sessão expira em 5 minutos.')`);
    expect(sonnerInfoSource()).toContain(`toast.info('Nova versão disponível.')`);
  });

  it('o carregamento não recebe prazo — quem o encerra é a operação', () => {
    const exit = sonnerLoadingSource();
    expect(exit).toContain(`toast.loading('Enviando arquivo...')`);
    expect(exit).not.toContain('duration');
  });
});

describe('transforms das stories de estado', () => {
  it('a pilha aberta precisa de expand na região e de mais de uma chamada', () => {
    const exit = sonnerStackSource();
    expect(exit).toContain('<Toaster position="top-right" rich-colors expand />');
    expect((exit.match(/toast\./g) ?? []).length).toBe(3);
  });

  it('o canto muda só na região', () => {
    expect(sonnerPositionSource()).toContain('<Toaster position="bottom-center" rich-colors />');
  });

  it('sem região montada, o snippet não monta região nenhuma', () => {
    const exit = sonnerNoRegionSource();
    expect(exit).not.toContain('Toaster');
    // A fila continua existindo: é essa a lição da story.
    expect(exit).toContain(`toast.success('Alterações salvas.')`);
  });

  it('o tema escuro é declarado na região, com os cinco tipos na tela', () => {
    const exit = sonnerDarkThemeSource();
    expect(exit).toContain('theme="dark"');
    expect((exit.match(/^ {2}toast/gm) ?? []).length).toBe(5);
  });
});

describe('transforms das stories de composição', () => {
  it('a descrição acompanha o título na mesma chamada', () => {
    const exit = sonnerWithDescriptionSource();
    expect(exit).toContain(`toast.success('Preferências atualizadas.', {`);
    expect(exit).toContain(
      `  description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',`,
    );
  });

  it('a ação leva um manipulador que existe fora da notificação', () => {
    const exit = sonnerWithActionSource();
    expect(exit).toContain(`action: { label: 'Desfazer', onClick: desfazer },`);
    expect(exit).toContain(`function desfazer() {\n  toast.success('Item restaurado.')\n}`);
    // O rótulo do gatilho é a ação real, não "Disparar notificação".
    expect(exit).toContain('>Excluir item</Button>');
  });

  it('a promessa é UMA chamada para os três estados', () => {
    const exit = sonnerPromiseSource();
    expect(exit).toContain('toast.promise(enviarArquivo(), {');
    expect(exit).toContain(`  loading: 'Enviando arquivo...',`);
    expect(exit).toContain(`  success: 'Arquivo enviado com sucesso.',`);
    expect(exit).toContain(`  error: 'Erro ao enviar. Tente novamente.',`);
    // Nada de encadear três chamadas: o nó no DOM é o mesmo do começo ao fim.
    expect((exit.match(/toast\./g) ?? []).length).toBe(1);
  });

  it('a persistente combina prazo infinito na chamada com fechar na região', () => {
    const exit = sonnerPersistentSource();
    expect(exit).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(exit).toContain('<Toaster position="top-right" rich-colors close-button />');
  });
});
