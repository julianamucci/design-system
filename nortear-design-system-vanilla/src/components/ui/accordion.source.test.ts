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
    const código = accordionSnippet();
    expect(código).toContain("import { createAccordion } from '@/components/ui/accordion';");
    expect(código).toContain('createAccordion({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-expanded');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = accordionSnippet();
    // `single` é o padrão; `defaultValue`, `class` e o callback são opcionais.
    expect(código).not.toContain('type:');
    expect(código).not.toContain('defaultValue');
    expect(código).not.toContain('class:');
    expect(código).not.toContain('onValueChange');
  });

  it('mostra o modo múltiplo, o valor inicial e a classe quando a story os usa', () => {
    const código = accordionSnippet({
      type: 'multiple',
      defaultValue: ['item-1'],
      class: 'nds-max-w-lg',
    });
    expect(código).toContain("type: 'multiple'");
    expect(código).toContain("defaultValue: ['item-1']");
    expect(código).toContain("class: 'nds-max-w-lg'");
  });

  it('aceita o valor inicial nas duas formas que a fábrica documenta', () => {
    expect(accordionSnippet({ defaultValue: 'senha' })).toContain("defaultValue: 'senha'");
    expect(accordionSnippet({ defaultValue: ['a', 'b'] })).toContain("defaultValue: ['a', 'b']");
  });

  it('leva o item desabilitado para o snippet', () => {
    const código = accordionSnippet({
      items: [
        { value: 'item-1', trigger: 'Item habilitado' },
        { value: 'item-2', trigger: 'Item desabilitado', disabled: true },
      ],
    });
    expect(código).toContain("{ value: 'item-2', trigger: 'Item desabilitado', content: '…', disabled: true },");
    expect(código).not.toContain("{ value: 'item-1', trigger: 'Item habilitado', content: '…', disabled");
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
    const código = accordionSnippet({ items: [{ value: 'senha', trigger: 'Como redefinir?' }] });
    expect(código).toContain("content: '…'");
    expect(código).not.toContain('Esqueci minha senha');
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
    const código = transform('', { args: { type: 'multiple' } });
    expect(código).not.toContain("type: 'multiple'");
    expect(código).toContain("defaultValue: 'item-1'");
  });
});

describe('accordionComGatilhoRicoSnippet', () => {
  it('monta o rótulo com fábrica do design system, sem helper de story', () => {
    const código = accordionWithTriggerRichSnippet({
      value: 'novo',
      rotulo: 'Novidades da versão 3.0',
      badge: 'Novo',
    });
    expect(código).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(código).toContain("createBadge({ variant: 'default', children: 'Novo' })");
    expect(código).toContain('acordeao.querySelector(\'[data-value="novo"] span\')');
    expect(código).not.toContain('makeIconTrigger');
    expect(código).not.toContain('createIcon');
  });

  it('trata o ícone como conteúdo de quem consome, sem inventar fábrica', () => {
    const código = accordionWithTriggerRichSnippet({ withIcon: true, rotulo: 'Informação' });
    expect(código).toContain('rotulo.prepend(icone);');
    expect(código).toContain('aria-hidden');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(código).not.toContain('createIcon(');
    expect(código).not.toContain('lucide');
  });
});

describe('accordionComConteudoRicoSnippet', () => {
  it('sanitiza no call site, como a guideline 09 exige', () => {
    const código = accordionWithContentRichSnippet({ type: 'multiple', value: 'specs' });
    expect(código).toContain("import DOMPurify from 'dompurify';");
    expect(código).toContain('DOMPurify.sanitize(');
    expect(código).toContain('.nds-accordion-content-body');
    expect(código).toContain("type: 'multiple'");
  });
});
