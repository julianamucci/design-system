import { describe, expect, it } from 'vitest';
import {
  collapsibleWithTriggerSnippet,
  collapsibleWithTriggerSource,
  collapsibleControlledSnippet,
  collapsibleSnippet,
  collapsibleSource,
  collapsibleSourceWith,
} from './collapsible.source';

describe('collapsibleSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = collapsibleSnippet();
    expect(code).toContain("import { createCollapsible } from '@/components/ui/collapsible';");
    expect(code).toContain('createCollapsible({');
    expect(code).toContain("document.querySelector('#app')?.append(colapsavel);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-expanded=');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = collapsibleSnippet();
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('open:');
  });

  it('mostra as opções quando a story as usa', () => {
    expect(collapsibleSnippet({ defaultOpen: true })).toContain('defaultOpen: true');
    expect(collapsibleSnippet({ disabled: true })).toContain('disabled: true');
    expect(collapsibleSnippet({ trigger: 'Ocultar filtros' })).toContain(
      "trigger: 'Ocultar filtros'",
    );
  });

  it('monta o painel com DOM curto, sem helper de story', () => {
    const code = collapsibleSnippet();
    expect(code).toContain("const painel = document.createElement('div');");
    expect(code).toContain('content: painel');
    expect(code).not.toContain('makeContent');
    expect(code).not.toContain('PAINEL_CLASSES');
    expect(code).not.toContain('makeTriggerWithIcon');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    // Nos args `onOpenChange` chega como spy, e imprimir a função devolveria
    // "() => {}" — ou pior, "[object Function]" — no painel Code.
    const code = collapsibleSnippet({
      onOpenChange: (() => undefined) as unknown as string,
    });
    expect(code).not.toContain('onOpenChange');
    expect(collapsibleSnippet({ onOpenChange: '(aberto) => registrar(aberto)' })).toContain(
      'onOpenChange: (aberto) => registrar(aberto)',
    );
  });
});

describe('collapsibleComGatilhoSnippet', () => {
  it('usa o botão do design system como gatilho', () => {
    const code = collapsibleWithTriggerSnippet({ trigger: 'Exibir opções avançadas' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("label: 'Exibir opções avançadas'");
    expect(code).toContain('trigger: gatilho');
  });

  it('só menciona a classe do chevron quando a story a exercita', () => {
    expect(collapsibleWithTriggerSnippet({})).not.toContain('nds-chevron');
    expect(collapsibleWithTriggerSnippet({ chevron: true })).toContain(
      "chevron.classList.add('nds-icon', 'nds-chevron');",
    );
  });
});

describe('collapsibleControladoSnippet', () => {
  it('mostra a posse do estado do lado de fora', () => {
    const code = collapsibleControlledSnippet();
    expect(code).toContain('let aberto = false;');
    expect(code).toContain('open: aberto');
    expect(code).toContain('onOpenChange: definir');
    expect(code).toContain('colapsavel.setOpen(valor);');
  });
});

describe('collapsibleSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = collapsibleSource('<div data-slot="collapsible">', {});
    const withArgs = collapsibleSource('<div data-slot="collapsible">', {
      args: { defaultOpen: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('defaultOpen: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      collapsibleSource('<div data-slot="collapsible" data-state="closed">', {}),
    ).not.toContain('data-state');
  });
});

describe('collapsibleSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = collapsibleSourceWith({ disabled: true });
    const code = transform('', { args: { defaultOpen: true } });
    expect(code).toContain('disabled: true');
    expect(code).toContain('defaultOpen: true');
  });

  it('vale também para a forma com gatilho de elemento', () => {
    const code = collapsibleWithTriggerSource({ trigger: 'Configurações avançadas' })('', {
      args: { trigger: 'outro' },
    });
    expect(code).toContain("label: 'Configurações avançadas'");
  });
});
