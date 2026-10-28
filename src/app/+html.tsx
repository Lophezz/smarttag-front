import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Documento HTML raiz (web).
 * - lang="pt-BR": leitores de tela usam a pronúncia correta (SC 3.1.1).
 * - viewport SEM user-scalable=no / maximum-scale: permite zoom até 200% (SC 1.4.4, 1.4.10).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body { background-color: #0F172A; }
              /* Foco visível global para qualquer elemento navegável por teclado (SC 2.4.7) */
              :focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
              /* Respeita preferência de reduzir movimento (SC 2.3.3 / boas práticas) */
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
