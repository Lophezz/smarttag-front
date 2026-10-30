import React, { useState, useCallback } from "react";
import { ScrollView } from "react-native";
import { Alert } from "../services/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, Stack } from "expo-router";
import api from "../services/api";
import BottomTabBar from "../components/a11y/BottomTabBar";
import Cabecalho from "../components/a11y/Cabecalho";
import { useCores } from "../components/a11y/AccessibilityMenu";

export default function Notificacoes() {
  const cores = useCores();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarAlertas();
    }, []),
  );

  const carregarAlertas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/auth/notify");
      setAlertas(response.data.content || response.data || []);
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
      Alert.alert("Erro", "Não foi possível carregar os seus alertas.");
    } finally {
      setIsLoading(false);
    }
  };

  const avaliarAlerta = async (id: string, isValido: boolean) => {
    setProcessandoId(id);
    try {
      const res = await api.post(`/auth/notify/${id}`, {
        isMessageUtil: isValido,
      });
      const foiAnonimo =
        typeof res.data === "string" && res.data.includes("Anônimo");
      Alert.alert(
        "Avaliação enviada",
        foiAnonimo
          ? "Avaliação registrada. O remetente não estava identificado, então nenhum ponto foi alterado."
          : isValido
            ? "Obrigado por confirmar. O remetente ganhou pontos de cidadão!"
            : "Obrigado por avisar. O remetente foi penalizado por enviar alerta falso.",
      );
      setAlertas((prev) => prev.filter((alerta) => alerta.id !== id));
    } catch (error: any) {
      console.error("Erro ao avaliar alerta:", error);
      Alert.alert(
        "Aviso",
        error.response?.data?.message ||
          "Não foi possível processar a sua avaliação.",
      );
    } finally {
      setProcessandoId(null);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Cabecalho
        titulo="Meus alertas"
        acao={{
          icone: "refresh-cw",
          label: "Atualizar lista de alertas",
          onPress: carregarAlertas,
        }}
      />
      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color={cores.link} accessibilityLabel="Carregando alertas" accessibilityLiveRegion="polite" />
        </YStack>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {alertas.length === 0 ? (
            <YStack
              ai="center"
              mt="$10"
              gap="$4"
              accessible={true}
              accessibilityLabel="Você não possui nenhum alerta pendente de avaliação"
            >
              <Feather name="bell-off" size={64} color={cores.bordaControle} />
              <Text color={cores.textoSecundario} fontSize="$4" textAlign="center">
                Você não possui nenhum alerta pendente de avaliação.
              </Text>
            </YStack>
          ) : (
            alertas.map((alerta) => (
              <YStack
                key={alerta.id}
                bg={cores.cartao}
                p="$4"
                br="$4"
                mb="$4"
                borderWidth={1}
                borderColor={cores.bordaCartao}
              >
                <YStack
                  accessible={true}
                  accessibilityLabel={`Novo alerta em ${formatarData(alerta.dataEnvio)} para o veículo ${alerta.notifyCarDTO?.modelo || "sem modelo"}, placa ${alerta.notifyCarDTO?.placa || "sem placa"}. Mensagem: ${alerta.mensagem}. Enviado por: ${alerta.citizienStatus === "Anônimo" ? "anônimo" : `usuário ${alerta.citizienStatus}`}.`}
                >
                  <XStack jc="space-between" ai="flex-start" mb="$2">
                    <YStack f={1}>
                      <Text
                        color={cores.link}
                        fontSize="$3"
                        fontWeight="bold"
                        mb="$1"
                      >
                        NOVO ALERTA • {formatarData(alerta.dataEnvio)}
                      </Text>
                      <Text color={cores.texto} fontSize="$5" fontWeight="bold">
                        {alerta.notifyCarDTO?.modelo || "Veículo"}
                        <Text color={cores.textoSecundario} fontSize="$4" fontWeight="normal">
                          {" "}
                          ({alerta.notifyCarDTO?.placa || "Sem Placa"})
                        </Text>
                      </Text>
                    </YStack>
                    <Ionicons name="car-sport" size={24} color={cores.textoSecundario} />
                  </XStack>
                  <YStack
                    bg={cores.fundo}
                    p="$3"
                    br="$3"
                    mb="$3"
                    borderWidth={1}
                    borderColor={cores.bordaCartao}
                  >
                    <Text color={cores.textoSuave} fontSize="$4" fontStyle="italic">
                      "{alerta.mensagem}"
                    </Text>
                    <Text color={cores.textoSecundario} fontSize="$3" mt="$2" textAlign="right">
                      Enviado por:{" "}
                      {alerta.citizienStatus === "Anônimo"
                        ? "Anônimo"
                        : `Usuário ${alerta.citizienStatus}`}
                    </Text>
                  </YStack>
                </YStack>
                <Text color={cores.textoSecundario} fontSize="$3" mb="$2" textAlign="center" accessibilityRole="header">
                  Este alerta foi realmente útil e verdadeiro?
                </Text>
                <XStack gap="$3">
                  <Button
                    f={1}
                    size="$4"
                    bg="rgba(16, 185, 129, 0.15)"
                    color={cores.sucesso}
                    borderWidth={1}
                    borderColor={cores.sucesso}
                    icon={
                      processandoId === alerta.id ? (
                        () => <Spinner color={cores.sucesso} />
                      ) : (
                        <Feather name="check" size={18} color={cores.sucesso} />
                      )
                    }
                    disabled={processandoId === alerta.id}
                    onPress={() => avaliarAlerta(alerta.id, true)}
                    accessibilityLabel="Sim, foi útil. Dá pontos ao remetente."
                    accessibilityState={{ disabled: processandoId === alerta.id, busy: processandoId === alerta.id }}
                  >
                    Sim, foi útil
                  </Button>
                  <Button
                    f={1}
                    size="$4"
                    bg="rgba(239, 68, 68, 0.15)"
                    color={cores.erro}
                    borderWidth={1}
                    borderColor={cores.erro}
                    icon={
                      processandoId === alerta.id ? (
                        () => <Spinner color={cores.erro} />
                      ) : (
                        <Feather name="x" size={18} color={cores.erro} />
                      )
                    }
                    disabled={processandoId === alerta.id}
                    onPress={() => avaliarAlerta(alerta.id, false)}
                    accessibilityLabel="Alerta falso. Retira pontos do remetente."
                    accessibilityState={{ disabled: processandoId === alerta.id, busy: processandoId === alerta.id }}
                  >
                    Alerta Falso
                  </Button>
                </XStack>
              </YStack>
            ))
          )}
        </ScrollView>
      )}
      <BottomTabBar ativa="notificacoes" />
    </SafeAreaView>
  );
}