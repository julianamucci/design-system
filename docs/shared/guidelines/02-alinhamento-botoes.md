# Alinhamento de grupos de botões

Regra transversal: vale em qualquer lugar onde dois ou mais botões aparecem
juntos — card, formulário, dialog, drawer, sheet, alert-dialog, rodapé de seção.

Este é o texto canônico. A seção "Alinhamento de Grupos de Botões" da
`04-padroes-design-sistema.md` aponta para cá.

---

## A regra, nos dois eixos

| eixo | onde fica o primário |
|---|---|
| empilhado (uma coluna) | **em cima** |
| lado a lado (uma linha) | **à direita** |

Os secundários seguem por ordem de importância, do primário para longe.

## A variante DIZ a posição — e é uma tabela só

A ordem não é escolha de cada componente: ela sai da variante, e a variante sai
da importância da ação. A tabela é a de
[`<stack>/guidelines/06-form-components.md`](../../nortear-design-system-vanilla/guidelines/06-form-components.md),
seção "Variantes":

| variante | importância | posição no DOM | onde aparece |
|---|---|---|---|
| `default` | primária | **último** | topo empilhado · direita deitado |
| `outline` | secundária | meio | |
| `ghost` | terciária | **primeiro** | base empilhado · esquerda deitado |

Um rodapé de três ações é, portanto, `[ghost, outline, default]` na marcação —
sempre, em dialog, sheet, drawer e alert-dialog. Com dois, é `[outline,
default]`.

**Esta tabela existe porque a lacuna entre as duas guidelines produziu um
defeito.** A `02` dizia "ordem de importância, do primário para longe", correto;
a `06` dizia "ghost = ação terciária", correto; e nenhuma das duas se citava.
No meio ficou o `showCloseButton` do rodapé do Dialog, que cravava `outline`
para o botão de fechar — a ação MENOS importante das três — porque a descrição
dele em três lugares o chamava de "ação secundária". Duas regras certas, um
nome errado entre elas, e o resultado foi dois pesos iguais para ações de
importância diferente.

O sinal de que era defeito estava à vista e foi lido ao contrário: **as cinco
stacks abandonaram a prop e escreveram o botão à mão em `ghost`, cada uma por
conta.** Cinco implementações independentes convergindo contra o primitivo não
é preferência de quem escreveu — é o primitivo entregando a coisa errada.
Corrigido em 2026-09-08; a prop voltou a ser usada nas quatro.

## Uma ordem de DOM serve aos dois eixos

E é a parte contraintuitiva, por isso está em destaque:

> **No DOM, os secundários vêm PRIMEIRO e o primário vem POR ÚLTIMO.**

```css
.nds-<slug>-footer {
  display: flex;
  flex-direction: column-reverse;   /* empilhado: o último do DOM sobe ao topo */
  gap: var(--spacing-2);
}

@media (min-width: 40rem) {
  .nds-<slug>-footer {
    flex-direction: row;            /* deitado: o último do DOM vai à direita */
    justify-content: flex-end;
  }
}
```

`column-reverse` é o que faz uma única ordem de marcação servir às duas
leituras. Sem ele seriam duas ordens de DOM para o mesmo grupo, e a ordem de
tabulação mudaria com a largura da tela.

```html
<!-- CORRETO -->
<div class="nds-dialog-footer">
  <button class="nds-button nds-button-outline">Cancelar</button>
  <button class="nds-button">Salvar alterações</button>
</div>
```

## O foco entra no secundário — só em confirmação

Onde a decisão É a tela (alert-dialog, drawer e sheet de confirmação), o foco
inicial vai ao **cancelar**: a saída segura é o padrão, e confirmar exige um
gesto deliberado.

Onde o painel tem formulário, o foco entra no **primeiro campo** — mandar o foco
para "Cancelar" ali obrigaria a tabular de volta a tela inteira antes de digitar.

## Em painel com formulário, o `<form>` envolve o rodapé

O `<form>` envolve o corpo **e** o rodapé, e a ação primária é `type="submit"`
dentro dele. Vale para dialog, sheet, drawer e popover — qualquer overlay que
receba campos.

```html
<form>
  <div class="nds-dialog-body"><!-- campos --></div>
  <div class="nds-dialog-footer">
    <button type="button" class="nds-button nds-button-outline">Cancelar</button>
    <button type="submit" class="nds-button">Salvar alterações</button>
  </div>
</form>
```

`type="submit"` fora do `<form>` é **botão inerte**: não submete, e o Enter num
campo não dispara nada. Continua clicável e com a aparência certa, então nada na
tela denuncia — e nenhum type-checker das cinco stacks alcança, porque o markup
é válido.

Quando a estrutura não permitir aninhar (o rodapé é irmão do corpo por
construção do primitivo), religue explicitamente com `form="<id>"` no botão.

Portão: `submit_fora_do_form` no `audit.mjs` cobre o conteúdo compartilhado, que
é onde o defeito custa mais caro — snippet copiado leva o erro para o produto de
quem copiou. **No código de stack, quem cobre é a suíte**: leia `button.form`,
que vem vazio quando o botão está órfão. A varredura estática foi tentada e
retirada; o motivo está registrado em `scripts/audit.mjs`, junto da regra.

---

## Por que estas regras têm portão, e o que os defeitos ensinaram

**Nenhum compilador vê ordem entre irmãos.** Nem asserção por papel ou por
texto: a ordem só existe como posição. Em setembro de 2026 as quatro stacks que
ofereciam botão de fechar no rodapé o renderizavam DEPOIS dos filhos, o que o
punha na posição do primário; e a story do vanilla montava `[Voltar, Continuar,
Fechar]`, deixando o primário no meio.

**O que guardava o defeito eram os documentos.** Quatro textos afirmavam que o
botão de fechar ficava "abaixo das ações" — duas chaves de conteúdo, um docblock
e uma tabela de API. Quem conferisse pela leitura encontrava quatro documentos
concordando entre si; o desacordo era com a folha, que nenhum dos quatro citava.

**Esta guideline também apodreceu.** Até 2026-09-08 ela prescrevia
`flex flex-row-reverse gap-2`, `justify-end` e `ml-auto` — vocabulário do
Tailwind, que saiu do projeto —, não falava do eixo empilhado (onde o defeito
vivia) e contradizia o que as folhas fazem. E a mesma regra vivia em DOIS
arquivos, o que é como as duas cópias apodreceram sem ninguém notar: quem
corrigia uma não sabia da outra.
