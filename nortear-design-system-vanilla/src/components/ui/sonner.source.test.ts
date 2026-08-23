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
    const code = sonnerSnippet();
    expect(code).toContain(
      "import { createSonnerToaster, toast } from '@/components/ui/sonner';",
    );
    expect(code).toContain('createSonnerToaster(');
    expect(code).toContain('toast.success(');
    expect(code).not.toContain('data-sonner-toast');
    expect(code).not.toContain('nds-toast-title');
  });

  it('monta a região uma vez e dispara a notificação depois', () => {
    const code = sonnerSnippet();
    expect(code.indexOf('createSonnerToaster')).toBeLessThan(code.indexOf('toast.success'));
    expect(code).toContain("document.querySelector('#app')?.append(regiao);");
  });

  it('omite o que já é padrão do design system', () => {
    const code = sonnerSnippet();
    expect(code).not.toContain('position');
    expect(code).not.toContain('richColors');
    expect(code).not.toContain('closeButton');
    // 4000ms é o prazo padrão: repeti-lo não ensina nada.
    expect(code).not.toContain('duration');
  });

  it('mostra as opções da região quando a story as escolhe', () => {
    const code = sonnerSnippet({ position: 'bottom-center', richColors: true, duration: 8000 });
    expect(code).toContain("position: 'bottom-center'");
    expect(code).toContain('richColors: true');
    expect(code).toContain('duration: 8000');
  });

  it('o tipo escolhe o método da fila; o neutro é a própria função', () => {
    expect(sonnerSnippet({ type: 'error' })).toContain('toast.error(');
    expect(sonnerSnippet({ type: 'warning' })).toContain('toast.warning(');
    const neutral = sonnerSnippet({ type: 'default', title: 'Código copiado.' });
    expect(neutral).toContain("toast('Código copiado.');");
    expect(neutral).not.toContain('toast.default(');
  });

  it('descrição e ação entram como opções da notificação', () => {
    const code = sonnerSnippet({
      type: 'default',
      title: 'Item excluído.',
      description: 'O item saiu da listagem.',
      actionLabel: 'Desfazer',
    });
    expect(code).toContain("description: 'O item saiu da listagem.'");
    expect(code).toContain("action: { label: 'Desfazer', onClick: () => desfazer() }");
  });

  it('o prazo infinito nunca vai sozinho — sempre com botão de fechar', () => {
    const code = sonnerSnippet({ type: 'error', persistente: true });
    expect(code).toContain('duration: Number.POSITIVE_INFINITY');
    expect(code).toContain('closeButton: true');
  });

  it('não vaza as fixtures nem os prazos de teste das stories', () => {
    const code = sonnerSnippet({ type: 'success' });
    expect(code).not.toContain('PERSISTENT');
    expect(code).not.toContain('mountToaster');
    expect(code).not.toContain('waitForToast');
    expect(code).not.toContain('400');
  });
});

describe('sonnerNoRegionSnippet', () => {
  it('dispara sem região montada — a fila cria a dela sob demanda', () => {
    const code = sonnerNoRegionSnippet({ type: 'success' });
    expect(code).toContain("import { toast } from '@/components/ui/sonner';");
    expect(code).not.toContain('createSonnerToaster');
    expect(code).toContain('toast.success(');
  });
});

describe('sonnerStackSnippet', () => {
  it('uma chamada por notificação, na ordem em que entram na pilha', () => {
    const code = sonnerStackSnippet(
      [
        { type: 'success', title: 'Alterações salvas.' },
        { type: 'warning', title: 'Sua sessão expira em 5 minutos.' },
        { type: 'info', title: 'Nova versão disponível.' },
      ],
      { position: 'top-right', richColors: true },
    );
    expect(code.match(/toast\./g)).toHaveLength(3);
    expect(code.indexOf('toast.success')).toBeLessThan(code.indexOf('toast.warning'));
    expect(code).toContain("position: 'top-right'");
  });
});

describe('sonnerPromiseSnippet', () => {
  it('uma notificação para a operação inteira, com as três mensagens', () => {
    const code = sonnerPromiseSnippet();
    expect(code).toContain('toast.promise(');
    expect(code).toContain("loading: 'Enviando arquivo...'");
    expect(code).toContain("success: 'Arquivo enviado com sucesso.'");
    expect(code).toContain("error: 'Erro ao enviar. Tente novamente.'");
    expect(code).not.toContain('toast.loading(');
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
    const code = sonnerSourceWith({ type: 'warning' })('', { args: { type: 'success' } });
    expect(code).toContain('toast.warning(');
    expect(code).not.toContain('toast.success(');
  });
});
