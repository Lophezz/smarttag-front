import React from "react";
import { XStack, Text } from "tamagui";
import { Feather } from "@expo/vector-icons";
import IconButton from "./IconButton";
import { cores } from "./colors";

type Props = {
  titulo: string;
  /** Botão de voltar à esquerda. */
  onVoltar?: () => void;
  /** Ação à direita (ex.: atualizar). */
  acao?: { icone: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void };
};

/**
 * Cabeçalho de tela. O papel "header" fica SÓ no título: se o container inteiro
 * fosse accessible/header, os botões dentro dele ficariam inalcançáveis por
 * leitores de tela (SC 4.1.2, 2.1.1).
 */
export default function Cabecalho({ titulo, onVoltar, acao }: Props) {
  return (
    <XStack px="$6" pt="$8" pb="$4" jc="space-between" ai="center" gap="$3">
      {onVoltar && (
        <IconButton label="Voltar" onPress={onVoltar}>
          <Feather name="arrow-left" size={24} color={cores.textoSuave} />
        </IconButton>
      )}
      <Text
        f={1}
        fontSize="$7"
        fontWeight="bold"
        color="white"
        accessibilityRole="header"
      >
        {titulo}
      </Text>
      {acao && (
        <IconButton label={acao.label} onPress={acao.onPress}>
          <Feather name={acao.icone} size={22} color={cores.textoSuave} />
        </IconButton>
      )}
    </XStack>
  );
}
