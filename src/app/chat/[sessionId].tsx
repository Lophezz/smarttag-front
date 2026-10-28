import "react-native-url-polyfill/auto";
// Polyfill necessário para o StompJS funcionar no React Native
import * as encoding from "text-encoding";

// Injeção global forçada para que o Android não falhe na codificação das mensagens
if (typeof globalThis.TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = encoding.TextEncoder;
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
  Keyboard,
  AccessibilityInfo,
} from "react-native";
import { Alert } from "../../services/alert";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { YStack, XStack, Text, Input, Button, Spinner } from "tamagui";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Client } from "@stomp/stompjs";
import api from "../../services/api";
import IconButton from "../../components/a11y/IconButton";
import { cores } from "../../components/a11y/colors";

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
  const mensagensVistas = useRef<Set<string>>(new Set());

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
      response.data.forEach((m: any) =>
        mensagensVistas.current.add(`${m.dataHora}|${m.conteudo}`),
      );
      setMensagens(response.data);
      scrollParaOFinal();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error("Erro ao carregar histórico:", error);
        Alert.alert("Erro", "Não foi possível carregar as mensagens antigas.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const conectarWebSocket = () => {
    // 1. Usar a URL diretamente, sem Axios, para não haver interferências
    const wsURL = "wss://smarttag-6bea18f8625e.herokuapp.com/ws";

    const client = new Client({
      brokerURL: wsURL,
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

    client.onWebSocketError = (evt) => {
      console.error("[STOMP] ERRO NO WEBSOCKET:", evt);
      setIsConnected(false);
    };

    client.onWebSocketClose = (evt) => {
      setIsConnected(false);
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

  const ehMinha = (msg: any) =>
    isAnonimo === "true"
      ? msg.remetente !== "Dono do carro"
      : msg.remetente === "Dono do carro";

  const adicionarMensagem = (novaMsg: any) => {
    // Evita duplicar a mensagem na tela e também o anúncio por voz
    const chave = `${novaMsg.dataHora}|${novaMsg.conteudo}`;
    if (mensagensVistas.current.has(chave)) return;
    mensagensVistas.current.add(chave);

    setMensagens((prev) => [...prev, novaMsg]);

    // Leitores de tela não percebem mensagens que chegam sozinhas: anunciamos (SC 4.1.3)
    if (!ehMinha(novaMsg)) {
      AccessibilityInfo.announceForAccessibility(
        `Nova mensagem de ${novaMsg.remetente}: ${novaMsg.conteudo}`,
      );
    }
    scrollParaOFinal();
  };

  const enviarMensagem = () => {
    if (!inputText.trim() || !stompClientRef.current?.connected) return;

    const conteudo = inputText.trim();

    try {
      // A mensagem volta pelo WebSocket após ser salva pelo servidor. Não a
      // incluímos antes disso, pois o servidor pode normalizar data/hora e a
      // cópia local deixaria de ser reconhecida pela deduplicação.
      setInputText("");
      Keyboard.dismiss();

      // Envia para o servidor; a confirmação recebida atualiza a conversa.
      stompClientRef.current.publish({
        destination: `/app/chat/${qrcode}`,
        body: JSON.stringify({
          conteudo,
          idSessao: sessionId,
          qrcode,
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
        {/* CABEÇALHO DO CHAT: o papel "header" fica só no título, para o botão
            Voltar continuar alcançável por leitor de tela e teclado */}
        <XStack
          bg={cores.cartao}
          px="$2"
          pt={Math.max(insets.top, 16)}
          pb="$3"
          ai="center"
          borderBottomWidth={1}
          borderBottomColor={cores.bordaCartao}
        >
          <IconButton label="Voltar" onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={cores.textoSuave} />
          </IconButton>
          <YStack f={1} ml="$2">
            <Text
              color="white"
              fontSize="$5"
              fontWeight="bold"
              numberOfLines={1}
              accessibilityRole="header"
            >
              {modelo}
            </Text>
            <XStack ai="center" gap="$2">
              <Text color={cores.textoSecundario} fontSize="$3">
                Placa {placa}
              </Text>
              {/* Estado de conexão: texto + cor, anunciado quando muda (SC 1.4.1, 4.1.3) */}
              <YStack
                width={8}
                height={8}
                br={4}
                bg={isConnected ? cores.sucesso : cores.erro}
                importantForAccessibility="no"
              />
              <Text
                color={isConnected ? cores.sucesso : cores.erro}
                fontSize={12}
                accessibilityLiveRegion="polite"
              >
                {isConnected ? "Online" : "Conectando..."}
              </Text>
            </XStack>
          </YStack>
        </XStack>

        {/* LISTA DE MENSAGENS */}
        {isLoading ? (
          <YStack f={1} jc="center" ai="center">
            <Spinner size="large" color={cores.link} />
            <Text color={cores.textoSecundario} mt="$4" accessibilityLiveRegion="polite">
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
              const isMinha = ehMinha(msg);

              return (
                <XStack
                  key={index}
                  jc={isMinha ? "flex-end" : "flex-start"}
                  mb="$3"
                  accessible={true}
                  accessibilityLabel={`${isMinha ? "Você" : msg.remetente}, às ${new Date(msg.dataHora || msg.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}: ${msg.conteudo}`}
                >
                  <YStack
                    maxWidth="80%"
                    bg={isMinha ? cores.botaoPrimario : cores.cartao}
                    p="$3"
                    br="$4"
                    borderBottomRightRadius={isMinha ? 0 : "$4"}
                    borderBottomLeftRadius={isMinha ? "$4" : 0}
                  >
                    {!isMinha && (
                      <Text
                        color={cores.textoSecundario}
                        fontSize={12}
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
                      color={isMinha ? "#F1F5F9" : cores.textoSecundario}
                      fontSize={12}
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
            placeholderTextColor={cores.textoSecundario as any}
            bg="#0F172A"
            color="white"
            borderColor={cores.bordaControle}
            br="$4"
            disabled={!isConnected}
            accessibilityLabel="Escreva uma mensagem"
            accessibilityHint={isConnected ? undefined : "Aguardando conexão com o chat"}
            autoComplete="off"
            returnKeyType="send"
            onSubmitEditing={enviarMensagem}
          />
          <Button
            size="$4"
            circular
            bg={inputText.trim() ? cores.botaoPrimario : cores.botaoNeutro}
            disabled={!inputText.trim() || !isConnected}
            onPress={enviarMensagem}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() ? "white" : cores.textoSuave}
            />
          </Button>
        </XStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
