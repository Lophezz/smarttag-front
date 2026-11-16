import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { YStack, Spinner } from "tamagui";
import api from "../services/api";
import { useCores } from "../components/a11y/AccessibilityMenu";

export default function Index() {
  const cores = useCores();
  const [destino, setDestino] = useState<"/home" | "/login" | null>(null);

  useEffect(() => {
    let ativo = true;
    // Se já existe sessão válida, vai direto para a Home; senão, login.
    // O timeout evita ficar preso na tela de carregamento se o servidor demorar.
    api
      .get("/auth/me", { timeout: 8000 })
      .then(() => ativo && setDestino("/home"))
      .catch(() => ativo && setDestino("/login"));
    return () => {
      ativo = false;
    };
  }, []);

  if (!destino) {
    return (
      <YStack
        f={1}
        jc="center"
        ai="center"
        bg={cores.fundo}
        accessible
        accessibilityLabel="Carregando"
        accessibilityLiveRegion="polite"
      >
        <Spinner size="large" color={cores.link} />
      </YStack>
    );
  }

  return <Redirect href={destino} />;
}