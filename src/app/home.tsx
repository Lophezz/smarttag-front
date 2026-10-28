import React, { useState, useCallback } from "react";
import { ScrollView } from "react-native";
import { Alert } from "../services/alert";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Avatar, Spinner, Button } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";
import BottomTabBar from "../components/a11y/BottomTabBar";
import IconButton from "../components/a11y/IconButton";
import { cores } from "../components/a11y/colors";

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
        pontos: dados.pontos ?? 0,
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
    } catch (error: any) {
      console.error("Erro ao carregar home:", error);
      const status = error?.response?.status;
      if (status === 401 || status === 403 || !error?.response) {
        router.replace("/login");
        return;
      }
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
          <XStack ai="center" jc="space-between">
            <XStack ai="center" gap="$3">
              <Avatar
                circular
                size="$6"
                accessible={true}
                accessibilityLabel={`Iniciais do usuário: ${usuario.nome ? usuario.nome.charAt(0) : "U"}`}
              >
                <Avatar.Fallback bg={cores.botaoPrimario} jc="center" ai="center">
                  <Text color="white" fontSize="$5" fontWeight="bold">
                    {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              {isLoading ? (
                <Spinner size="small" color={cores.link} />
              ) : (
                <Text color="white" fontSize="$5" fontWeight="600">
                  {usuario.nome}
                </Text>
              )}
            </XStack>

            {/* ACESSO AO PERFIL */}
            <IconButton
              label="Configurações do perfil"
              hint="Abre a tela do seu perfil"
              onPress={() => router.replace("/perfil")}
            >
              <Feather name="settings" size={24} color={cores.textoSuave} />
            </IconButton>
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
            accessibilityRole="summary"
            accessibilityLabel={`Seu status atual é ${usuario.status}, e você tem ${usuario.pontos} pontos.`}
          >
            <Text fontSize="$4" fontWeight="600">
              <Text color={cores.link}>{usuario.status} - </Text>
              <Text color="white">{usuario.pontos} pontos</Text>
            </Text>
          </XStack>

          {/* BOTÃO DE LER QR CODE */}
          <YStack mt="$2" mb="$2">
            <Button
              size="$5"
              bg={cores.botaoAlternativo}
              color="white"
              fontWeight="700"
              icon={<Ionicons name="qr-code-outline" size={24} color="white" />}
              onPress={() => router.replace("/scanner")}
              accessibilityHint="Abre a câmera para ler o QR Code de um veículo, notificar o proprietário e ganhar pontos"
            >
              Escanear Veículo
            </Button>
            <Text color={cores.textoSecundario} fontSize={12} textAlign="center" mt="$2">
              Leia o QR Code de outros carros para enviar alertas e ganhar
              pontos de cidadão!
            </Text>
          </YStack>

          {/* HISTÓRICO DE AÇÕES */}
          <YStack gap="$3">
            <Text
              color={cores.textoSuave}
              fontSize="$5"
              fontWeight="700"
              mb="$2"
              accessibilityRole="header"
            >
              Histórico de ações
            </Text>

            {isLoading ? (
              <Spinner size="large" color={cores.link} mt="$4" accessibilityLabel="Carregando histórico" accessibilityLiveRegion="polite" />
            ) : historico.length === 0 ? (
              <YStack
                ai="center"
                mt="$4"
                gap="$3"
                accessible={true}
                accessibilityLabel="Nenhuma ação recente encontrada"
              >
                <Feather name="activity" size={32} color={cores.bordaControle} />
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
                      <Feather name="info" size={20} color={cores.link} />
                    </YStack>
                    <YStack f={1}>
                      <Text color="white" fontSize="$4" fontWeight="600">
                        {acao.actionType}
                      </Text>
                      <Text color="#94A3B8" fontSize="$3" mt="$1">
                        Veículo: {acao.modelo} ({acao.placa})
                      </Text>
                      <Text color={cores.textoSecundario} fontSize="$2" mt="$1">
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

      <BottomTabBar
        ativa="home"
        temMensagemNaoLida={temMensagemNaoLida}
        temAlertaPendente={temAlertaPendente}
      />
    </SafeAreaView>
  );
}
