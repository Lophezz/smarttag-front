import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { TamaguiProvider, Theme } from "tamagui";
import tamaguiConfig from "../../tamagui.config";
import AccessibilityMenu, {
  AccessibilityProvider,
  ThemeToggle,
  useAccessibilityPreferences,
} from "../components/a11y/AccessibilityMenu";

function RootContent() {
  const preferences = useAccessibilityPreferences();
  const themeKey = `${preferences.theme}-${preferences.highContrast}-${preferences.visionMode}`;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Theme name={preferences.theme}>
        <StatusBar style={preferences.theme === "light" ? "dark" : "light"} />
        <AccessibilityMenu>
          <Stack key={themeKey} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "SmartTag" }} />
            <Stack.Screen name="login" options={{ title: "Entrar - SmartTag" }} />
            <Stack.Screen name="cadastro" options={{ title: "Criar conta - SmartTag" }} />
            <Stack.Screen name="verificacao" options={{ title: "Ativar conta - SmartTag" }} />
            <Stack.Screen name="esqueci-senha" options={{ title: "Recuperar senha - SmartTag" }} />
            <Stack.Screen name="resetar-senha" options={{ title: "Nova senha - SmartTag" }} />
            <Stack.Screen name="home" options={{ title: "Início - SmartTag" }} />
            <Stack.Screen name="mensagens" options={{ title: "Conversas - SmartTag" }} />
            <Stack.Screen name="notificacoes" options={{ title: "Alertas - SmartTag" }} />
            <Stack.Screen name="carros" options={{ title: "Meus veículos - SmartTag" }} />
            <Stack.Screen name="perfil" options={{ title: "Meu perfil - SmartTag" }} />
            <Stack.Screen name="scanner" options={{ title: "Ler QR Code - SmartTag" }} />
            <Stack.Screen name="alerta/[qrcode]" options={{ title: "Notificar proprietário - SmartTag" }} />
            <Stack.Screen name="chat/[sessionId]" options={{ title: "Chat - SmartTag" }} />
          </Stack>
        </AccessibilityMenu>
        <ThemeToggle />
      </Theme>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <RootContent />
    </AccessibilityProvider>
  );
}