import { describe, expect, it } from 'vitest';
import {
  hoverCardWithComandosSnippet,
  hoverCardSnippet,
  hoverCardSource,
  hoverCardSourceWith,
} from './hover-card.source';

describe('hoverCardSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = hoverCardSnippet();
    expect(código).toContain("import { createHoverCard } from '@/components/ui/hover-card';");
    expect(código).toContain('createHoverCard({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="dialog"');
  });

  it('o nome do painel vem do gatilho, pelo rótulo canônico', () => {
    // A fábrica não tem opção de nome acessível: ele sai do `aria-label` do
    // gatilho e, sem ele, do texto do gatilho.
    const código = hoverCardSnippet({ triggerAriaLabel: 'Definição de WCAG 2.2 AA' });
    expect(código).toContain("gatilho.setAttribute('aria-label', 'Definição de WCAG 2.2 AA');");
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = hoverCardSnippet();
    expect(código).not.toContain('side:');
    expect(código).not.toContain('align:');
    expect(código).not.toContain('openDelay');
    expect(código).not.toContain('closeDelay');
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('onOpenChange');
    expect(código).not.toContain('class:');
  });

  it('a espera só entra quando difere da espera padrão do sistema', () => {
    expect(hoverCardSnippet({ openDelay: 600, closeDelay: 300 })).not.toContain('Delay');
    const curta = hoverCardSnippet({ openDelay: 150, closeDelay: 100 });
    expect(curta).toContain('openDelay: 150');
    expect(curta).toContain('closeDelay: 100');
  });

  it('mostra lado, encosto e classe extra quando a story os usa', () => {
    const código = hoverCardSnippet({ side: 'top', align: 'start', class: 'nds-w-md' });
    expect(código).toContain("side: 'top'");
    expect(código).toContain("align: 'start'");
    expect(código).toContain("class: 'nds-w-md'");
  });

  it('o gatilho é um link de verdade — o caminho de quem não tem hover', () => {
    const código = hoverCardSnippet({ triggerLabel: '@joana' });
    expect(código).toContain("document.createElement('a')");
    expect(código).toContain("gatilho.href = '/users/joana';");
    expect(código).toContain("gatilho.textContent = '@joana';");
  });

  it('o gatilho que não navega é um botão, e não envia formulário', () => {
    const código = hoverCardSnippet({ triggerTipo: 'botao', triggerLabel: 'WCAG 2.2 AA' });
    expect(código).toContain("document.createElement('button')");
    expect(código).toContain("gatilho.type = 'button';");
    expect(código).not.toContain('gatilho.href');
  });

  it('cerca o gatilho de texto, que é o que dispensa o alvo em linha dos 24px', () => {
    const código = hoverCardSnippet();
    expect(código).toContain("const frase = document.createElement('p');");
    expect(código).toContain('frase.append(');
    expect(código).toContain("document.querySelector('#app')?.append(frase);");
  });

  it('não vaza fixture de story', () => {
    const código = hoverCardSnippet();
    expect(código).not.toContain('construirLink');
    expect(código).not.toContain('construirBotao');
    expect(código).not.toContain('construirCartaoPerfil');
    expect(código).not.toContain('construirDuasLinhas');
    expect(código).not.toContain('emFrase');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const código = hoverCardSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(código).not.toContain('onOpenChange');
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
    const código = transform('', { args: { side: 'bottom' } });
    expect(código).toContain("side: 'left'");
    expect(código).toContain("class: 'nds-w-md nds-text-center'");
  });
});

describe('hoverCardComComandosSnippet', () => {
  it('mostra os comandos da raiz, que são o modo controlado desta fábrica', () => {
    const código = hoverCardWithComandosSnippet({
      onOpenChange: '(aberto) => registrar(aberto)',
    });
    expect(código).toContain('cartao.open()');
    expect(código).toContain('cartao.close()');
    expect(código).toContain('onOpenChange: (aberto) => registrar(aberto)');
    // Os apelidos em português são `@deprecated`: o snippet ensina o canônico.
    expect(código).not.toContain('cartao.abrir');
    expect(código).not.toContain('cartao.fechar');
  });

  it('os controles entram na página junto com a frase', () => {
    expect(hoverCardWithComandosSnippet()).toContain(
      "document.querySelector('#app')?.append(abrir, fechar, frase);",
    );
  });
});
