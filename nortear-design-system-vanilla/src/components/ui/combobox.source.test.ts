import { describe, expect, it } from 'vitest';
import {
  comboboxSnippet,
  comboboxSource,
  comboboxSourceWith,
  controlledComboboxSnippet,
  controlledComboboxSource,
  filterComboboxSnippet,
  filterComboboxSource,
} from './combobox.source';

describe('comboboxSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do campo', () => {
    const code = comboboxSnippet();
    expect(code).toContain("import { createCombobox } from '@/components/ui/combobox';");
    expect(code).toContain('createCombobox({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="combobox"');
  });

  it('declara a variável que a última linha monta', () => {
    // O `append` cita `combobox`: sem a atribuição, o snippet inteiro é código
    // que não roda — e ninguém percebe, porque o painel não compila nada.
    const code = comboboxSnippet();
    expect(code).toContain('const combobox = createCombobox(');
    expect(code).toContain("document.querySelector('#app')?.append(combobox);");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = comboboxSnippet();
    expect(code).not.toContain('multiple:');
    expect(code).not.toContain('chipsLayout:');
    expect(code).not.toContain('disabled:');
    expect(code).not.toContain('invalid:');
    expect(code).not.toContain('defaultValue:');
  });

  it('mostra estado, forma dos chips e escolha inicial quando a story os usa', () => {
    const code = comboboxSnippet({
      multiple: true,
      chipsLayout: 'single-line',
      defaultValue: ['brasil', 'argentina'],
      name: 'paises',
    });
    expect(code).toContain('multiple: true');
    expect(code).toContain("chipsLayout: 'single-line'");
    expect(code).toContain("defaultValue: ['brasil', 'argentina']");
    expect(code).toContain("name: 'paises'");

    expect(comboboxSnippet({ disabled: true })).toContain('disabled: true');
    expect(comboboxSnippet({ invalid: true })).toContain('invalid: true');
  });

  it('escreve a lista a partir dos rótulos, sem fixture de story', () => {
    const code = comboboxSnippet({ items: ['Brasil', 'Colômbia'] });
    expect(code).toContain("{ value: 'brasil', label: 'Brasil' },");
    // O `value` sai do rótulo sem acento e em minúsculas, como nas stories.
    expect(code).toContain("{ value: 'colombia', label: 'Colômbia' },");
    expect(code).not.toContain('COUNTRIES');
    expect(code).not.toContain('PAISES');
    expect(code).not.toContain('COUNTRY_LABELS');
  });

  it('leva o rótulo do grupo para cada item quando a lista é agrupada', () => {
    const code = comboboxSnippet({
      groups: { Frutas: ['Maçã'], Legumes: ['Cenoura'] },
    });
    expect(code).toContain("{ value: 'maca', label: 'Maçã', group: 'Frutas' },");
    expect(code).toContain("{ value: 'cenoura', label: 'Cenoura', group: 'Legumes' },");
  });
});

describe('filterComboboxSnippet', () => {
  it('mostra a assinatura publicada do predicado', () => {
    // É o ponto da story: quem copia daqui é quem escreveria a assinatura
    // errada. Os dois parâmetros e o tipo do item aparecem anotados.
    const code = filterComboboxSnippet();
    expect(code).toContain('filter: (item: ComboboxItem, query: string) =>');
    expect(code).toContain("import { createCombobox, type ComboboxItem } from '@/components/ui/combobox';");
    expect(code).toContain('const items: ComboboxItem[] = [');
  });

  it('deixa a normalização FORA do predicado, que é de quem filtra', () => {
    const code = filterComboboxSnippet();
    expect(code).toContain('const withoutAccent = (value: string) =>');
    expect(code).toContain('withoutAccent(item.label).startsWith(withoutAccent(query))');
  });

  it('aceita a lista da story sem repetir literal', () => {
    const code = filterComboboxSnippet({ items: ['Uruguai'] });
    expect(code).toContain("{ value: 'uruguai', label: 'Uruguai' },");
    expect(code).toContain("name: 'pais'");
  });
});

describe('controlledComboboxSnippet', () => {
  it('mostra os dois verbos do elemento devolvido', () => {
    // Sem `setValue`/`setInputValue`, quem copia monta um campo que anuncia a
    // intenção e nunca se move — que é o defeito clássico do modo controlado.
    const code = controlledComboboxSnippet();
    expect(code).toContain('combobox.setValue(value);');
    expect(code).toContain('combobox.setInputValue(inputValue);');
  });

  it('passa `value` e `inputValue`, que é o que tira a posse do estado', () => {
    const code = controlledComboboxSnippet();
    expect(code).toContain("let value = ['brasil'];");
    expect(code).toContain("let inputValue = '';");
    expect(code).toContain('value: value,');
    expect(code).toContain('inputValue: inputValue,');
    // `defaultValue` é o caminho do NÃO controlado: misturar os dois ensina um
    // campo que ninguém consegue reproduzir.
    expect(code).not.toContain('defaultValue');
  });

  it('liga os dois callbacks do modo controlado', () => {
    const code = controlledComboboxSnippet();
    expect(code).toContain('onValueChange: (next) => {');
    expect(code).toContain('onInputValueChange: (next) => {');
  });
});

describe('comboboxSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const plain = comboboxSource('<div data-slot="combobox">', {});
    const withChips = comboboxSource('<div data-slot="combobox">', {
      args: { multiple: true, chipsLayout: 'single-line', name: 'paises' },
    });
    expect(plain).not.toBe(withChips);
    expect(withChips).toContain('multiple: true');
    expect(withChips).toContain("chipsLayout: 'single-line'");
    expect(withChips).toContain("name: 'paises'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    const code = comboboxSource('<input role="combobox" aria-expanded="false">', {});
    expect(code).not.toContain('aria-expanded="false"');
  });
});

describe('comboboxSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = comboboxSourceWith({ disabled: true })('', { args: { disabled: false } });
    expect(code).toContain('disabled: true');
  });

  it('carrega a lista fixa da story para o painel', () => {
    const code = comboboxSourceWith({ items: ['Maçã'], label: 'Ingrediente' })('', {});
    expect(code).toContain("{ value: 'maca', label: 'Maçã' },");
    expect(code).toContain("label: 'Ingrediente'");
  });
});

describe('filterComboboxSource e controlledComboboxSource', () => {
  it('ignoram o HTML gerado e devolvem a forma própria de cada composição', () => {
    const filtered = filterComboboxSource()('<div data-slot="combobox">', {});
    expect(filtered).toContain('filter: (item: ComboboxItem, query: string) =>');
    expect(filtered).not.toContain('data-slot=');

    const controlled = controlledComboboxSource()('<div data-slot="combobox">', {});
    expect(controlled).toContain('combobox.setValue(value);');
    expect(controlled).not.toContain('data-slot=');
  });
});
