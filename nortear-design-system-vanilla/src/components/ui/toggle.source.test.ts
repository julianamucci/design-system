import { describe, expect, it } from 'vitest';
import {
  toggleBarSnippet,
  toggleRowSnippet,
  toggleInvalidoSnippet,
  toggleSnippet,
  toggleSource,
  toggleSourceWith,
} from './toggle.source';

describe('toggleSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML', () => {
    const code = toggleSnippet();
    expect(code).toContain("import { createToggle } from '@/components/ui/toggle';");
    expect(code).toContain('createToggle(');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-pressed="false"');
  });

  it('põe o nome acessível no toggle só de ícone — é obrigatório lá', () => {
    expect(toggleSnippet()).toContain("'aria-label': 'Negrito'");
    expect(toggleSnippet({ 'aria-label': 'Itálico' })).toContain("'aria-label': 'Itálico'");
  });

  it('tira o nome acessível quando há texto visível — o conteúdo já é o nome', () => {
    const code = toggleSnippet({ label: 'Mostrar ocultos' });
    expect(code).not.toContain('aria-label');
    expect(code).toContain("'Mostrar ocultos'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = toggleSnippet();
    expect(code).not.toContain('variant');
    expect(code).not.toContain('size');
    expect(code).not.toContain('pressed');
    expect(code).not.toContain('disabled');
  });

  it('mostra variante, tamanho e estados quando a story os usa', () => {
    const code = toggleSnippet({ variant: 'outline', size: 'lg', pressed: true, disabled: true });
    expect(code).toContain("variant: 'outline'");
    expect(code).toContain("size: 'lg'");
    expect(code).toContain('pressed: true');
    expect(code).toContain('disabled: true');
  });

  it('constrói o ícone com o lucide, sem helper de story', () => {
    const code = toggleSnippet();
    expect(code).toContain("import { Bold, createElement } from 'lucide';");
    expect(code).toContain('createElement(Bold)');
    expect(code).not.toContain('buildLucideSvg');
    expect(code).not.toContain('iconToggle');
  });
});

describe('toggleSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = toggleSource('<button data-slot="toggle">', {});
    const contorno = toggleSource('<button data-slot="toggle">', {
      args: { variant: 'outline', pressed: true },
    });
    expect(padrão).not.toBe(contorno);
    expect(contorno).toContain("variant: 'outline'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(toggleSource('<button data-slot="toggle" aria-pressed="false">', {}))
      .not.toContain('aria-pressed="false"');
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const code = toggleSource('', { args: { onClick: () => {} } });
    expect(code).toContain('onClick: (pressed) => alternar(pressed)');
  });
});

describe('toggleSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = toggleSourceWith({ variant: 'outline' })('', { args: { variant: 'default' } });
    expect(code).toContain("variant: 'outline'");
  });

  it('aceita uma expressão própria para o callback', () => {
    const code = toggleSourceWith({ onClick: '(pressed) => salvar(pressed)' })('', {});
    expect(code).toContain('onClick: (pressed) => salvar(pressed)');
  });
});

describe('toggleFileiraSnippet', () => {
  it('agrupa no nds-cluster do design system, não num helper de story', () => {
    const code = toggleRowSnippet([
      { icon: 'Bold', 'aria-label': 'Negrito' },
      { icon: 'Italic', 'aria-label': 'Itálico', variant: 'outline' },
    ]);
    expect(code).toContain("fileira.className = 'nds-cluster'");
    expect(code).not.toContain('cluster(');
    expect(code).toContain("import { Bold, Italic, createElement } from 'lucide';");
    expect(code.match(/createToggle\(/g)).toHaveLength(2);
  });
});

describe('toggleBarraSnippet', () => {
  it('nomeia o grupo — role="group" sem nome não diz de que barra se trata', () => {
    const code = toggleBarSnippet(
      [{ icon: 'Bold', 'aria-label': 'Negrito' }, { icon: 'Italic', 'aria-label': 'Itálico' }],
      'Formatação de texto',
    );
    expect(code).toContain("barra.setAttribute('role', 'group')");
    expect(code).toContain("barra.setAttribute('aria-label', 'Formatação de texto')");
    expect(code.match(/createToggle\(/g)).toHaveLength(2);
  });
});

describe('toggleInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar o anel à mão', () => {
    const code = toggleInvalidoSnippet();
    expect(code).toContain("setAttribute('aria-invalid', 'true')");
    expect(code).toContain("setAttribute('aria-describedby', 'toggle-invalid-msg')");
    expect(code).not.toContain('boxShadow');
    expect(code).not.toContain('style');
  });
});
