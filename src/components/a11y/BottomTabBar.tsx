import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cores } from "./colors";

export type AbaId = "home" | "mensagens" | "notificacoes" | "carros";

type Props = {
  ativa: AbaId;
  temMensagemNaoLida?: boolean;
  temAlertaPendente?: boolean;
};

const ABAS: { id: AbaId; rota: string; titulo: string }[] = [
  { id: "home", rota: "/home", titulo: "Home" },
  { id: "mensagens", rota: "/mensagens", titulo: "Chats" },
  { id: "notificacoes", rota: "/notificacoes", titulo: "Alertas" },
  { id: "carros", rota: "/carros", titulo: "Carros" },
];

/**
 * Barra de navegação única, usada nas 4 telas principais (antes estava copiada 4x).
 * - Cada aba é um controle focável por teclado com papel "tab" e estado "selected" (SC 2.1.1, 4.1.2).
 * - A aba ativa é indicada por sublinhado + negrito, não só por opacidade (SC 1.4.1).
 * - Os indicadores de pendência entram no nome acessível, não só como bolinha vermelha (SC 1.4.1, 1.3.3).
 * - Texto 12px e alvo >= 44px (SC 1.4.4, boas práticas 2.5.5).
 */
export default function BottomTabBar({
  ativa,
  temMensagemNaoLida,
  temAlertaPendente,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      {ABAS.map((aba) => {
        const selecionada = aba.id === ativa;
        const pendente =
          (aba.id === "mensagens" && temMensagemNaoLida) ||
          (aba.id === "notificacoes" && temAlertaPendente);

        const nome = `${aba.titulo}${
          pendente
            ? aba.id === "mensagens"
              ? ", há mensagens não lidas"
              : ", há alertas pendentes"
            : ""
        }`;

        return (
          <Pressable
            key={aba.id}
            onPress={() => !selecionada && router.replace(aba.rota as any)}
            accessible
            accessibilityRole="tab"
            accessibilityLabel={nome}
            accessibilityState={{ selected: selecionada }}
            style={({ focused }: any) => [styles.aba, focused && styles.focada]}
          >
            <View>
              {aba.id === "carros" ? (
                <Ionicons name="car-sport" size={26} color={cores.texto} />
              ) : (
                <Feather
                  name={
                    aba.id === "home"
                      ? "home"
                      : aba.id === "mensagens"
                        ? "message-circle"
                        : "bell"
                  }
                  size={24}
                  color={selecionada ? cores.texto : cores.textoSecundario}
                />
              )}
              {pendente && <View style={styles.badge} />}
            </View>
            <Text
              style={[styles.texto, selecionada && styles.textoAtivo]}
              importantForAccessibility="no"
            >
              {aba.titulo}
            </Text>
            <View style={[styles.sublinhado, selecionada && styles.sublinhadoAtivo]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: cores.fundo,
    borderTopWidth: 1,
    borderTopColor: cores.bordaCartao,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  aba: {
    minWidth: 64,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  focada: { borderWidth: 2, borderColor: "#FFFFFF" },
  texto: { color: cores.textoSecundario, fontSize: 12 },
  textoAtivo: { color: cores.texto, fontWeight: "700" },
  sublinhado: { height: 3, width: 24, borderRadius: 2, backgroundColor: "transparent" },
  sublinhadoAtivo: { backgroundColor: cores.link },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: cores.erro,
  },
});
