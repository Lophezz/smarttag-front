import React, { useState, useCallback } from "react";
import { ScrollView, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Avatar, Spinner, Button } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";

export default function Home() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [temAlertaPendente, setTemAlertaPendente] = useState(false);
  const [temMensagemNaoLida, setTemMensagemNaoLida] = useState(false);
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
      // Requisita tudo em paralelo: Usuário, Histórico, Alertas Pendentes e Chats
      const [resUsuario, resHistorico, resAlertas, resMensagens] =
        await Promise.all([
          api.get("/auth/me"),
          api.get("/auth/history"),
          api.get("/auth/notify"),
          api.get("/messages/minhas-conversas"),
        ]);

      const dados = resUsuario.data;
      setUsuario({
        nome: dados.nome || "Usuário",
        pontos: dados.pontos || 0,
        status: formatarStatus(dados.citizienStatus),
      });

      const histOrdenado = resHistorico.data.sort(
        (a: any, b: any) =>
          new Date(b.data).getTime() - new Date(a.data).getTime(),
      );
      setHistorico(histOrdenado);

      // LÓGICA DAS BADGES (Bolinhas Vermelhas)
      const alertas = resAlertas.data.content || resAlertas.data || [];
      setTemAlertaPendente(alertas.length > 0);

      const msgs = resMensagens.data || [];
      setTemMensagemNaoLida(msgs.some((m: any) => m.lido === false));

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
          {/* CABEÇALHO */}
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

            {/* ACESSO AO PERFIL */}
            <Feather
              name="settings"
              size={24}
              color="#94A3B8"
              onPress={() => router.replace("/perfil")}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Configurações do perfil"
            />
          </XStack>

          {/* STATUS DE CIDADÃO */}
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

          {/* BOTÃO DE LER QR CODE */}
          <YStack mt="$2" mb="$2">
            <Button
              size="$5"
              bg="$orange10"
              color="white"
              fontWeight="700"
              icon={<Ionicons name="qr-code-outline" size={24} color="white" />}
              onPress={() => router.replace("/scanner")}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Escanear QR Code. Abra a câmera para notificar um veículo e ganhar pontos."
            >
              Escanear Veículo
            </Button>
            <Text color="#94A3B8" fontSize={12} textAlign="center" mt="$2">
              Leia o QR Code de outros carros para enviar alertas e ganhar
              pontos de cidadão!
            </Text>
          </YStack>

          {/* HISTÓRICO DE AÇÕES */}
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

      {/* BARRA DE NAVEGAÇÃO INFERIOR PADRONIZADA COM BADGES */}
      <XStack
        bg="#0F172A"
        pt="$3"
        pb={Math.max(insets.bottom, 20)}
        px="$6"
        jc="space-between"
        borderTopWidth={1}
        borderTopColor="#1E293B"
      >
        {/* ABA 1: HOME */}
        <YStack
          ai="center"
          gap="$1"
          opacity={1}
          onPress={() => router.replace("/home")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba atual: Home"
        >
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Home
          </Text>
        </YStack>

        {/* ABA 2: CHATS (COM BADGE) */}
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/mensagens")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Chats"
        >
          <YStack>
            <Feather name="message-circle" size={24} color="white" />
            {temMensagemNaoLida && (
              <YStack
                position="absolute"
                top={-2}
                right={-4}
                width={10}
                height={10}
                br={5}
                bg="$red10"
              />
            )}
          </YStack>
          <Text color="white" fontSize={10}>
            Chats
          </Text>
        </YStack>

        {/* ABA 3: ALERTAS (COM BADGE) */}
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/notificacoes")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Alertas"
        >
          <YStack>
            <Feather name="bell" size={24} color="white" />
            {temAlertaPendente && (
              <YStack
                position="absolute"
                top={-2}
                right={-2}
                width={10}
                height={10}
                br={5}
                bg="$red10"
              />
            )}
          </YStack>
          <Text color="white" fontSize={10}>
            Alertas
          </Text>
        </YStack>

        {/* ABA 4: CARROS */}
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
