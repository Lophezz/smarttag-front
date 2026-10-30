import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCores } from "./AccessibilityMenu";

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

export default function BottomTabBar({
  ativa,
  temMensagemNaoLida,
  temAlertaPendente,
}: Props) {
  const insets = useSafeAreaInsets();
  const cores = useCores();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barra,
        {
          backgroundColor: cores.cartao,
          borderTopColor: cores.bordaCartao,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
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
        const corIconeETexto = selecionada ? cores.texto : cores.textoSecundario;

        return (
          <Pressable
            key={aba.id}
            onPress={() => !selecionada && router.replace(aba.rota as any)}
            accessible
            accessibilityRole="tab"
            accessibilityLabel={nome}
            accessibilityState={{ selected: selecionada }}
            style={({ focused }: any) => [
              styles.aba,
              focused && { borderWidth: 2, borderColor: cores.link },
            ]}
          >
            <View>
              {aba.id === "carros" ? (
                <Ionicons name="car-sport" size={26} color={corIconeETexto} />
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
                  color={corIconeETexto}
                />
              )}
              {pendente && (
                <View style={[styles.badge, { backgroundColor: cores.erro }]} />
              )}
            </View>
            <Text
              style={[
                styles.texto,
                { color: corIconeETexto },
                selecionada && styles.textoAtivo,
              ]}
              importantForAccessibility="no"
            >
              {aba.titulo}
            </Text>
            <View
              style={[
                styles.sublinhado,
                selecionada && { backgroundColor: cores.link },
              ]}
            />
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
    borderTopWidth: 1,
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
  texto: { fontSize: 12 },
  textoAtivo: { fontWeight: "700" },
  sublinhado: { height: 3, width: 24, borderRadius: 2, backgroundColor: "transparent" },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});