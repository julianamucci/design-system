import { describe, expect, it } from 'vitest';
import {
  toggleBarraSnippet,
  toggleFileiraSnippet,
  toggleInvalidoSnippet,
  toggleSnippet,
  toggleSource,
  toggleSourceCom,
} from './toggle.source';

describe('toggleSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML', () => {
    const código = toggleSnippet();
    expect(código).toContain("import { createToggle } from '@/components/ui/toggle';");
    expect(código).toContain('createToggle(');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-pressed="false"');
  });

  it('põe o nome acessível no toggle só de ícone — é obrigatório lá', () => {
    expect(toggleSnippet()).toContain("'aria-label': 'Negrito'");
    expect(toggleSnippet({ 'aria-label': 'Itálico' })).toContain("'aria-label': 'Itálico'");
  });

  it('tira o nome acessível quando há texto visível — o conteúdo já é o nome', () => {
    const código = toggleSnippet({ label: 'Mostrar ocultos' });
    expect(código).not.toContain('aria-label');
    expect(código).toContain("'Mostrar ocultos'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = toggleSnippet();
    expect(código).not.toContain('variant');
    expect(código).not.toContain('size');
    expect(código).not.toContain('pressed');
    expect(código).not.toContain('disabled');
  });

  it('mostra variante, tamanho e estados quando a story os usa', () => {
    const código = toggleSnippet({ variant: 'outline', size: 'lg', pressed: true, disabled: true });
    expect(código).toContain("variant: 'outline'");
    expect(código).toContain("size: 'lg'");
    expect(código).toContain('pressed: true');
    expect(código).toContain('disabled: true');
  });

  it('constrói o ícone com o lucide, sem helper de story', () => {
    const código = toggleSnippet();
    expect(código).toContain("import { Bold, createElement } from 'lucide';");
    expect(código).toContain('createElement(Bold)');
    expect(código).not.toContain('buildLucideSvg');
    expect(código).not.toContain('iconToggle');
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
    const código = toggleSource('', { args: { onClick: () => {} } });
    expect(código).toContain('onClick: (pressed) => alternar(pressed)');
  });
});

describe('toggleSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = toggleSourceCom({ variant: 'outline' })('', { args: { variant: 'default' } });
    expect(código).toContain("variant: 'outline'");
  });

  it('aceita uma expressão própria para o callback', () => {
    const código = toggleSourceCom({ onClick: '(pressed) => salvar(pressed)' })('', {});
    expect(código).toContain('onClick: (pressed) => salvar(pressed)');
  });
});

describe('toggleFileiraSnippet', () => {
  it('agrupa no nds-cluster do design system, não num helper de story', () => {
    const código = toggleFileiraSnippet([
      { icon: 'Bold', 'aria-label': 'Negrito' },
      { icon: 'Italic', 'aria-label': 'Itálico', variant: 'outline' },
    ]);
    expect(código).toContain("fileira.className = 'nds-cluster'");
    expect(código).not.toContain('cluster(');
    expect(código).toContain("import { Bold, Italic, createElement } from 'lucide';");
    expect(código.match(/createToggle\(/g)).toHaveLength(2);
  });
});

describe('toggleBarraSnippet', () => {
  it('nomeia o grupo — role="group" sem nome não diz de que barra se trata', () => {
    const código = toggleBarraSnippet(
      [{ icon: 'Bold', 'aria-label': 'Negrito' }, { icon: 'Italic', 'aria-label': 'Itálico' }],
      'Formatação de texto',
    );
    expect(código).toContain("barra.setAttribute('role', 'group')");
    expect(código).toContain("barra.setAttribute('aria-label', 'Formatação de texto')");
    expect(código.match(/createToggle\(/g)).toHaveLength(2);
  });
});

describe('toggleInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar o anel à mão', () => {
    const código = toggleInvalidoSnippet();
    expect(código).toContain("setAttribute('aria-invalid', 'true')");
    expect(código).toContain("setAttribute('aria-describedby', 'toggle-invalid-msg')");
    expect(código).not.toContain('boxShadow');
    expect(código).not.toContain('style');
  });
});
