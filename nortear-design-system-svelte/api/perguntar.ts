/**
 * A função que responde ao chat da documentação desta stack.
 *
 * O corpo inteiro vive em `docs/shared/chat-docs/servidor.ts`, e este arquivo é
 * só o endereço: as cinco stacks se implantam sozinhas, cada uma no seu
 * domínio, e cada uma precisa servir `/api/perguntar` da PRÓPRIA origem — sem
 * isso o widget faria pedido entre origens e dependeria do deploy de outra.
 *
 * Uma implementação, cinco endereços. O `config` acompanha porque é o runtime
 * da função, e a Vercel o lê deste arquivo, não do que ele importa.
 *
 * Para a Vercel enxergar o compartilhado, o projeto precisa de "Include source
 * files outside of the Root Directory" ligado: `docs/shared` é irmã da raiz
 * desta stack, não filha.
 */
export { default, config } from '../../docs/shared/chat-docs/servidor';
