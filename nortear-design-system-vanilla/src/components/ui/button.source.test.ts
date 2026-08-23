import { describe, expect, it } from 'vitest';
import {
  buttonAsLinkSnippet,
  actionsButtonPairSnippet,
  buttonPlaygroundSource,
  buttonSnippet,
  buttonSource,
  buttonSourceWith,
} from './button.source';

describe('buttonSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = buttonSnippet({ label: 'Salvar' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createButton({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<button');
    expect(code).not.toContain('class="nds-button');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const code = buttonSnippet({ size: 'icon', ariaLabel: 'Adicionar item', icon: 'plus' });
    expect(code).toContain("'aria-label': 'Adicionar item'");
    expect(code).not.toContain('ariaLabel');
    expect(code).not.toContain('ariaBusy');
    expect(code).not.toContain('ariaInvalid');
  });

  it('escreve as marcas de estado com o nome do atributo', () => {
    const code = buttonSnippet({ label: 'Salvando…', disabled: true, ariaBusy: true });
    expect(code).toContain("'aria-busy': true");
    expect(code).toContain('disabled: true');
    expect(buttonSnippet({ label: 'X', ariaInvalid: true })).toContain("'aria-invalid': true");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = buttonSnippet({ label: 'Salvar', variant: 'default', size: 'default' });
    expect(code).toBe(buttonSnippet({ label: 'Salvar' }));
    expect(code).not.toContain('variant');
    expect(code).not.toContain('size');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('type');
  });

  it('mostra variante e tamanho quando a story os usa', () => {
    const code = buttonSnippet({ variant: 'destructive', size: 'lg', label: 'Excluir conta' });
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("size: 'lg'");
  });

  it('com ícone E texto, o texto sai de `label` e a ordem se decide no append', () => {
    // A fábrica escreve o `label` ANTES de qualquer filho entrar: com os dois,
    // o rótulo dado por opção sempre ficaria à frente do ícone.
    const esquerda = buttonSnippet({ icon: 'plus', label: 'Adicionar item' });
    expect(esquerda).toContain('createButtonIcon');
    expect(esquerda).not.toContain("label: 'Adicionar item'");
    expect(esquerda).toContain("rotulo.textContent = 'Adicionar item';");
    expect(esquerda).toContain("botao.append(createButtonIcon('plus'), rotulo);");

    const direita = buttonSnippet({
      icon: 'chevron-right',
      iconSide: 'right',
      label: 'Próximo',
    });
    expect(direita).toContain("botao.append(rotulo, createButtonIcon('chevron-right'));");
  });

  it('sem texto visível, o ícone é o conteúdo inteiro', () => {
    const code = buttonSnippet({ size: 'icon', ariaLabel: 'Baixar arquivo', icon: 'download' });
    expect(code).toContain("botao.appendChild(createButtonIcon('download'));");
    expect(code).not.toContain('rotulo');
  });

  it('o ícone em rotação só aparece quando a story o pede', () => {
    expect(buttonSnippet({ icon: 'loader', label: 'Salvando…' })).toContain(
      "createButtonIcon('loader')",
    );
    expect(buttonSnippet({ icon: 'loader', iconSpin: true, label: 'Salvando…' })).toContain(
      "createButtonIcon('loader', { spin: true })",
    );
  });

  it('distingue conteúdo em string de conteúdo em elemento', () => {
    const emString = buttonSnippet({ children: '<strong>Salvar</strong>' });
    expect(emString).toContain("children: '<strong>Salvar</strong>'");
    expect(emString).toContain('sanitizado');
    // Vetor de teste não vira recomendação.
    expect(emString).not.toContain('onerror');

    const emElemento = buttonSnippet({ childrenElement: 'Salvar' });
    expect(emElemento).toContain("conteudo.textContent = 'Salvar';");
    expect(emElemento).toContain('children: conteudo');
  });

  it('não deixa o espião do control vazar como código', () => {
    // `args.onClick` é uma FUNÇÃO no Playground; interpolada, o corpo do mock
    // apareceria no painel Code.
    const code = buttonSnippet({
      label: 'Salvar',
      onClick: (() => {}) as unknown as string,
    });
    expect(code).not.toContain('onClick');
    expect(buttonSnippet({ label: 'Salvar', onClick: '() => salvar()' })).toContain(
      'onClick: () => salvar()',
    );
  });
});

describe('buttonSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = buttonSource('<button data-slot="button">', {});
    const withArgs = buttonSource('<button data-slot="button">', {
      args: { variant: 'outline', label: 'Cancelar' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(noArgs).toContain("label: 'Salvar'");
    expect(withArgs).toContain("variant: 'outline'");
    expect(withArgs).toContain("label: 'Cancelar'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(buttonSource('<button class="nds-button nds-button-default">Salvar</button>', {})).not.toContain(
      'nds-button-default',
    );
  });
});

describe('buttonPlaygroundSource', () => {
  it('nos tamanhos de ícone, o texto do control vira o nome acessível', () => {
    const withText = buttonPlaygroundSource('', { args: { size: 'sm', label: 'Salvar' } });
    expect(withText).toContain("label: 'Salvar'");
    expect(withText).not.toContain('aria-label');

    const soIcon = buttonPlaygroundSource('', { args: { size: 'icon', label: 'Adicionar' } });
    expect(soIcon).toContain("'aria-label': 'Adicionar'");
    expect(soIcon).not.toContain("label: 'Adicionar'");
    expect(soIcon).toContain("createButtonIcon('plus')");
  });
});

describe('buttonSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = buttonSourceWith({ variant: 'ghost', label: 'Fechar' });
    const code = transform('', { args: { variant: 'destructive', label: 'Excluir' } });
    expect(code).toContain("variant: 'ghost'");
    expect(code).toContain("label: 'Fechar'");
    expect(code).not.toContain('destructive');
  });

  it('`label: undefined` apaga o padrão em vez de reintroduzi-lo', () => {
    const transform = buttonSourceWith({ label: undefined, ariaLabel: 'Baixar', size: 'icon' });
    const code = transform('', {});
    expect(code).not.toContain("label: 'Salvar'");
    expect(code).toContain("'aria-label': 'Baixar'");
  });
});

describe('buttonParDeAcoesSnippet', () => {
  it('mostra os dois botões e o contêiner que fixa a ordem', () => {
    const code = actionsButtonPairSnippet();
    expect(code).toContain("variant: 'outline', label: 'Cancelar'");
    expect(code).toContain("createButton({ label: 'Confirmar' })");
    expect(code).toContain("acoes.className = 'nds-cluster';");
    // A primária é a última: é a ordem que a composição ensina.
    expect(code.indexOf('Cancelar')).toBeLessThan(code.indexOf('Confirmar'));
    expect(code).not.toContain('data-slot=');
  });
});

describe('buttonComoLinkSnippet', () => {
  it('empresta a aparência sem trocar a semântica', () => {
    const code = buttonAsLinkSnippet();
    expect(code).toContain("import { btnClass } from '@/components/ui/button';");
    expect(code).toContain("document.createElement('a')");
    expect(code).toContain("btnClass('link')");
    // `createButton` daria um <button>, e o que se quer é NAVEGAR.
    expect(code).not.toContain('createButton(');
    // O tamanho padrão não entra: `btnClass` já o assume.
    expect(code).not.toContain("btnClass('link', 'default')");
  });
});
