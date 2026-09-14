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
  sonnerPauseOnHoverSource,
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
  sonnerPauseOnHoverSource,
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
  it('com os args da story, a região declara só as cores do tema', () => {
    const exit = sonnerPlaygroundSource();
    expect(exit).toContain(`import { NdsToaster, toast } from '@/components/ui/sonner';`);
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).toContain(`toast.success('Alterações salvas.');`);
  });

  // `top-right` é o padrão do `input()` desde 2026-09-13: escrevê-lo ensinaria a
  // repetir o default. Até 2026-09-14 este construtor o escrevia sempre, contra
  // o próprio comentário que dizia omitir o padrão.
  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'top-right', richColors: false, closeButton: false, duration: 4000 },
    });
    expect(exit).toContain('<div ndsToaster></div>');
    expect(exit).not.toContain('position=');
    expect(exit).not.toContain('richColors');
    expect(exit).not.toContain('closeButton');
    expect(exit).not.toContain('duration');
  });

  it('escreve o que difere do padrão na região', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'bottom-center', richColors: true, closeButton: true },
    });
    expect(exit).toContain(
      '<div ndsToaster position="bottom-center" [richColors]="true" [closeButton]="true"></div>',
    );
  });

  it('o tipo é o método da fila, e a neutra é a função direta', () => {
    expect(sonnerPlaygroundSource('', { args: { type: 'warning' } })).toContain('toast.warning(');
    const neutral = sonnerPlaygroundSource('', { args: { type: 'default' } });
    expect(neutral).toContain(`toast('Alterações salvas.');`);
    expect(neutral).not.toContain('toast.default');
  });

  it('a ação leva um manipulador que a classe declara', () => {
    const so = sonnerPlaygroundSource();
    expect(so).not.toContain('action:');
    expect(so).not.toContain('desfazer');

    const full = sonnerPlaygroundSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(full).toContain(`description: 'Detalhe da mudança.',`);
    expect(full).toContain(`action: { label: 'Desfazer', onClick: () => this.desfazer() },`);
    expect(full).toContain('desfazer(): void {');
  });

  it('escapa a aspa do literal em vez de encerrar a string', () => {
    const exit = sonnerPlaygroundSource('', { args: { title: "Não foi possível 'salvar'." } });
    expect(exit).toContain(`toast.success('Não foi possível \\'salvar\\'.');`);
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('nenhuma traz o andaime da story', () => {
    for (const fn of ALL) {
      const exit = fn();
      // O quadro existe para prender a região `position: fixed` no canvas.
      expect(exit).not.toContain('style=');
      expect(exit).not.toContain('contain: layout');
      // O botão existe só para haver o que clicar na demonstração.
      expect(exit).not.toContain('Disparar notificação');
      expect(exit).not.toContain('ndsButton');
    }
  });

  it('nenhuma vaza fixture nem o relógio encurtado da suíte', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).not.toContain('TEXTS');
      expect(exit).not.toContain('PERSISTENT');
      expect(exit).not.toContain('waitForToast');
      expect(exit).not.toContain('clearToasts');
      // 1200 e 300 são os prazos que as stories usam para não depender do
      // relógio real — nenhum deles é valor do design system.
      expect(exit).not.toContain('[duration]');
    }
  });

  it('a região entra no máximo uma vez, e só quando há região', () => {
    for (const fn of ALL) {
      const exit = fn();
      // Conta o ELEMENTO no template, e não a palavra: a nota do snippet fala
      // do Toaster em prosa, e casar texto solto mediria o comentário.
      const regions = exit.match(/<div ndsToaster\b/g) ?? [];
      if (exit.includes('imports: [NdsToaster]')) {
        expect(regions.length).toBe(1);
      } else {
        expect(regions.length).toBe(0);
      }
    }
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo é o próprio método, com o texto que descreve o estado', () => {
    expect(sonnerNeutralSource()).toContain(`toast('Código copiado.');`);
    expect(sonnerSuccessSource()).toContain(`toast.success('Alterações salvas.');`);
    expect(sonnerErrorSource()).toContain(
      `toast.error('Não foi possível salvar. Tente novamente.');`,
    );
    expect(sonnerWarningSource()).toContain(`toast.warning('Sua sessão expira em 5 minutos.');`);
    expect(sonnerInfoSource()).toContain(`toast.info('Nova versão disponível.');`);
  });

  it('o carregamento não recebe prazo — quem o encerra é a operação', () => {
    const exit = sonnerLoadingSource();
    expect(exit).toContain(`toast.loading('Enviando arquivo...');`);
    expect(exit).not.toContain('duration:');
  });
});

describe('transforms das stories de estado', () => {
  it('o fechamento automático usa o prazo padrão da região, sem escrevê-lo', () => {
    const exit = sonnerAutoDismissSource();
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).toContain(`toast.error(`);
  });

  it('a pausa não se configura — o snippet não inventa opção para ela', () => {
    const exit = sonnerPauseOnHoverSource();
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).not.toContain('pause');
  });

  it('a pilha é uma chamada por notificação', () => {
    expect((sonnerStackSource().match(/toast\./g) ?? []).length).toBe(3);
  });

  it('o canto muda só na região', () => {
    expect(sonnerPositionSource()).toContain(
      '<div ndsToaster position="bottom-center" [richColors]="true"></div>',
    );
  });

  it('sem região montada, o snippet não monta região nenhuma', () => {
    const exit = sonnerNoRegionSource();
    // O que se afirma é o CÓDIGO que montaria a região — o elemento no template
    // e o import da diretiva —, e não a palavra: a nota do snippet diz "Sem
    // Toaster montado", e uma asserção sobre texto solto reprovaria a prosa.
    expect(exit).not.toMatch(/<div ndsToaster\b/);
    expect(exit).not.toMatch(/import \{[^}]*\bNdsToaster\b/);
    expect(exit).not.toContain('@Component');
    expect(exit).toContain(`import { toast } from '@/components/ui/sonner';`);
    expect(exit).toContain(`toast.success('Alterações salvas.');`);
  });

  it('o tema escuro não tem prop — os cinco tipos na mesma região', () => {
    const exit = sonnerDarkThemeSource();
    expect(exit).not.toContain('theme');
    // Uma chamada por linha dentro do método, qualquer que seja a indentação.
    expect((exit.match(/^\s+toast(?:\.\w+)?\(/gm) ?? []).length).toBe(5);
  });
});

describe('transforms das stories de composição', () => {
  it('a descrição acompanha o título na mesma chamada', () => {
    const exit = sonnerWithDescriptionSource();
    expect(exit).toContain(`toast.success('Preferências atualizadas.', {`);
    expect(exit).toContain(
      `description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',`,
    );
  });

  it('a ação leva um manipulador que existe fora da notificação', () => {
    const exit = sonnerWithActionSource();
    expect(exit).toContain(`action: { label: 'Desfazer', onClick: () => this.desfazer() },`);
    expect(exit).toContain('desfazer(): void {');
  });

  it('a promessa é UMA chamada para os três estados', () => {
    const exit = sonnerPromiseSource();
    expect(exit).toContain('toast.promise(this.enviarArquivo(), {');
    expect(exit).toContain(`loading: 'Enviando arquivo...',`);
    expect(exit).toContain(`success: 'Arquivo enviado com sucesso.',`);
    expect(exit).toContain(`error: 'Erro ao enviar. Tente novamente.',`);
    expect((exit.match(/toast\./g) ?? []).length).toBe(1);
    expect(exit).toContain('enviarArquivo(): Promise<void> {');
  });

  it('a persistente combina prazo infinito na chamada com fechar na região', () => {
    const exit = sonnerPersistentSource();
    expect(exit).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(exit).toContain('<div ndsToaster [richColors]="true" [closeButton]="true"></div>');
  });
});
