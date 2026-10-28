import React, { useState, useCallback } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Alert } from "../services/alert";
import { SafeAreaView } from "react-native-safe-area-context"
import { YStack, XStack, Text, Button, Spinner, Input, Label } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";
import Cabecalho from "../components/a11y/Cabecalho";
import FormField from "../components/a11y/FormField";
import { cores } from "../components/a11y/colors";

export default function Perfil() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState({ citizienStatus: "", pontos: 0 });

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
  });

  useFocusEffect(
    useCallback(() => {
      carregarDadosUsuario();
    }, []),
  );

  const carregarDadosUsuario = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/auth/me");
      setUserId(response.data.id);
      setStatus({
        citizienStatus: response.data.citizienStatus || "NOVATO",
        pontos: response.data.pontos || 0,
      });
      setFormData({
        nome: response.data.nome || "",
        telefone: response.data.telefone || "",
        cpf: response.data.cpf || "",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtualizarDados = async () => {
    if (!formData.nome) {
      Alert.alert("Aviso", "O campo Nome não pode estar vazio.");
      return;
    }

    setIsSaving(true);
    try {
      await api.put("/auth", {
        nome: formData.nome,
        telefone: formData.telefone,
        cpf: formData.cpf,
      });
      Alert.alert("Sucesso", "Os seus dados foram atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Ocorreu um problema ao guardar os seus dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert(
      "Atenção: Excluir Conta",
      "Esta ação apagará permanentemente os seus dados, carros e histórico de mensagens. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Apagar Conta",
          style: "destructive",
          onPress: deletarConta,
        },
      ],
    );
  };

  const deletarConta = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/${userId}`);
      try {
        await api.post("/auth/logout");
      } catch {}
      Alert.alert(
        "Conta Excluída",
        "A sua conta e todos os dados associados foram apagados.",
      );
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      Alert.alert("Erro", "Não foi possível excluir a conta no momento.");
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} bg="#0F172A" ai="center" jc="center">
        <Spinner size="large" color={cores.link} accessibilityLabel="Carregando perfil" accessibilityLiveRegion="polite" />
      </YStack>
    );
  }

  // Formata o texto do status para exibição
  const statusFormatado = status.citizienStatus
    .replace(/_/g, " ")
    .toLowerCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Cabecalho titulo="Meu perfil" onVoltar={() => router.replace("/home")} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <YStack f={1} px="$6" gap="$4">
            {/* PAINEL DE STATUS E PONTUAÇÃO */}
            <XStack
              bg="#1E293B"
              br="$4"
              p="$4"
              jc="space-between"
              ai="center"
              borderWidth={1}
              borderColor="#334155"
            >
              <YStack>
                <Text color={cores.textoSecundario} fontSize="$3">
                  Status de cidadão
                </Text>
                <Text
                  color={cores.link}
                  fontSize="$5"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {statusFormatado}
                </Text>
              </YStack>
              <YStack ai="flex-end">
                <Text color={cores.textoSecundario} fontSize="$3">
                  Pontuação
                </Text>
                <Text color="white" fontSize="$5" fontWeight="bold">
                  {status.pontos} pontos
                </Text>
              </YStack>
            </XStack>

            {/* AVISO DE CONTA EM RISCO */}
            {status.citizienStatus === "CONTA_EM_RISCO" && (
              <YStack
                bg="rgba(239, 68, 68, 0.15)"
                p="$4"
                br="$4"
                borderWidth={1}
                borderColor={cores.erro}
                accessibilityRole="alert"
              >
                <XStack ai="center" gap="$2" mb="$2">
                  <Feather name="alert-triangle" size={20} color={cores.erro} accessibilityElementsHidden importantForAccessibility="no" />
                  <Text color={cores.erro} fontWeight="bold" fontSize="$4">
                    Atenção: conta em risco de banimento
                  </Text>
                </XStack>
                <Text color="#FCA5A5" fontSize="$3">
                  Detetámos sucessivas avaliações negativas nos seus alertas. Se
                  o seu comportamento violar os nossos Termos de Uso novamente,
                  a sua conta será bloqueada permanentemente.
                </Text>
              </YStack>
            )}

            <FormField
              id="perfil-nome"
              label="Nome completo"
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
            />

            <FormField
              id="perfil-telefone"
              label="Telefone"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              value={formData.telefone}
              onChangeText={(text) =>
                setFormData({ ...formData, telefone: text })
              }
            />

            <FormField
              id="perfil-cpf"
              label="CPF"
              keyboardType="numeric"
              autoComplete="off"
              value={formData.cpf}
              onChangeText={(text) => setFormData({ ...formData, cpf: text })}
              helper="Somente números."
            />

            <Button
              size="$5"
              bg={cores.botaoPrimario}
              color="white"
              fontWeight="700"
              mt="$2"
              onPress={handleAtualizarDados}
              disabled={isSaving}
              accessibilityState={{ busy: isSaving, disabled: isSaving }}
              icon={isSaving ? () => <Spinner color="white" /> : undefined}
            >
              {isSaving ? "A guardar..." : "Atualizar Dados"}
            </Button>

            <YStack borderBottomWidth={1} borderColor={cores.bordaCartao} my="$4" />

            <YStack gap="$3" mt="auto">
              <Button
                size="$4"
                bg="transparent"
                color={cores.erro}
                borderWidth={1}
                borderColor={cores.erro}
                onPress={confirmarExclusao}
                disabled={isDeleting}
                accessibilityHint="Pede confirmação antes de apagar a conta definitivamente"
                icon={isDeleting ? () => <Spinner color={cores.erro} /> : undefined}
              >
                {isDeleting ? "A apagar..." : "Excluir a Minha Conta"}
              </Button>

              <Button
                size="$5"
                bg={cores.botaoNeutro}
                color="white"
                fontWeight="700"
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                Sair da Conta
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
