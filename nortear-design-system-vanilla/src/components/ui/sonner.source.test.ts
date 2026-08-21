import { describe, expect, it } from 'vitest';
import {
  sonnerStackSnippet,
  sonnerPromiseSnippet,
  sonnerNoRegionSnippet,
  sonnerSnippet,
  sonnerSource,
  sonnerSourceWith,
} from './sonner.source';

describe('sonnerSnippet', () => {
  it('devolve as chamadas da API, e não o outerHTML da notificação', () => {
    const código = sonnerSnippet();
    expect(código).toContain(
      "import { createSonnerToaster, toast } from '@/components/ui/sonner';",
    );
    expect(código).toContain('createSonnerToaster(');
    expect(código).toContain('toast.success(');
    expect(código).not.toContain('data-sonner-toast');
    expect(código).not.toContain('nds-toast-title');
  });

  it('monta a região uma vez e dispara a notificação depois', () => {
    const código = sonnerSnippet();
    expect(código.indexOf('createSonnerToaster')).toBeLessThan(código.indexOf('toast.success'));
    expect(código).toContain("document.querySelector('#app')?.append(regiao);");
  });

  it('omite o que já é padrão do design system', () => {
    const código = sonnerSnippet();
    expect(código).not.toContain('position');
    expect(código).not.toContain('richColors');
    expect(código).not.toContain('closeButton');
    // 4000ms é o prazo padrão: repeti-lo não ensina nada.
    expect(código).not.toContain('duration');
  });

  it('mostra as opções da região quando a story as escolhe', () => {
    const código = sonnerSnippet({ position: 'bottom-center', richColors: true, duration: 8000 });
    expect(código).toContain("position: 'bottom-center'");
    expect(código).toContain('richColors: true');
    expect(código).toContain('duration: 8000');
  });

  it('o tipo escolhe o método da fila; o neutro é a própria função', () => {
    expect(sonnerSnippet({ type: 'error' })).toContain('toast.error(');
    expect(sonnerSnippet({ type: 'warning' })).toContain('toast.warning(');
    const neutral = sonnerSnippet({ type: 'default', title: 'Código copiado.' });
    expect(neutral).toContain("toast('Código copiado.');");
    expect(neutral).not.toContain('toast.default(');
  });

  it('descrição e ação entram como opções da notificação', () => {
    const código = sonnerSnippet({
      type: 'default',
      title: 'Item excluído.',
      description: 'O item saiu da listagem.',
      actionLabel: 'Desfazer',
    });
    expect(código).toContain("description: 'O item saiu da listagem.'");
    expect(código).toContain("action: { label: 'Desfazer', onClick: () => desfazer() }");
  });

  it('o prazo infinito nunca vai sozinho — sempre com botão de fechar', () => {
    const código = sonnerSnippet({ type: 'error', persistente: true });
    expect(código).toContain('duration: Number.POSITIVE_INFINITY');
    expect(código).toContain('closeButton: true');
  });

  it('não vaza as fixtures nem os prazos de teste das stories', () => {
    const código = sonnerSnippet({ type: 'success' });
    expect(código).not.toContain('PERSISTENT');
    expect(código).not.toContain('mountToaster');
    expect(código).not.toContain('waitForToast');
    expect(código).not.toContain('400');
  });
});

describe('sonnerNoRegionSnippet', () => {
  it('dispara sem região montada — a fila cria a dela sob demanda', () => {
    const código = sonnerNoRegionSnippet({ type: 'success' });
    expect(código).toContain("import { toast } from '@/components/ui/sonner';");
    expect(código).not.toContain('createSonnerToaster');
    expect(código).toContain('toast.success(');
  });
});

describe('sonnerStackSnippet', () => {
  it('uma chamada por notificação, na ordem em que entram na pilha', () => {
    const código = sonnerStackSnippet(
      [
        { type: 'success', title: 'Alterações salvas.' },
        { type: 'warning', title: 'Sua sessão expira em 5 minutos.' },
        { type: 'info', title: 'Nova versão disponível.' },
      ],
      { position: 'top-right', richColors: true },
    );
    expect(código.match(/toast\./g)).toHaveLength(3);
    expect(código.indexOf('toast.success')).toBeLessThan(código.indexOf('toast.warning'));
    expect(código).toContain("position: 'top-right'");
  });
});

describe('sonnerPromiseSnippet', () => {
  it('uma notificação para a operação inteira, com as três mensagens', () => {
    const código = sonnerPromiseSnippet();
    expect(código).toContain('toast.promise(');
    expect(código).toContain("loading: 'Enviando arquivo...'");
    expect(código).toContain("success: 'Arquivo enviado com sucesso.'");
    expect(código).toContain("error: 'Erro ao enviar. Tente novamente.'");
    expect(código).not.toContain('toast.loading(');
  });
});

describe('sonnerSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = sonnerSource('<div data-sonner-toast>', {});
    const other = sonnerSource('<div data-sonner-toast>', {
      args: { type: 'error', title: 'Não foi possível salvar.', richColors: true },
    });
    expect(padrão).not.toBe(other);
    expect(other).toContain('toast.error(');
    expect(other).toContain('richColors: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sonnerSource('<div data-sonner-toast role="status" aria-live="polite">', {})).not.toContain(
      'aria-live',
    );
  });
});

describe('sonnerSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = sonnerSourceWith({ type: 'warning' })('', { args: { type: 'success' } });
    expect(código).toContain('toast.warning(');
    expect(código).not.toContain('toast.success(');
  });
});
