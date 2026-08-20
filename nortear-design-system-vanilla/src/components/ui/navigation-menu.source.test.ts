import { describe, expect, it } from 'vitest';
import {
  navigationMenuControladoSnippet,
  navigationMenuDestaqueSnippet,
  navigationMenuMegaSnippet,
  navigationMenuSnippet,
  navigationMenuSource,
  navigationMenuSourceCom,
} from './navigation-menu.source';

describe('navigationMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const código = navigationMenuSnippet();
    expect(código).toContain(
      "import { createNavigationMenu } from '@/components/ui/navigation-menu';",
    );
    expect(código).toContain('createNavigationMenu([');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<nav');
  });

  it('passa os itens no primeiro argumento, que é posicional', () => {
    const código = navigationMenuSnippet();
    expect(código).toContain("{ label: 'Início', href: '#inicio' },");
    expect(código).toContain('children: [');
    expect(código).toContain("{ label: 'Plano Inicial', href: '#inicial' },");
    expect(código).toContain("document.querySelector('#app')?.append(barra);");
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
    const código = navigationMenuSnippet({
      orientation: 'horizontal',
      delayDuration: 200,
      skipDelayDuration: 300,
    });
    expect(código).not.toContain('orientation');
    expect(código).not.toContain('delayDuration');
    expect(código).not.toContain('skipDelayDuration');
    expect(código).not.toContain('], {');
  });

  it('mostra a orientação e as esperas quando a story as usa', () => {
    const código = navigationMenuSnippet({
      orientation: 'vertical',
      delayDuration: 100,
      skipDelayDuration: 0,
      class: 'nds-w-sm',
    });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain('delayDuration: 100');
    expect(código).toContain('skipDelayDuration: 0');
    expect(código).toContain("class: 'nds-w-sm'");
  });

  it('marca a página atual pelo item, que é de onde sai o aria-current', () => {
    const código = navigationMenuSnippet({
      items: [
        { label: 'Início', href: '#inicio', active: true },
        { label: 'Sobre', href: '#sobre' },
      ],
    });
    expect(código).toContain("{ label: 'Início', href: '#inicio', active: true },");
    expect(código).toContain("{ label: 'Sobre', href: '#sobre' },");
  });

  it('quebra o destino em bloco quando a descrição não cabe na linha', () => {
    const código = navigationMenuSnippet({
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
    expect(código).toContain("description: 'Campanhas, automação e atribuição num lugar só.',");
    expect(código).toContain("label: 'Para Marketing',");
  });

  it('mostra a limpeza só onde ela é o assunto', () => {
    expect(navigationMenuSnippet()).not.toContain('destroy');
    expect(navigationMenuSnippet({ destroy: true })).toContain('barra.destroy();');
  });

  it('não vaza a fixture nem o andaime das stories', () => {
    const código = navigationMenuSnippet();
    expect(código).not.toContain('esperarPainel');
    expect(código).not.toContain('painelAberto');
    expect(código).not.toContain('impedirNavegacao');
    expect(código).not.toContain('SELETOR_PAINEL');
    expect(código).not.toContain('wrap(');
  });
});

describe('navigationMenuMegaSnippet', () => {
  it('faz as colunas com as utilities compartilhadas, sem largura em style', () => {
    const código = navigationMenuMegaSnippet();
    expect(código).toContain("painel.classList.add('nds-grid', 'nds-w-lg');");
    expect(código).toContain("painel.dataset.cols = '2';");
    expect(código).not.toContain('style.width');
    expect(código).not.toContain('style=');
  });
});

describe('navigationMenuDestaqueSnippet', () => {
  it('põe o destaque na coluna inteira e empilha os complementares', () => {
    const código = navigationMenuDestaqueSnippet();
    expect(código).toContain("destaque.classList.add('nds-h-full');");
    expect(código).toContain("coluna.className = 'nds-stack';");
    expect(código).toContain('painel.appendChild(coluna);');
  });
});

describe('navigationMenuControladoSnippet', () => {
  it('mostra as duas metades do modo controlado', () => {
    // Definir `value` é o que troca o modo; sem `setValue()` nada se move, e um
    // snippet que parasse na chamada esconderia justamente isso.
    const código = navigationMenuControladoSnippet();
    expect(código).toContain("value: ''");
    expect(código).toContain('onValueChange: (valor) => registrarPedido(valor)');
    expect(código).toContain("barra.setValue('produtos');");
    expect(código).toContain('barra.getValue();');
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
    const transform = navigationMenuSourceCom({
      orientation: 'vertical',
      items: [{ label: 'Painel', href: '#painel' }],
    });
    const código = transform('', { args: { orientation: 'horizontal' } });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain("{ label: 'Painel', href: '#painel' },");
    expect(código).not.toContain("label: 'Produtos'");
  });
});
