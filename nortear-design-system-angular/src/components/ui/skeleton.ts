import { Directive, input } from '@angular/core';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-skeleton (docs/shared/styles/nds/skeleton.css), que já
// traz o pulso e o respeito a `prefers-reduced-motion`.
//
// Sem dimensão própria e sem inputs de tamanho: a caixa vem de `data-shape`,
// `data-width` e `data-size`, e a folha continua dona de todas as medidas —
// dimensão fixa no componente daria sempre o retângulo errado, e valor de design
// em `style` deixaria tema, densidade e escala de texto para trás.
//
// `aria-hidden` fixo, não configurável: o esqueleto é ruído para leitor de tela.
// Quem anuncia o carregamento é a REGIÃO que espera o conteúdo — e ela é peça
// desta casa, o `NdsSkeletonRegion` abaixo.

@Directive({
  selector: 'div[ndsSkeleton]',
  standalone: true,
  host: {
    class: 'nds-skeleton',
    '[attr.data-slot]': '"skeleton"',
    '[attr.aria-hidden]': '"true"',
  },
})
export class NdsSkeleton {}

// ─── NdsSkeletonRegion ────────────────────────────────────────────────────────
//
// A região que ESPERA o conteúdo, e que é quem fala: o esqueleto sai
// `aria-hidden`, então sem ela o carregamento não é anunciado a ninguém.
//
// Existe como peça porque o trio é indivisível e vinha sendo remontado à mão em
// cada superfície — cinco stacks, cinco formas diferentes do mesmo contêiner:
//
// - `role="status"`, porque `aria-busy` sozinho num `div` sem papel não é
//   anunciado;
// - `aria-busy="true"`, que é o estado;
// - nome acessível por `aria-label`, porque nome em elemento sem papel é
//   atributo proibido — o leitor de tela o descarta e o axe acusa
//   `aria-prohibited-attr`.
//
// `label` é obrigatório de propósito: região sem nome é o defeito que esta peça
// existe para impedir, e um default genérico o esconderia.
//
// Sem CSS própria: quem compõe põe `nds-stack`/`nds-grid` no próprio elemento,
// porque o arranjo é do bloco que carrega, não da região. E é diretiva, não
// componente — não há markup a montar nem conteúdo a projetar além do que já
// está no template de quem usa.
//
// UMA região por BLOCO, nunca por peça: cinco itens de três esqueletos cada
// viriam a ser quinze avisos repetindo a mesma frase.

@Directive({
  selector: 'div[ndsSkeletonRegion]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"skeleton-region"',
    '[attr.role]': '"status"',
    '[attr.aria-busy]': '"true"',
    '[attr.aria-label]': 'label()',
  },
})
export class NdsSkeletonRegion {
  /** O que está carregando, por extenso — vira o nome acessível da região. */
  readonly label = input.required<string>();
}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_SKELETON = [NdsSkeleton, NdsSkeletonRegion] as const;
