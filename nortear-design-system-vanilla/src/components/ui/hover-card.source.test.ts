import { describe, expect, it } from 'vitest';
import {
  hoverCardWithComandosSnippet,
  hoverCardSnippet,
  hoverCardSource,
  hoverCardSourceWith,
} from './hover-card.source';

describe('hoverCardSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = hoverCardSnippet();
    expect(code).toContain("import { createHoverCard } from '@/components/ui/hover-card';");
    expect(code).toContain('createHoverCard({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="dialog"');
  });

  it('o nome do painel vem do gatilho, pelo rótulo canônico', () => {
    // A fábrica não tem opção de nome acessível: ele sai do `aria-label` do
    // gatilho e, sem ele, do texto do gatilho.
    const code = hoverCardSnippet({ triggerAriaLabel: 'Definição de WCAG 2.2 AA' });
    expect(code).toContain("gatilho.setAttribute('aria-label', 'Definição de WCAG 2.2 AA');");
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = hoverCardSnippet();
    expect(code).not.toContain('side:');
    expect(code).not.toContain('align:');
    expect(code).not.toContain('openDelay');
    expect(code).not.toContain('closeDelay');
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('onOpenChange');
    expect(code).not.toContain('class:');
  });

  it('a espera só entra quando difere da espera padrão do sistema', () => {
    expect(hoverCardSnippet({ openDelay: 600, closeDelay: 300 })).not.toContain('Delay');
    const curta = hoverCardSnippet({ openDelay: 150, closeDelay: 100 });
    expect(curta).toContain('openDelay: 150');
    expect(curta).toContain('closeDelay: 100');
  });

  it('mostra lado, encosto e classe extra quando a story os usa', () => {
    const code = hoverCardSnippet({ side: 'top', align: 'start', class: 'nds-w-md' });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("align: 'start'");
    expect(code).toContain("class: 'nds-w-md'");
  });

  it('o gatilho é um link de verdade — o caminho de quem não tem hover', () => {
    const code = hoverCardSnippet({ triggerLabel: '@joana' });
    expect(code).toContain("document.createElement('a')");
    expect(code).toContain("gatilho.href = '/users/joana';");
    expect(code).toContain("gatilho.textContent = '@joana';");
  });

  it('o gatilho que não navega é um botão, e não envia formulário', () => {
    const code = hoverCardSnippet({ triggerTipo: 'botao', triggerLabel: 'WCAG 2.2 AA' });
    expect(code).toContain("document.createElement('button')");
    expect(code).toContain("gatilho.type = 'button';");
    expect(code).not.toContain('gatilho.href');
  });

  it('cerca o gatilho de texto, que é o que dispensa o alvo em linha dos 24px', () => {
    const code = hoverCardSnippet();
    expect(code).toContain("const frase = document.createElement('p');");
    expect(code).toContain('frase.append(');
    expect(code).toContain("document.querySelector('#app')?.append(frase);");
  });

  it('não vaza fixture de story', () => {
    const code = hoverCardSnippet();
    expect(code).not.toContain('construirLink');
    expect(code).not.toContain('construirBotao');
    expect(code).not.toContain('construirCartaoPerfil');
    expect(code).not.toContain('construirDuasLinhas');
    expect(code).not.toContain('emFrase');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const code = hoverCardSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(code).not.toContain('onOpenChange');
  });
});

describe('hoverCardSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = hoverCardSource('<div data-slot="hover-card-content">', {});
    const withArgs = hoverCardSource('<div data-slot="hover-card-content">', {
      args: { side: 'top', openDelay: 150, triggerLabel: '@maria' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("side: 'top'");
    expect(withArgs).toContain('openDelay: 150');
    expect(withArgs).toContain("gatilho.textContent = '@maria';");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(hoverCardSource('<div role="dialog" data-side="bottom">', {})).not.toContain(
      'data-side=',
    );
  });
});

describe('hoverCardSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = hoverCardSourceWith({ side: 'left', class: 'nds-w-md nds-text-center' });
    const code = transform('', { args: { side: 'bottom' } });
    expect(code).toContain("side: 'left'");
    expect(code).toContain("class: 'nds-w-md nds-text-center'");
  });
});

describe('hoverCardComComandosSnippet', () => {
  it('mostra os comandos da raiz, que são o modo controlado desta fábrica', () => {
    const code = hoverCardWithComandosSnippet({
      onOpenChange: '(aberto) => registrar(aberto)',
    });
    expect(code).toContain('cartao.open()');
    expect(code).toContain('cartao.close()');
    expect(code).toContain('onOpenChange: (aberto) => registrar(aberto)');
    // Os apelidos em português são `@deprecated`: o snippet ensina o canônico.
    expect(code).not.toContain('cartao.abrir');
    expect(code).not.toContain('cartao.fechar');
  });

  it('os controles entram na página junto com a frase', () => {
    expect(hoverCardWithComandosSnippet()).toContain(
      "document.querySelector('#app')?.append(abrir, fechar, frase);",
    );
  });
});
