import { describe, expect, it } from 'vitest';
import {
  navigationMenuControlledSnippet,
  navigationMenuHighlightSnippet,
  navigationMenuMegaSnippet,
  navigationMenuSnippet,
  navigationMenuSource,
  navigationMenuSourceWith,
} from './navigation-menu.source';

describe('navigationMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const code = navigationMenuSnippet();
    expect(code).toContain(
      "import { createNavigationMenu } from '@/components/ui/navigation-menu';",
    );
    expect(code).toContain('createNavigationMenu([');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<nav');
  });

  it('passa os itens no primeiro argumento, que é posicional', () => {
    const code = navigationMenuSnippet();
    expect(code).toContain("{ label: 'Início', href: '#inicio' },");
    expect(code).toContain('children: [');
    expect(code).toContain("{ label: 'Plano Inicial', href: '#inicial' },");
    expect(code).toContain("document.querySelector('#app')?.append(barra);");
  });

  it('nomeia o landmark — dois "navegação" na página são indistinguíveis', () => {
    expect(navigationMenuSnippet()).toContain(
      "barra.setAttribute('aria-label', 'Navegação principal');",
    );
    expect(navigationMenuSnippet({ ariaLabel: 'Navegação da conta' })).toContain(
      "barra.setAttribute('aria-label', 'Navegação da conta');",
    );
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = navigationMenuSnippet({
      orientation: 'horizontal',
      delayDuration: 200,
      skipDelayDuration: 300,
    });
    expect(code).not.toContain('orientation');
    expect(code).not.toContain('delayDuration');
    expect(code).not.toContain('skipDelayDuration');
    expect(code).not.toContain('], {');
  });

  it('mostra a orientação e as esperas quando a story as usa', () => {
    const code = navigationMenuSnippet({
      orientation: 'vertical',
      delayDuration: 100,
      skipDelayDuration: 0,
      class: 'nds-w-sm',
    });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain('delayDuration: 100');
    expect(code).toContain('skipDelayDuration: 0');
    expect(code).toContain("class: 'nds-w-sm'");
  });

  it('marca a página atual pelo item, que é de onde sai o aria-current', () => {
    const code = navigationMenuSnippet({
      items: [
        { label: 'Início', href: '#inicio', active: true },
        { label: 'Sobre', href: '#sobre' },
      ],
    });
    expect(code).toContain("{ label: 'Início', href: '#inicio', active: true },");
    expect(code).toContain("{ label: 'Sobre', href: '#sobre' },");
  });

  it('quebra o destino em bloco quando a descrição não cabe na linha', () => {
    const code = navigationMenuSnippet({
      items: [
        {
          label: 'Soluções',
          children: [
            {
              label: 'Para Marketing',
              href: '#marketing',
              description: 'Campanhas, automação e atribuição num lugar só.',
            },
          ],
        },
      ],
    });
    expect(code).toContain("description: 'Campanhas, automação e atribuição num lugar só.',");
    expect(code).toContain("label: 'Para Marketing',");
  });

  it('mostra a limpeza só onde ela é o assunto', () => {
    expect(navigationMenuSnippet()).not.toContain('destroy');
    expect(navigationMenuSnippet({ destroy: true })).toContain('barra.destroy();');
  });

  it('não vaza a fixture nem o andaime das stories', () => {
    const code = navigationMenuSnippet();
    expect(code).not.toContain('esperarPainel');
    expect(code).not.toContain('painelAberto');
    expect(code).not.toContain('impedirNavegacao');
    expect(code).not.toContain('SELETOR_PAINEL');
    expect(code).not.toContain('wrap(');
  });
});

describe('navigationMenuMegaSnippet', () => {
  it('faz as colunas com as utilities compartilhadas, sem largura em style', () => {
    const code = navigationMenuMegaSnippet();
    expect(code).toContain("painel.classList.add('nds-grid', 'nds-w-lg');");
    expect(code).toContain("painel.dataset.cols = '2';");
    expect(code).not.toContain('style.width');
    expect(code).not.toContain('style=');
  });
});

describe('navigationMenuDestaqueSnippet', () => {
  it('põe o destaque na coluna inteira e empilha os complementares', () => {
    const code = navigationMenuHighlightSnippet();
    expect(code).toContain("destaque.classList.add('nds-h-full');");
    expect(code).toContain("coluna.className = 'nds-stack';");
    expect(code).toContain('painel.appendChild(coluna);');
  });
});

describe('navigationMenuControladoSnippet', () => {
  it('mostra as duas metades do modo controlado', () => {
    // Definir `value` é o que troca o modo; sem `setValue()` nada se move, e um
    // snippet que parasse na chamada esconderia justamente isso.
    const code = navigationMenuControlledSnippet();
    expect(code).toContain("value: ''");
    expect(code).toContain('onValueChange: (valor) => registrarPedido(valor)');
    expect(code).toContain("barra.setValue('produtos');");
    expect(code).toContain('barra.getValue();');
  });
});

describe('navigationMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const horizontal = navigationMenuSource('<nav data-slot="navigation-menu">', {});
    const vertical = navigationMenuSource('<nav data-slot="navigation-menu">', {
      args: { orientation: 'vertical', delayDuration: 100 },
    });
    expect(horizontal).not.toBe(vertical);
    expect(vertical).toContain("orientation: 'vertical'");
    expect(vertical).toContain('delayDuration: 100');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      navigationMenuSource('<nav data-slot="navigation-menu" aria-label="Main navigation">', {}),
    ).not.toContain('Main navigation');
  });
});

describe('navigationMenuSourceCom', () => {
  it('sobrepõe os args da story com a estrutura fixa', () => {
    const transform = navigationMenuSourceWith({
      orientation: 'vertical',
      items: [{ label: 'Painel', href: '#painel' }],
    });
    const code = transform('', { args: { orientation: 'horizontal' } });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain("{ label: 'Painel', href: '#painel' },");
    expect(code).not.toContain("label: 'Produtos'");
  });
});
