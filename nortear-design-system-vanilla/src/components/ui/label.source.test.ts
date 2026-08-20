import { describe, expect, it } from 'vitest';
import {
  labelBlocoDesabilitadoSnippet,
  labelComCaixaSnippet,
  labelObrigatorioSnippet,
  labelSnippet,
  labelSource,
  labelSourceCom,
} from './label.source';

describe('labelSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = labelSnippet();
    expect(código).toContain("import { createLabel } from '@/components/ui/label';");
    expect(código).toContain('createLabel({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<label');
  });

  it('sai com o controle que o rótulo nomeia — sozinho ele não associa nada', () => {
    const código = labelSnippet();
    expect(código).toContain("createLabel({ text: 'Nome completo', htmlFor: 'campo' })");
    expect(código).toContain("createInput({ id: 'campo' })");
    expect(código).toContain("document.querySelector('#app')?.append(rotulo, campo);");
  });

  it('usa a opção canônica `class`, nunca o apelido depreciado', () => {
    // `className` é o nome do control da story e sobrevive só como apelido
    // `@deprecated` na fábrica: ensiná-lo perpetuaria o que está de saída.
    const código = labelSnippet({ className: 'nds-text-caption' });
    expect(código).toContain("class: 'nds-text-caption'");
    expect(código).not.toContain('className');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = labelSnippet();
    expect(código).not.toContain('class:');
    expect(código).not.toContain('type');
    expect(código).not.toContain('disabled');
  });

  it('marca o CONTROLE com nds-peer e o põe antes do rótulo quando bloqueado', () => {
    // O rótulo não recebe classe nenhuma: quem reage é o `.nds-label`, casando
    // no irmão marcado. Sem a ordem, a regra não alcança.
    const código = labelSnippet({ text: 'CPF', htmlFor: 'cpf', disabled: true });
    expect(código).toContain("class: 'nds-peer'");
    expect(código).toContain('disabled: true');
    expect(código).toContain("document.querySelector('#app')?.append(campo, rotulo);");
  });
});

describe('labelObrigatorioSnippet', () => {
  it('deixa o asterisco decorativo e a obrigatoriedade no controle', () => {
    const código = labelObrigatorioSnippet();
    expect(código).toContain("marcador.setAttribute('aria-hidden', 'true');");
    expect(código).toContain("rotulo.append('Email profissional', marcador);");
    expect(código).toContain("campo.setAttribute('aria-required', 'true');");
    // O texto entra pelo `append`, e não por `text:`, senão o asterisco ficaria
    // antes do rótulo.
    expect(código).not.toContain('text:');
  });
});

describe('labelBlocoDesabilitadoSnippet', () => {
  it('desabilita pelo ancestral, e não peça por peça', () => {
    const código = labelBlocoDesabilitadoSnippet();
    expect(código).toContain("bloco.dataset.disabled = 'true';");
    expect(código).toContain("createLabel({ text: 'Documento', htmlFor: 'documento' })");
    expect(código).toContain('append(bloco)');
  });
});

describe('labelComCaixaSnippet', () => {
  it('usa a fábrica da caixa, e só o par for/id', () => {
    const código = labelComCaixaSnippet();
    expect(código).toContain("import { createCheckbox } from '@/components/ui/checkbox';");
    expect(código).toContain("createCheckbox({ id: 'termos' })");
    expect(código).toContain("htmlFor: 'termos'");
    // Nada de ouvinte reenviando o clique: a caixa é um <button>, e a
    // associação nativa basta.
    expect(código).not.toContain('addEventListener');
  });
});

describe('labelSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = labelSource('<label data-slot="label">', {});
    const outro = labelSource('<label data-slot="label">', {
      args: { text: 'Telefone', className: 'nds-text-caption' },
    });
    expect(padrão).not.toBe(outro);
    expect(outro).toContain("text: 'Telefone'");
    expect(outro).toContain("class: 'nds-text-caption'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(labelSource('<label data-slot="label" for="x">Nome</label>', {})).not.toContain('for="x"');
  });
});

describe('labelSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = labelSourceCom({ text: 'CPF', disabled: true })('', { args: { text: 'Nome' } });
    expect(código).toContain("text: 'CPF'");
    expect(código).toContain("class: 'nds-peer'");
  });
});
