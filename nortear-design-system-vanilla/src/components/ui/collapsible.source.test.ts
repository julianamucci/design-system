import { describe, expect, it } from 'vitest';
import {
  collapsibleComGatilhoSnippet,
  collapsibleComGatilhoSource,
  collapsibleControladoSnippet,
  collapsibleSnippet,
  collapsibleSource,
  collapsibleSourceCom,
} from './collapsible.source';

describe('collapsibleSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = collapsibleSnippet();
    expect(código).toContain("import { createCollapsible } from '@/components/ui/collapsible';");
    expect(código).toContain('createCollapsible({');
    expect(código).toContain("document.querySelector('#app')?.append(colapsavel);");
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-expanded=');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = collapsibleSnippet();
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('open:');
  });

  it('mostra as opções quando a story as usa', () => {
    expect(collapsibleSnippet({ defaultOpen: true })).toContain('defaultOpen: true');
    expect(collapsibleSnippet({ disabled: true })).toContain('disabled: true');
    expect(collapsibleSnippet({ trigger: 'Ocultar filtros' })).toContain(
      "trigger: 'Ocultar filtros'",
    );
  });

  it('monta o painel com DOM curto, sem helper de story', () => {
    const código = collapsibleSnippet();
    expect(código).toContain("const painel = document.createElement('div');");
    expect(código).toContain('content: painel');
    expect(código).not.toContain('makeContent');
    expect(código).not.toContain('PAINEL_CLASSES');
    expect(código).not.toContain('makeTriggerWithIcon');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    // Nos args `onOpenChange` chega como spy, e imprimir a função devolveria
    // "() => {}" — ou pior, "[object Function]" — no painel Code.
    const código = collapsibleSnippet({
      onOpenChange: (() => undefined) as unknown as string,
    });
    expect(código).not.toContain('onOpenChange');
    expect(collapsibleSnippet({ onOpenChange: '(aberto) => registrar(aberto)' })).toContain(
      'onOpenChange: (aberto) => registrar(aberto)',
    );
  });
});

describe('collapsibleComGatilhoSnippet', () => {
  it('usa o botão do design system como gatilho', () => {
    const código = collapsibleComGatilhoSnippet({ trigger: 'Exibir opções avançadas' });
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain("label: 'Exibir opções avançadas'");
    expect(código).toContain('trigger: gatilho');
  });

  it('só menciona a classe do chevron quando a story a exercita', () => {
    expect(collapsibleComGatilhoSnippet({})).not.toContain('nds-chevron');
    expect(collapsibleComGatilhoSnippet({ chevron: true })).toContain(
      "chevron.classList.add('nds-icon', 'nds-chevron');",
    );
  });
});

describe('collapsibleControladoSnippet', () => {
  it('mostra a posse do estado do lado de fora', () => {
    const código = collapsibleControladoSnippet();
    expect(código).toContain('let aberto = false;');
    expect(código).toContain('open: aberto');
    expect(código).toContain('onOpenChange: definir');
    expect(código).toContain('colapsavel.setOpen(valor);');
  });
});

describe('collapsibleSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = collapsibleSource('<div data-slot="collapsible">', {});
    const comArgs = collapsibleSource('<div data-slot="collapsible">', {
      args: { defaultOpen: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('defaultOpen: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      collapsibleSource('<div data-slot="collapsible" data-state="closed">', {}),
    ).not.toContain('data-state');
  });
});

describe('collapsibleSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = collapsibleSourceCom({ disabled: true });
    const código = transform('', { args: { defaultOpen: true } });
    expect(código).toContain('disabled: true');
    expect(código).toContain('defaultOpen: true');
  });

  it('vale também para a forma com gatilho de elemento', () => {
    const código = collapsibleComGatilhoSource({ trigger: 'Configurações avançadas' })('', {
      args: { trigger: 'outro' },
    });
    expect(código).toContain("label: 'Configurações avançadas'");
  });
});
