/**
 * Paleta acessível (WCAG 2.1 AA) sobre os fundos do app.
 * Razões de contraste calculadas contra #0F172A (página) e #1E293B (cartão).
 */
export const cores = {
  fundo: "#0F172A",
  cartao: "#1E293B",
  texto: "#FFFFFF", // 17.9:1 / 14.6:1
  textoSecundario: "#94A3B8", // 7.0:1 / 5.7:1  (substitui #64748B, que dava 3.75:1 / 3.07:1)
  textoSuave: "#CBD5E1", // 12.0:1 / 9.9:1
  link: "#60A5FA", // 7.0:1 / 5.8:1
  linkAlternativo: "#FB923C", // 7.9:1 / 6.5:1
  sucesso: "#34D399", // 9.3:1 / 7.6:1
  erro: "#F87171", // 6.5:1 / 5.3:1
  aviso: "#EAB308", // 9.3:1 / 7.6:1
  // Fundos de botão: texto branco com 5.2:1 ou mais
  botaoPrimario: "#2563EB", // 5.17:1
  botaoAlternativo: "#C2410C", // 5.18:1
  botaoNeutro: "#334155", // 10.35:1
  // Bordas de campos e controles (contraste não textual >= 3:1, SC 1.4.11)
  bordaControle: "#64748B", // 3.75:1
  bordaCartao: "#334155", // decorativa
  /** Texto sempre legível sobre os botões coloridos. */
  textoEmBotao: "#FFFFFF",
} as const;

export const ALVO_MINIMO = 44; // dp/px – tamanho mínimo recomendado de alvo de toque
