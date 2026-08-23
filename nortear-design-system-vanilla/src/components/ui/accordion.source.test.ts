import { describe, expect, it } from 'vitest';
import {
  accordionWithContentRichSnippet,
  accordionWithTriggerRichSnippet,
  accordionSnippet,
  accordionSource,
  accordionSourceWith,
} from './accordion.source';

describe('accordionSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = accordionSnippet();
    expect(code).toContain("import { createAccordion } from '@/components/ui/accordion';");
    expect(code).toContain('createAccordion({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-expanded');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = accordionSnippet();
    // `single` é o padrão; `defaultValue`, `class` e o callback são opcionais.
    expect(code).not.toContain('type:');
    expect(code).not.toContain('defaultValue');
    expect(code).not.toContain('class:');
    expect(code).not.toContain('onValueChange');
  });

  it('mostra o modo múltiplo, o valor inicial e a classe quando a story os usa', () => {
    const code = accordionSnippet({
      type: 'multiple',
      defaultValue: ['item-1'],
      class: 'nds-max-w-lg',
    });
    expect(code).toContain("type: 'multiple'");
    expect(code).toContain("defaultValue: ['item-1']");
    expect(code).toContain("class: 'nds-max-w-lg'");
  });

  it('aceita o valor inicial nas duas formas que a fábrica documenta', () => {
    expect(accordionSnippet({ defaultValue: 'senha' })).toContain("defaultValue: 'senha'");
    expect(accordionSnippet({ defaultValue: ['a', 'b'] })).toContain("defaultValue: ['a', 'b']");
  });

  it('leva o item desabilitado para o snippet', () => {
    const code = accordionSnippet({
      items: [
        { value: 'item-1', trigger: 'Item habilitado' },
        { value: 'item-2', trigger: 'Item desabilitado', disabled: true },
      ],
    });
    expect(code).toContain("{ value: 'item-2', trigger: 'Item desabilitado', content: '…', disabled: true },");
    expect(code).not.toContain("{ value: 'item-1', trigger: 'Item habilitado', content: '…', disabled");
  });

  it('ignora o callback que a story passa como função de verdade', () => {
    // `args.onValueChange` é um espião do Storybook: impresso, sairia como o
    // corpo compilado da função.
    const withSpy = accordionSnippet({ onValueChange: (() => {}) as unknown as string });
    expect(withSpy).not.toContain('onValueChange');
    expect(accordionSnippet({ onValueChange: '(v) => registrar(v)' })).toContain(
      'onValueChange: (v) => registrar(v)',
    );
  });

  it('não vaza os itens da story como texto corrido de exemplo', () => {
    const code = accordionSnippet({ items: [{ value: 'senha', trigger: 'Como redefinir?' }] });
    expect(code).toContain("content: '…'");
    expect(code).not.toContain('Esqueci minha senha');
  });
});

describe('accordionSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = accordionSource('<div data-slot="accordion">', {});
    const withArgs = accordionSource('<div data-slot="accordion">', {
      args: { type: 'multiple' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("type: 'multiple'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(accordionSource('<div data-slot="accordion" data-type="single">', {})).not.toContain(
      'data-type',
    );
  });
});

describe('accordionSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = accordionSourceWith({ type: 'single', defaultValue: 'item-1' });
    const code = transform('', { args: { type: 'multiple' } });
    expect(code).not.toContain("type: 'multiple'");
    expect(code).toContain("defaultValue: 'item-1'");
  });
});

describe('accordionComGatilhoRicoSnippet', () => {
  it('monta o rótulo com fábrica do design system, sem helper de story', () => {
    const code = accordionWithTriggerRichSnippet({
      value: 'novo',
      label: 'Novidades da versão 3.0',
      badge: 'Novo',
    });
    expect(code).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(code).toContain("createBadge({ variant: 'default', children: 'Novo' })");
    expect(code).toContain('acordeao.querySelector(\'[data-value="novo"] span\')');
    expect(code).not.toContain('makeIconTrigger');
    expect(code).not.toContain('createIcon');
  });

  it('trata o ícone como conteúdo de quem consome, sem inventar fábrica', () => {
    const code = accordionWithTriggerRichSnippet({ withIcon: true, label: 'Informação' });
    expect(code).toContain('rotulo.prepend(icone);');
    expect(code).toContain('aria-hidden');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(code).not.toContain('createIcon(');
    expect(code).not.toContain('lucide');
  });
});

describe('accordionComConteudoRicoSnippet', () => {
  it('sanitiza no call site, como a guideline 09 exige', () => {
    const code = accordionWithContentRichSnippet({ type: 'multiple', value: 'specs' });
    expect(code).toContain("import DOMPurify from 'dompurify';");
    expect(code).toContain('DOMPurify.sanitize(');
    expect(code).toContain('.nds-accordion-content-body');
    expect(code).toContain("type: 'multiple'");
  });
});
