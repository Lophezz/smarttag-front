import React, { useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Alert } from "react-native";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarNotificacoes();
    }, []),
  );

  const carregarNotificacoes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/auth/notify");
      const alertasOrdenados = response.data.reverse();
      setNotificacoes(alertasOrdenados);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      Alert.alert("Erro", "Não foi possível carregar os alertas.");
    } finally {
      setIsLoading(false);
    }
  };

  const avaliarNotificacao = async (id: string, isUtil: boolean) => {
    try {
      const response = await api.post(`/auth/notify/${id}`, {
        isMessageUtil: isUtil,
      });
      Alert.alert("Avaliação enviada", response.data);
      carregarNotificacoes();
    } catch (error: any) {
      console.error("Erro ao avaliar:", error);
      Alert.alert(
        "Ops",
        error.response?.data?.message ||
          "Não foi possível avaliar este alerta. Ele já pode ter sido avaliado.",
      );
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const data = new Date(dataStr);
    return (
      data.toLocaleDateString("pt-BR") +
      " às " +
      data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Trata o enum que vem do backend para um texto amigável
  const formatarStatus = (status: string) => {
    if (!status) return "Anônimo";
    if (
      status.toLowerCase() === "anônimo" ||
      status.toLowerCase() === "anonimo"
    )
      return "Anônimo";
    const formatado = status.replace(/_/g, " ").toLowerCase();
    return formatado.charAt(0).toUpperCase() + formatado.slice(1);
  };

  // Define a cor com base no nível de confiança do cidadão
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("lendario")) return "#F59E0B"; // Dourado
    if (s.includes("confiavel")) return "#10B981"; // Verde
    if (s.includes("risco")) return "#EF4444"; // Vermelho
    return "#94A3B8"; // Cinzento para Novato/Anônimo
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack
        px="$6"
        pt="$8"
        pb="$4"
        jc="space-between"
        ai="center"
        accessible={true}
        accessibilityRole="header"
      >
        <Text fontSize="$7" fontWeight="bold" color="white">
          Meus Alertas
        </Text>
      </XStack>

      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {notificacoes.length === 0 ? (
            <YStack
              ai="center"
              mt="$10"
              gap="$4"
              accessible={true}
              accessibilityLabel="Nenhum alerta recebido no momento."
            >
              <Feather name="bell-off" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">
                Nenhum alerta recebido.
              </Text>
            </YStack>
          ) : (
            notificacoes.map((alerta) => {
              const statusFormatado = formatarStatus(alerta.citizienStatus);
              const statusColor = getStatusColor(alerta.citizienStatus);

              return (
                <YStack
                  key={alerta.id}
                  bg="#1E293B"
                  br="$4"
                  p="$4"
                  mb="$4"
                  borderWidth={1}
                  borderColor="#334155"
                  gap="$3"
                  accessible={true}
                  accessibilityLabel={`Alerta para o veículo ${alerta.notifyCarDTO?.modelo}, placa ${alerta.notifyCarDTO?.placa}. Mensagem: ${alerta.mensagem}. Enviado por: ${statusFormatado}.`}
                >
                  <XStack jc="space-between" ai="flex-start">
                    <YStack f={1} pr="$2">
                      <XStack ai="center" gap="$2">
                        <Ionicons name="warning" size={20} color="#EAB308" />
                        <Text color="white" fontSize="$5" fontWeight="bold">
                          Alerta Recebido
                        </Text>
                      </XStack>
                      <Text color="#94A3B8" fontSize="$2" mt="$1">
                        {formatarData(alerta.dataEnvio)}
                      </Text>
                    </YStack>

                    {/* NOVO: Exibição do Status do Remetente */}
                    <YStack ai="flex-end">
                      <Text color="#64748B" fontSize={10}>
                        Enviado por:
                      </Text>
                      <Text color={statusColor} fontSize="$2" fontWeight="bold">
                        {statusFormatado}
                      </Text>
                    </YStack>
                  </XStack>

                  <YStack bg="#0F172A" p="$3" br="$3" gap="$1">
                    <Text color="#94A3B8" fontSize="$3">
                      Veículo: {alerta.notifyCarDTO?.modelo} -{" "}
                      {alerta.notifyCarDTO?.placa}
                    </Text>
                    <Text color="white" fontSize="$4" mt="$1">
                      {alerta.mensagem}
                    </Text>
                  </YStack>

                  {/* BOTÕES DE AVALIAÇÃO COM ACESSIBILIDADE */}
                  <XStack gap="$3" mt="$2">
                    <Button
                      f={1}
                      size="$3"
                      bg="#10B981"
                      color="white"
                      pressStyle={{ scale: 0.97 }}
                      onPress={() => avaliarNotificacao(alerta.id, true)}
                      accessibilityRole="button"
                      accessibilityLabel="Avaliar alerta como útil e dar 5 pontos"
                    >
                      Útil (+5 pts)
                    </Button>
                    <Button
                      f={1}
                      size="$3"
                      bg="transparent"
                      color="$red10"
                      borderWidth={1}
                      borderColor="$red10"
                      pressStyle={{ scale: 0.97 }}
                      onPress={() => avaliarNotificacao(alerta.id, false)}
                      accessibilityRole="button"
                      accessibilityLabel="Avaliar alerta como falso e remover 5 pontos"
                    >
                      Falso (-5 pts)
                    </Button>
                  </XStack>
                </YStack>
              );
            })
          )}
        </ScrollView>
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack
        bg="#0F172A"
        pt="$3"
        pb="$5"
        px="$6"
        jc="space-between"
        borderTopWidth={1}
        borderTopColor="#1E293B"
      >
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/home")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Home"
        >
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Home
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={1}
          onPress={() => router.replace("/mensagens")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba atual: Mensagens"
        >
          <Feather name="message-circle" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Chats
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/notificacoes")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Alertas"
        >
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Alertas
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/carros")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Carros"
        >
          <Ionicons name="car-sport-outline" size={26} color="white" />
          <Text color="white" fontSize={10}>
            Carros
          </Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}
