import React from "react";
import { YStack, XStack, Text } from "tamagui";
import { Feather } from "@expo/vector-icons";
import { cores } from "./colors";

export function validarSenha(senha: string) {
  const reqs = {
    tamanho: senha.length >= 6,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[@#$%^&+=!]/.test(senha),
  };
  return { ...reqs, valida: Object.values(reqs).every(Boolean) };
}

function Requisito({ atende, texto }: { atende: boolean; texto: string }) {
  return (
    <XStack
      ai="center"
      gap="$2"
      mb="$1"
      accessible
      accessibilityLabel={`${texto}: ${atende ? "cumprido" : "pendente"}`}
    >
      {/* O estado não depende só da cor: ícone diferente + texto lido ao leitor de tela */}
      <Feather
        name={atende ? "check-circle" : "circle"}
        size={16}
        color={atende ? cores.sucesso : cores.textoSecundario}
      />
      <Text color={atende ? cores.sucesso : cores.textoSecundario} fontSize="$3">
        {texto}
      </Text>
    </XStack>
  );
}

/** Checklist de requisitos. Atualizações são anunciadas educadamente (SC 4.1.3). */
export default function RequisitosSenha({ senha }: { senha: string }) {
  const v = validarSenha(senha);
  return (
    <YStack
      bg={cores.fundo}
      p="$3"
      br="$3"
      borderWidth={1}
      borderColor={v.valida ? cores.sucesso : cores.bordaControle}
      accessibilityRole="summary"
      accessibilityLabel="Requisitos da senha"
      accessibilityLiveRegion="polite"
    >
      <Requisito atende={v.tamanho} texto="Pelo menos 6 caracteres" />
      <Requisito atende={v.maiuscula} texto="Uma letra maiúscula" />
      <Requisito atende={v.minuscula} texto="Uma letra minúscula" />
      <Requisito atende={v.numero} texto="Um número" />
      <Requisito atende={v.especial} texto="Um caractere especial (@#$%^&+=!)" />
    </YStack>
  );
}
