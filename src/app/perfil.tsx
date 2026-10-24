import React, { useState, useCallback } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Alert } from "../services/alert";
import { SafeAreaView } from "react-native-safe-area-context"
import { YStack, XStack, Text, Button, Spinner, Input, Label } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import api from "../services/api";

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
        <Spinner size="large" color="$blue10" />
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
        {/* CABEÇALHO COM BOTÃO VOLTAR */}
        <XStack
          px="$6"
          pt="$8"
          pb="$4"
          ai="center"
          gap="$4"
          accessible={true}
          accessibilityRole="header"
        >
          <Feather
            name="arrow-left"
            size={24}
            color="#94A3B8"
            onPress={() => router.replace("/home")}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
          />
          <Text
            f={1}
            fontSize="$7"
            fontWeight="bold"
            color="white"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            O Meu Perfil
          </Text>
        </XStack>

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
                <Text color="#94A3B8" fontSize="$3">
                  Status de Cidadão
                </Text>
                <Text
                  color="$blue10"
                  fontSize="$5"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {statusFormatado}
                </Text>
              </YStack>
              <YStack ai="flex-end">
                <Text color="#94A3B8" fontSize="$3">
                  Pontuação
                </Text>
                <Text color="white" fontSize="$5" fontWeight="bold">
                  {status.pontos} pts
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
                borderColor="$red10"
                accessible={true}
                accessibilityRole="alert"
              >
                <XStack ai="center" gap="$2" mb="$2">
                  <Feather name="alert-triangle" size={20} color="#EF4444" />
                  <Text color="$red10" fontWeight="bold" fontSize="$4">
                    Conta em Risco de Banimento
                  </Text>
                </XStack>
                <Text color="#FCA5A5" fontSize="$3">
                  Detetámos sucessivas avaliações negativas nos seus alertas. Se
                  o seu comportamento violar os nossos Termos de Uso novamente,
                  a sua conta será bloqueada permanentemente.
                </Text>
              </YStack>
            )}

            <YStack gap="$2" mt="$2">
              <Label color="white">Nome Completo</Label>
              <Input
                value={formData.nome}
                onChangeText={(text) =>
                  setFormData({ ...formData, nome: text })
                }
                bg="#0F172A"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <YStack gap="$2">
              <Label color="white">Telefone</Label>
              <Input
                value={formData.telefone}
                onChangeText={(text) =>
                  setFormData({ ...formData, telefone: text })
                }
                keyboardType="phone-pad"
                bg="#0F172A"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <YStack gap="$2">
              <Label color="white">CPF</Label>
              <Input
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                keyboardType="numeric"
                bg="#0F172A"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <Button
              size="$5"
              bg="$blue10"
              color="white"
              fontWeight="700"
              mt="$2"
              onPress={handleAtualizarDados}
              disabled={isSaving}
              icon={isSaving ? () => <Spinner color="white" /> : undefined}
            >
              {isSaving ? "A guardar..." : "Atualizar Dados"}
            </Button>

            <YStack borderBottomWidth={1} borderColor="#334155" my="$4" />

            <YStack gap="$3" mt="auto">
              <Button
                size="$4"
                bg="transparent"
                color="$red10"
                borderWidth={1}
                borderColor="$red10"
                onPress={confirmarExclusao}
                disabled={isDeleting}
                icon={isDeleting ? () => <Spinner color="$red10" /> : undefined}
              >
                {isDeleting ? "A apagar..." : "Excluir a Minha Conta"}
              </Button>

              <Button
                size="$5"
                bg="#334155"
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
