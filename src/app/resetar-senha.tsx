import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { YStack, Text, Input, Button, Label, XStack, Spinner } from "tamagui";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import api from "../services/api";

export default function ResetarSenha() {
  const { email } = useLocalSearchParams();

  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Validações da nova senha exigidas pelo Backend
  const reqLength = novaSenha.length >= 6;
  const reqUpper = /[A-Z]/.test(novaSenha);
  const reqLower = /[a-z]/.test(novaSenha);
  const reqNumber = /[0-9]/.test(novaSenha);
  const reqSpecial = /[@#$%^&+=!]/.test(novaSenha);

  const isPasswordValid =
    reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleResetarSenha = async () => {
    if (!codigo || !novaSenha) {
      Alert.alert("Atenção", "Por favor, preencha o código e a nova senha.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        "Senha Fraca",
        "A sua nova senha não cumpre todos os requisitos de segurança.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email ? String(email).toLowerCase().trim() : "",
        code: codigo,
        newPassword: novaSenha,
      });

      Alert.alert(
        "Sucesso!",
        "Sua senha foi redefinida. Faça login com a nova credencial.",
      );
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      let mensagemErro =
        "Não foi possível redefinir a senha. Verifique o código e tente novamente.";

      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }

      Alert.alert("Erro", mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  // Componente visual para cada requisito da senha
  const RequisitoSenha = ({
    atende,
    texto,
  }: {
    atende: boolean;
    texto: string;
  }) => (
    <XStack
      ai="center"
      gap="$2"
      mb="$1"
      accessible={true}
      accessibilityLabel={`Requisito de senha: ${texto}. ${atende ? "Cumprido" : "Não cumprido"}`}
    >
      <Feather
        name={atende ? "check-circle" : "circle"}
        size={14}
        color={atende ? "#10B981" : "#64748B"}
      />
      <Text color={atende ? "#10B981" : "#64748B"} fontSize="$3">
        {texto}
      </Text>
    </XStack>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <YStack f={1} jc="center" px="$6" py="$8" gap="$4">
          <YStack mb="$6" accessible={true} accessibilityRole="header">
            <Text fontSize="$9" fontWeight="800" color="white">
              Criar Nova Senha
            </Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Digite o código que enviamos para {email || "seu e-mail"} e
              escolha sua nova senha.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white" htmlFor="codigo">
              Código de Recuperação
            </Label>
            <Input
              id="codigo"
              size="$5"
              placeholder="Ex: 123456"
              keyboardType="number-pad"
              value={codigo}
              onChangeText={setCodigo}
              bg="#1E293B"
              borderColor="$gray6"
              color="white"
              accessibilityLabel="Campo para digitar o código numérico recebido no e-mail"
            />
          </YStack>

          <YStack gap="$2">
            <Label color="white" htmlFor="nova-senha">
              Nova Senha
            </Label>
            <XStack
              ai="center"
              bg="#1E293B"
              br="$4"
              borderWidth={1}
              borderColor="$gray6"
              pr="$3"
            >
              <Input
                id="nova-senha"
                f={1}
                size="$5"
                placeholder="Crie uma senha forte"
                secureTextEntry={!mostrarSenha}
                value={novaSenha}
                onChangeText={setNovaSenha}
                bg="transparent"
                color="white"
                borderWidth={0}
                accessibilityLabel="Campo para criar a nova senha"
              />
              <Feather
                name={mostrarSenha ? "eye-off" : "eye"}
                size={20}
                color="#94A3B8"
                onPress={() => setMostrarSenha(!mostrarSenha)}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                }
                accessibilityHint="Alterna a visibilidade da nova senha digitada"
              />
            </XStack>
          </YStack>

          {/* Checklist Visual de Segurança da Senha */}
          <YStack
            bg="#0F172A"
            p="$3"
            br="$3"
            borderWidth={1}
            borderColor={isPasswordValid ? "#10B981" : "#334155"}
          >
            <RequisitoSenha
              atende={reqLength}
              texto="Pelo menos 6 caracteres"
            />
            <RequisitoSenha atende={reqUpper} texto="Uma letra maiúscula" />
            <RequisitoSenha atende={reqLower} texto="Uma letra minúscula" />
            <RequisitoSenha atende={reqNumber} texto="Um número" />
            <RequisitoSenha
              atende={reqSpecial}
              texto="Um caractere especial (@#$%^&+=!)"
            />
          </YStack>

          <Button
            size="$5"
            bg="$orange10"
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading || !isPasswordValid}
            opacity={isLoading || !isPasswordValid ? 0.5 : 1}
            pressStyle={{ scale: 0.97, bg: "$orange9" }}
            onPress={handleResetarSenha}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityRole="button"
            accessibilityLabel="Botão para redefinir senha"
            accessibilityHint="Toque para salvar a nova senha e retornar ao login"
          >
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
