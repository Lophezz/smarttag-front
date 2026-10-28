import React, { useState, useEffect } from "react";
import { ScrollView, Image } from "react-native";
import { Alert } from "../../services/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import api from "../../services/api";
import { cores } from "../../components/a11y/colors";

const OPCOES_ALERTA = [
  { id: "FAROL_ACESO", titulo: "Farol Aceso", icone: "sun" },
  { id: "ALARME_DISPARANDO", titulo: "Alarme Disparando", icone: "bell" },
  { id: "VIDRO_ABERTO", titulo: "Vidro Aberto", icone: "wind" },
  { id: "ESTACIONAMENTO", titulo: "Bloqueando Saída", icone: "alert-triangle" },
];

export default function PaginaAlerta() {
  const { qrcode } = useLocalSearchParams();

  const [carro, setCarro] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [alertaEnviado, setAlertaEnviado] = useState(false);

  const [sessionId] = useState(() =>
    Math.random().toString(36).substring(2, 10),
  );

  useEffect(() => {
    if (qrcode) {
      buscarDadosDoCarro();
    }
  }, [qrcode]);

  const buscarDadosDoCarro = async () => {
    try {
      const response = await api.get(`/alert/${qrcode}`);
      setCarro(response.data);
    } catch (error) {
      console.error("Erro ao buscar carro:", error);
      Alert.alert("Erro", "QR Code inválido ou veículo não encontrado.");
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const enviarAlerta = async (tipoAlerta: string) => {
    setIsSending(true);
    try {
      await api.post(`/alert/${qrcode}`, {
        quickAlert: tipoAlerta,
      });

      setAlertaEnviado(true);
      Alert.alert("Sucesso!", "O proprietário foi notificado anonimamente.");
    } catch (error: any) {
      console.error("Erro ao enviar alerta:", error);
      Alert.alert(
        "Ops",
        error.response?.data?.message ||
          "Não foi possível enviar o alerta neste momento.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const voltar = async () => {
    try {
      await api.get("/auth/me");
      router.replace("/home");
    } catch {
      router.replace("/login");
    }
  };

  const abrirChat = () => {
    if (!carro) return;

    router.push({
      pathname: `/chat/[sessionId]` as any,
      params: {
        sessionId,
        qrcode: qrcode as string,
        modelo: carro.modelo,
        placa: carro.placa,
        isAnonimo: "true",
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading ? (
        <YStack
          f={1}
          bg="#0F172A"
          ai="center"
          jc="center"
          accessible={true}
          accessibilityLabel="Carregando dados do veículo"
        >
          <Spinner size="large" color={cores.link} />
          <Text color="white" mt="$4">
            A localizar veículo...
          </Text>
        </YStack>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: "center",
          }}
        >
          {alertaEnviado ? (
            <YStack
              ai="center"
              gap="$4"
              bg="#1E293B"
              p="$6"
              br="$4"
              borderWidth={1}
              borderColor={cores.sucesso}
            >
              <Ionicons
                name="checkmark-circle"
                size={80}
                color={cores.sucesso}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text
                color="white"
                fontSize="$6"
                fontWeight="bold"
                textAlign="center"
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                Alerta enviado!
              </Text>
              <Text color="#94A3B8" fontSize="$4" textAlign="center">
                Obrigado por ser um bom cidadão. O proprietário do veículo acaba
                de ser notificado.
              </Text>

              {/* Só vai para a Home se existir sessão válida; senão, login */}
              <Button
                size="$4"
                bg={cores.botaoPrimario}
                color="white"
                mt="$4"
                onPress={voltar}
              >
                Voltar
              </Button>
            </YStack>
          ) : (
            <YStack gap="$6">
              <YStack
                ai="center"
                gap="$2"
              >
                <Ionicons
                  name="car-sport"
                  size={64}
                  color="white"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text
                  color="white"
                  fontSize="$6"
                  fontWeight="bold"
                  textAlign="center"
                  accessibilityRole="header"
                >
                  Notificar proprietário
                </Text>
                <Text color={cores.textoSecundario} fontSize="$3" textAlign="center">
                  Selecione o que está a acontecer com este veículo ou inicie um
                  chat direto.
                </Text>
              </YStack>

              {/* CARD DO CARRO */}
              {carro && (
                <YStack
                  bg="#1E293B"
                  br="$4"
                  overflow="hidden"
                  borderWidth={1}
                  borderColor="#334155"
                  accessible={true}
                  accessibilityLabel={`Veículo modelo ${carro.modelo}, placa ${carro.placa}`}
                >
                  {carro.link ? (
                    <Image
                      source={{ uri: carro.link }}
                      style={{ width: "100%", height: 180 }}
                      resizeMode="cover"
                      accessible
                      accessibilityRole="image"
                      accessibilityLabel={`Foto do veículo ${carro.modelo}`}
                    />
                  ) : (
                    <YStack
                      width="100%"
                      height={120}
                      bg="#0F172A"
                      jc="center"
                      ai="center"
                    >
                      <Ionicons name="car" size={48} color={cores.bordaControle} accessibilityElementsHidden importantForAccessibility="no" />
                    </YStack>
                  )}
                  <YStack p="$4" ai="center">
                    <Text color="white" fontSize="$5" fontWeight="bold">
                      {carro.modelo}
                    </Text>
                    <Text color="#94A3B8" fontSize="$4" mt="$1">
                      Placa: {carro.placa}
                    </Text>
                  </YStack>
                </YStack>
              )}

              {/* OPÇÕES DE ALERTA RÁPIDO */}
              <YStack
                gap="$3"
                opacity={isSending ? 0.5 : 1}
                pointerEvents={isSending ? "none" : "auto"}
              >
                {OPCOES_ALERTA.map((opcao) => (
                  <Button
                    key={opcao.id}
                    size="$5"
                    bg="#334155"
                    color="white"
                    justifyContent="flex-start"
                    icon={
                      <Feather
                        name={opcao.icone as any}
                        size={20}
                        color="#EAB308"
                      />
                    }
                    onPress={() => enviarAlerta(opcao.id)}
                    disabled={isSending}
                    accessibilityHint="Envia um alerta com este motivo ao proprietário do veículo"
                    accessibilityState={{ disabled: isSending, busy: isSending }}
                  >
                    {opcao.titulo}
                  </Button>
                ))}
              </YStack>

              {/* OPÇÃO DE CHAT ANÓNIMO */}
              <YStack
                mt="$2"
                gap="$3"
                pt="$4"
                borderTopWidth={1}
                borderTopColor="#334155"
              >
                <Text
                  color="white"
                  fontSize="$4"
                  fontWeight="bold"
                  textAlign="center"
                  accessibilityRole="header"
                >
                  Precisa de comunicar algo específico?
                </Text>
                <Button
                  size="$5"
                  bg={cores.botaoPrimario}
                  color="white"
                  icon={<Feather name="message-circle" size={20} />}
                  onPress={abrirChat}
                  disabled={isSending}
                  accessibilityHint="Abre uma sala de mensagens em tempo real com o proprietário do veículo"
                >
                  Iniciar Chat Anónimo
                </Button>
              </YStack>

              {isSending && (
                <YStack
                  ai="center"
                  mt="$2"
                  accessible={true}
                  accessibilityLiveRegion="polite"
                  accessibilityLabel="Enviando notificação..."
                >
                  <Spinner size="small" color={cores.link} />
                  <Text color={cores.textoSecundario} mt="$2">
                    A notificar...
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
