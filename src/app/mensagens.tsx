import React, { useState, useCallback } from "react";
import { ScrollView, Alert, Image, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";

export default function Mensagens() {
  const insets = useSafeAreaInsets();
  const [conversas, setConversas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarConversas();
    }, []),
  );

  const carregarConversas = async () => {
    setIsLoading(true);
    try {
      // Endpoint criado pelo Kevin para listar as últimas mensagens agrupadas
      const response = await api.get("/messages/minhas-conversas");
      setConversas(response.data);
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
      Alert.alert("Erro", "Não foi possível carregar as suas mensagens.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const data = new Date(dataStr);
    const hoje = new Date();

    // Se for de hoje, mostra só a hora. Se for de outro dia, mostra a data.
    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const abrirChat = (
    sessionId: string,
    qrcode: string,
    modelo: string,
    placa: string,
  ) => {
    // Redireciona para o futuro ecrã de chat passando os dados na URL
    router.push({
      pathname: `/chat/[sessionId]` as any,
      params: { sessionId, qrcode, modelo, placa },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO */}
      <XStack
        px="$6"
        pt="$8"
        pb="$4"
        jc="space-between"
        ai="center"
        accessible={true}
        accessibilityRole="header"
      >
        <Text
          f={1}
          fontSize="$7"
          fontWeight="bold"
          color="white"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Minhas Conversas
        </Text>
        <Feather
          name="refresh-cw"
          size={20}
          color="#94A3B8"
          onPress={carregarConversas}
          accessibilityRole="button"
          accessibilityLabel="Atualizar conversas"
        />
      </XStack>

      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {conversas.length === 0 ? (
            <YStack
              ai="center"
              mt="$10"
              gap="$4"
              accessible={true}
              accessibilityLabel="Nenhuma conversa ativa encontrada."
            >
              <Feather name="message-square" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">
                Você não tem mensagens recentes.
              </Text>
            </YStack>
          ) : (
            conversas.map((conversa) => (
              <TouchableOpacity
                key={conversa.sessionId}
                activeOpacity={0.7}
                onPress={() =>
                  abrirChat(
                    conversa.sessionId,
                    conversa.qrcode,
                    conversa.modeloCarro,
                    conversa.placaCarro,
                  )
                }
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Conversa sobre o veículo ${conversa.modeloCarro}, placa ${conversa.placaCarro}. Última mensagem de ${conversa.sender}: ${conversa.conteudo}`}
                accessibilityHint="Tocar para abrir a sala de chat"
              >
                <XStack
                  bg="#1E293B"
                  p="$3"
                  br="$4"
                  mb="$3"
                  borderWidth={1}
                  borderColor="#334155"
                  ai="center"
                  gap="$3"
                >
                  {/* FOTO DO CARRO OU ÍCONE PADRÃO */}
                  {conversa.linkImageCarro ? (
                    <Image
                      source={{ uri: conversa.linkImageCarro }}
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                      accessible={false}
                    />
                  ) : (
                    <YStack
                      width={56}
                      height={56}
                      br={28}
                      bg="#0F172A"
                      jc="center"
                      ai="center"
                    >
                      <Ionicons name="car" size={24} color="#94A3B8" />
                    </YStack>
                  )}

                  {/* INFO DA CONVERSA */}
                  <YStack f={1} jc="center">
                    <XStack jc="space-between" ai="center" mb="$1">
                      <Text
                        color="white"
                        fontSize="$4"
                        fontWeight="bold"
                        numberOfLines={1}
                        f={1}
                        pr="$2"
                      >
                        {conversa.modeloCarro} ({conversa.placaCarro})
                      </Text>
                      <Text color="#64748B" fontSize="$2">
                        {formatarData(conversa.dataHora)}
                      </Text>
                    </XStack>

                    <Text color="#94A3B8" fontSize="$3" numberOfLines={1}>
                      <Text fontWeight="bold" color="#CBD5E1">
                        {conversa.sender}:{" "}
                      </Text>
                      {conversa.conteudo}
                    </Text>
                  </YStack>

                  {/* BOLINHA DE NÃO LIDO (Opcional - backend envia "lido") */}
                  {!conversa.lido && (
                    <YStack
                      width={10}
                      height={10}
                      br={5}
                      bg="$blue10"
                      ml="$2"
                    />
                  )}
                </XStack>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack
        bg="#0F172A"
        pt="$3"
        pb={Math.max(insets.bottom, 20)}
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
          accessibilityLabel="Aba atual: Chats"
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
          <Ionicons name="car-sport" size={26} color="white" />
          <Text color="white" fontSize={10}>
            Carros
          </Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}
