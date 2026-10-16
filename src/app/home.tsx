import React, { useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Alert } from "react-native";
import { YStack, XStack, Text, Avatar, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [usuario, setUsuario] = useState({
    nome: "",
    pontos: 0,
    status: "Novato",
  });

  const formatarStatus = (status: string) => {
    if (!status) return "Novato";
    const formatado = status.replace(/_/g, " ").toLowerCase();
    return formatado.charAt(0).toUpperCase() + formatado.slice(1);
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

  useFocusEffect(
    useCallback(() => {
      carregarDadosDaHome();
    }, []),
  );

  const carregarDadosDaHome = async () => {
    setIsLoading(true);
    try {
      // Fazemos as duas requisições simultaneamente para maior performance
      const [resUsuario, resHistorico] = await Promise.all([
        api.get("/auth/me"),
        api.get("/auth/history"),
      ]);

      const dados = resUsuario.data;
      setUsuario({
        nome: dados.nome || "Usuário",
        pontos: dados.pontos || 0,
        status: formatarStatus(dados.citizienStatus),
      });

      // Ordena o histórico para exibir do mais recente para o mais antigo
      const histOrdenado = resHistorico.data.sort(
        (a: any, b: any) =>
          new Date(b.data).getTime() - new Date(a.data).getTime(),
      );
      setHistorico(histOrdenado);

      // Pop-up para incentivar o preenchimento completo do perfil
      if (!dados.telefone || !dados.cpf) {
        Alert.alert(
          "Complete seu Cadastro",
          "Percebemos que os seus dados estão incompletos. Atualize o seu perfil para utilizar todos os recursos.",
          [
            { text: "Fazer Depois", style: "cancel" },
            {
              text: "Atualizar Agora",
              onPress: () => router.replace("/perfil"),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Erro ao carregar home:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack f={1} px="$5" pt="$8" pb="$4" gap="$6">
          {/* CABEÇALHO COM AVATAR */}
          <XStack
            ai="center"
            jc="space-between"
            accessible={true}
            accessibilityRole="header"
          >
            <XStack ai="center" gap="$3">
              <Avatar
                circular
                size="$6"
                accessible={true}
                accessibilityLabel={`Iniciais do usuário: ${usuario.nome ? usuario.nome.charAt(0) : "U"}`}
              >
                <Avatar.Fallback bg="$blue10" jc="center" ai="center">
                  <Text color="white" fontSize="$5" fontWeight="bold">
                    {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              {isLoading ? (
                <Spinner size="small" color="$blue10" />
              ) : (
                <Text color="white" fontSize="$5" fontWeight="600">
                  {usuario.nome}
                </Text>
              )}
            </XStack>

            <Feather
              name="settings"
              size={24}
              color="#94A3B8"
              onPress={() => router.replace("/perfil")}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Configurações do perfil"
              accessibilityHint="Tocar para ir à tela de edição de perfil"
            />
          </XStack>

          {/* STATUS DE CIDADÃO (Agora com dados reais do banco) */}
          <XStack
            bg="#1E293B"
            br="$4"
            p="$4"
            jc="center"
            ai="center"
            borderWidth={1}
            borderColor="#334155"
            accessible={true}
            accessibilityLabel={`Seu status atual é ${usuario.status}, e você tem ${usuario.pontos} pontos.`}
          >
            <Text fontSize="$4" fontWeight="600">
              <Text color="$blue10">{usuario.status} - </Text>
              <Text color="white">{usuario.pontos} pontos</Text>
            </Text>
          </XStack>

          {/* HISTÓRICO DE AÇÕES REAL */}
          <YStack gap="$3">
            <Text
              color="#94A3B8"
              fontSize="$3"
              mb="$2"
              accessible={true}
              accessibilityRole="header"
            >
              Histórico de Ações
            </Text>

            {isLoading ? (
              <Spinner size="large" color="$blue10" mt="$4" />
            ) : historico.length === 0 ? (
              <YStack
                ai="center"
                mt="$4"
                gap="$3"
                accessible={true}
                accessibilityLabel="Nenhuma ação recente encontrada"
              >
                <Feather name="activity" size={32} color="#334155" />
                <Text color="#94A3B8" fontSize="$3">
                  Você ainda não possui interações.
                </Text>
              </YStack>
            ) : (
              historico.map((acao, index) => (
                <YStack
                  key={index}
                  bg="#1E293B"
                  p="$4"
                  br="$4"
                  borderWidth={1}
                  borderColor="#334155"
                  gap="$2"
                  accessible={true}
                  accessibilityLabel={`${acao.actionType} no veículo ${acao.modelo}, placa ${acao.placa}, registrado em ${formatarData(acao.data)}.`}
                >
                  <XStack ai="flex-start" gap="$3">
                    <YStack mt="$1">
                      <Feather name="info" size={20} color="$blue10" />
                    </YStack>
                    <YStack f={1}>
                      <Text color="white" fontSize="$4" fontWeight="600">
                        {acao.actionType}
                      </Text>
                      <Text color="#94A3B8" fontSize="$3" mt="$1">
                        Veículo: {acao.modelo} ({acao.placa})
                      </Text>
                      <Text color="#64748B" fontSize="$2" mt="$1">
                        {formatarData(acao.data)}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
              ))
            )}
          </YStack>
        </YStack>
      </ScrollView>

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
