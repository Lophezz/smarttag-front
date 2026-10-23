import "react-native-url-polyfill/auto";
// Polyfill necessário para o StompJS funcionar no React Native
import * as encoding from "text-encoding";

// Injeção global forçada para que o Android não falhe na codificação das mensagens
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = encoding.TextEncoder;
}
if (typeof globalThis.TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = encoding.TextEncoder;
  (globalThis as any).TextDecoder = encoding.TextDecoder;
}
if (
  typeof window !== "undefined" &&
  typeof window.TextEncoder === "undefined"
) {
  window.TextEncoder = encoding.TextEncoder;
}

import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { YStack, XStack, Text, Input, Button, Spinner } from "tamagui";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Client } from "@stomp/stompjs";
import api from "../../services/api";

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { sessionId, qrcode, modelo, placa, isAnonimo } =
    useLocalSearchParams();

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    carregarHistorico();
    conectarWebSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const carregarHistorico = async () => {
    try {
      const response = await api.get(`/messages/history/${sessionId}`);
      setMensagens(response.data);
      scrollParaOFinal();
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      Alert.alert("Erro", "Não foi possível carregar as mensagens antigas.");
    } finally {
      setIsLoading(false);
    }
  };

  const conectarWebSocket = () => {
    // 1. Usar a URL diretamente, sem Axios, para não haver interferências
    const wsURL = "wss://smarttag-6bea18f8625e.herokuapp.com/ws";

    const client = new Client({
      brokerURL: wsURL,
      // 2. TENTAR FORÇAR AS ORIGENS PARA BURLAR O CORS
      connectHeaders: {
        Origin: "https://smarttag-front.vercel.app",
      },
      // 3. ESSENCIAL PARA O REACT NATIVE NO ANDROID:
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,

      debug: function (str) {
        console.log("[STOMP]", str); // <-- VER SE ISTO É LOGADO AGORA
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("[STOMP] CONECTADO COM SUCESSO!");
      setIsConnected(true);

      client.subscribe(`/queue/anonimo/${sessionId}`, (message) => {
        if (message.body) {
          const novaMsg = JSON.parse(message.body);
          adicionarMensagem(novaMsg);
        }
      });

      client.subscribe("/user/queue/alertas", (message) => {
        if (message.body) {
          const novaMsg = JSON.parse(message.body);
          if (novaMsg.idSessao === sessionId || novaMsg.notifyId) {
            adicionarMensagem(novaMsg);
          }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("Erro no Broker:", frame.headers["message"]);
      console.error("Detalhes:", frame.body);
    };

    client.onWebSocketClose = (evt) => {
      console.log(
        "[STOMP] LIGAÇÃO FECHADA CÓDIGO:",
        evt.code,
        " RAZÃO:",
        evt.reason,
      );
    };

    client.activate();
    stompClientRef.current = client;
  };

  const adicionarMensagem = (novaMsg: any) => {
    setMensagens((prev) => {
      const existe = prev.some(
        (m) =>
          m.dataHora === novaMsg.dataHora && m.conteudo === novaMsg.conteudo,
      );
      if (existe) return prev;
      return [...prev, novaMsg];
    });
    scrollParaOFinal();
  };

  const enviarMensagem = () => {
    if (!inputText.trim() || !stompClientRef.current?.connected) return;

    // 1. Cria a mensagem no formato exato que a API usa
    const novaMensagemLocal = {
      conteudo: inputText.trim(),
      idSessao: sessionId,
      qrcode: qrcode,
      remetente: isAnonimo === "true" ? "Anônimo" : "Dono do carro",
      dataHora: new Date().toISOString(), // Grava a hora atual
    };

    try {
      // 2. ADICIONA À TELA IMEDIATAMENTE (Atualização Otimista)
      adicionarMensagem(novaMensagemLocal);

      // 3. Limpa o input e fecha o teclado
      setInputText("");
      Keyboard.dismiss();

      // 4. Manda para o servidor silenciosamente em background
      stompClientRef.current.publish({
        destination: `/app/chat/${qrcode}`,
        body: JSON.stringify({
          conteudo: novaMensagemLocal.conteudo,
          idSessao: novaMensagemLocal.idSessao,
          qrcode: novaMensagemLocal.qrcode,
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar:", error);
      Alert.alert("Erro", "A sua mensagem não foi enviada. Tente novamente.");
    }
  };

  const scrollParaOFinal = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0F172A", paddingTop: 0 }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 25}
      >
        {/* CABEÇALHO DO CHAT */}
        <XStack
          bg="#1E293B"
          px="$4"
          pt={Math.max(insets.top, 16)}
          pb="$4"
          ai="center"
          borderBottomWidth={1}
          borderBottomColor="#334155"
          accessible={true}
          accessibilityRole="header"
        >
          <Feather
            name="arrow-left"
            size={24}
            color="#94A3B8"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          />
          <YStack f={1} ml="$4">
            <Text
              color="white"
              fontSize="$5"
              fontWeight="bold"
              numberOfLines={1}
            >
              {modelo}
            </Text>
            <XStack ai="center" gap="$2">
              <Text color="#94A3B8" fontSize="$3">
                {placa}
              </Text>
              <YStack
                width={8}
                height={8}
                br={4}
                bg={isConnected ? "#10B981" : "#EF4444"}
              />
              <Text color={isConnected ? "#10B981" : "#EF4444"} fontSize={10}>
                {isConnected ? "Online" : "Conectando..."}
              </Text>
            </XStack>
          </YStack>
        </XStack>

        {/* LISTA DE MENSAGENS */}
        {isLoading ? (
          <YStack f={1} jc="center" ai="center">
            <Spinner size="large" color="$blue10" />
            <Text color="#94A3B8" mt="$4">
              A carregar conversa...
            </Text>
          </YStack>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              padding: 16,
              flexGrow: 1,
              justifyContent: "flex-end",
            }}
            onContentSizeChange={scrollParaOFinal}
          >
            {mensagens.map((msg, index) => {
              const isMinha =
                isAnonimo === "true"
                  ? msg.remetente !== "Dono do carro"
                  : msg.remetente === "Dono do carro";

              return (
                <XStack
                  key={index}
                  jc={isMinha ? "flex-end" : "flex-start"}
                  mb="$3"
                  accessible={true}
                  accessibilityLabel={`Mensagem de ${msg.remetente}: ${msg.conteudo}`}
                >
                  <YStack
                    maxWidth="80%"
                    bg={isMinha ? "$blue10" : "#1E293B"}
                    p="$3"
                    br="$4"
                    borderBottomRightRadius={isMinha ? 0 : "$4"}
                    borderBottomLeftRadius={isMinha ? "$4" : 0}
                  >
                    {!isMinha && (
                      <Text
                        color="#94A3B8"
                        fontSize={10}
                        mb="$1"
                        fontWeight="bold"
                      >
                        {msg.remetente}
                      </Text>
                    )}
                    <Text color="white" fontSize="$4">
                      {msg.conteudo}
                    </Text>
                    <Text
                      color={isMinha ? "rgba(255,255,255,0.7)" : "#64748B"}
                      fontSize={10}
                      mt="$1"
                      ta={isMinha ? "right" : "left"}
                    >
                      {new Date(msg.dataHora || msg.data).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </Text>
                  </YStack>
                </XStack>
              );
            })}
          </ScrollView>
        )}

        {/* BARRA DE INPUT DE MENSAGEM */}
        <XStack
          bg="#1E293B"
          pt="$3"
          px="$3"
          pb={Math.max(insets.bottom, 12)}
          ai="center"
          gap="$3"
          borderTopWidth={1}
          borderTopColor="#334155"
        >
          <Input
            f={1}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite a sua mensagem..."
            placeholderTextColor={"#64748B" as any}
            bg="#0F172A"
            color="white"
            borderColor="#334155"
            br="$4"
            disabled={!isConnected}
            accessibilityLabel="Escreva uma mensagem"
          />
          <Button
            size="$4"
            circular
            bg={inputText.trim() ? "$blue10" : "#334155"}
            disabled={!inputText.trim() || !isConnected}
            onPress={enviarMensagem}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() ? "white" : "#94A3B8"}
            />
          </Button>
        </XStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
