import { Stack } from "expo-router";
import "../global.css";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "../../tamagui.config";
import AccessibilityMenu from "../components/a11y/AccessibilityMenu";

// Títulos de tela: viram o <title> da página no web e o nome da tela para
// leitores de tela no nativo (SC 2.4.2 Page Titled).
export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <AccessibilityMenu>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "SmartTag" }} />
        <Stack.Screen name="login" options={{ title: "Entrar – SmartTag" }} />
        <Stack.Screen name="cadastro" options={{ title: "Criar conta – SmartTag" }} />
        <Stack.Screen name="verificacao" options={{ title: "Ativar conta – SmartTag" }} />
        <Stack.Screen name="esqueci-senha" options={{ title: "Recuperar senha – SmartTag" }} />
        <Stack.Screen name="resetar-senha" options={{ title: "Nova senha – SmartTag" }} />
        <Stack.Screen name="home" options={{ title: "Início – SmartTag" }} />
        <Stack.Screen name="mensagens" options={{ title: "Conversas – SmartTag" }} />
        <Stack.Screen name="notificacoes" options={{ title: "Alertas – SmartTag" }} />
        <Stack.Screen name="carros" options={{ title: "Meus veículos – SmartTag" }} />
        <Stack.Screen name="perfil" options={{ title: "Meu perfil – SmartTag" }} />
        <Stack.Screen name="scanner" options={{ title: "Ler QR Code – SmartTag" }} />
        <Stack.Screen name="alerta/[qrcode]" options={{ title: "Notificar proprietário – SmartTag" }} />
        <Stack.Screen name="chat/[sessionId]" options={{ title: "Chat – SmartTag" }} />
        </Stack>
      </AccessibilityMenu>
    </TamaguiProvider>
  );
}
