import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { Alert } from "../services/alert";
import { Button, Text, YStack } from "tamagui";
import IconButton from "../components/a11y/IconButton";
import { cores } from "../components/a11y/colors";

export default function Scanner() {
  // Hook oficial do Expo para pedir a permissão
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Verifica se o estado de permissão ainda está a carregar
  if (!permission) {
    return <View />;
  }

  // Se o utilizador não concedeu a permissão:
  if (!permission.granted) {
    return (
      <YStack f={1} jc="center" ai="center" bg="#0F172A" px="$6" gap="$4">
        <Stack.Screen options={{ headerShown: false }} />
        <Feather
          name="camera-off"
          size={64}
          color={cores.textoSecundario}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text
          color="white"
          fontSize="$5"
          fontWeight="bold"
          textAlign="center"
          accessibilityRole="header"
        >
          Precisamos da sua câmera
        </Text>
        <Text color={cores.textoSecundario} fontSize="$3" textAlign="center" mb="$4">
          Para conseguir identificar o veículo e enviar alertas com o seu
          perfil, permita o acesso à câmera.
        </Text>
        <Button
          size="$5"
          bg={cores.botaoPrimario}
          color="white"
          onPress={requestPermission}
        >
          Conceder Permissão
        </Button>
        <Button
          size="$4"
          bg="transparent"
          color={cores.erro}
          borderWidth={1}
          borderColor={cores.erro}
          onPress={() => router.replace("/home")}
        >
          Voltar
        </Button>
      </YStack>
    );
  }

  // Função que é disparada no momento exato em que a câmera deteta um código
  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    // Trava para garantir que só lê uma vez
    setScanned(true);
    AccessibilityInfo.announceForAccessibility("QR Code lido");

    try {
      // O dado esperado é uma URL do Vercel, ex: https://smarttag-front.vercel.app/alerta/123-abc
      // Precisamos extrair só o UUID (o que vem depois de "/alerta/")
      const urlParte = data.split("/alerta/");

      if (urlParte.length > 1) {
        const qrcodeId = urlParte[1];

        // Redireciona diretamente para o nosso ecrã interno do app, já com a sessão logada!
        router.replace(`/alerta/${qrcodeId}`);
      } else {
        Alert.alert(
          "QR Code Inválido",
          "Este código não parece ser de um SmartTag válido.",
          [{ text: "Tentar Novamente", onPress: () => setScanned(false) }],
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível ler o código.", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Componente oficial da câmera */}
      <CameraView
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        facing="back"
        accessible
        accessibilityLabel="Visor da câmera para ler o QR Code da etiqueta SmartTag"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Interface de mira sobre a câmera */}
      <YStack f={1} jc="space-between" p="$6">
        <YStack ai="flex-start" mt="$10">
          <IconButton
            label="Fechar câmera e voltar para o início"
            onPress={() => router.replace("/home")}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}
          >
            <Feather name="x" size={24} color="white" />
          </IconButton>
        </YStack>

        <YStack ai="center" gap="$2">
          {/* O quadrado vazado simulando o foco da câmera */}
          <View style={styles.mira} importantForAccessibility="no" accessibilityElementsHidden />

          <YStack bg="rgba(15, 23, 42, 0.8)" px="$4" py="$2" br="$4" mt="$4">
            <Text color="white" fontSize="$3" fontWeight="bold" accessibilityRole="header">
              Aponte para a etiqueta SmartTag
            </Text>
          </YStack>
        </YStack>

        <View style={{ height: 60 }} />
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mira: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#60A5FA",
    backgroundColor: "transparent",
    borderRadius: 24,
  },
});
