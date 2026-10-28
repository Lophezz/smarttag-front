import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { cores } from "./colors";

type VisionMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";
type Preferences = { fontScale: number; highContrast: boolean; visionMode: VisionMode; reduceMotion: boolean };

const STORAGE_KEY = "smarttag.accessibility-preferences.v1";
const defaults: Preferences = { fontScale: 1, highContrast: false, visionMode: "normal", reduceMotion: false };
const baseColors = { ...cores };
const PreferencesContext = createContext(defaults);

export const useAccessibilityPreferences = () => useContext(PreferencesContext);

function applyPreferences(preferences: Preferences) {
  Object.assign(cores, baseColors);
  if (preferences.visionMode === "protanopia" || preferences.visionMode === "deuteranopia") {
    Object.assign(cores, { sucesso: "#60A5FA", erro: "#FBBF24", aviso: "#FBBF24", botaoPrimario: "#1D4ED8", botaoAlternativo: "#A16207" });
  }
  if (preferences.visionMode === "tritanopia") {
    Object.assign(cores, { link: "#F59E0B", sucesso: "#F59E0B", erro: "#E879F9", aviso: "#E879F9", botaoPrimario: "#B45309", botaoAlternativo: "#A21CAF" });
  }
  if (preferences.highContrast) Object.assign(cores, { fundo: "#000000", cartao: "#000000", texto: "#FFFFFF", textoSecundario: "#FFFFFF", textoSuave: "#FFFFFF", bordaControle: "#FFFFFF", bordaCartao: "#FFFFFF" });

  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dataset.smarttagContrast = preferences.highContrast ? "high" : "normal";
    document.documentElement.dataset.smarttagMotion = preferences.reduceMotion ? "reduce" : "normal";
    document.documentElement.style.setProperty("--smarttag-zoom", String(preferences.fontScale));
    document.documentElement.style.setProperty("--smarttag-contrast", preferences.highContrast ? "1.35" : "1");
  }
}

export default function AccessibilityMenu({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const next = { ...defaults, ...JSON.parse(saved) };
        applyPreferences(next);
        setPreferences(next);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => undefined); }, [preferences]);
  const update = (change: Partial<Preferences>, announcement: string) => {
    const next = { ...preferences, ...change };
    // A paleta precisa mudar antes da nova renderização, pois as telas leem
    // diretamente o objeto semântico "cores".
    applyPreferences(next);
    setPreferences(next);
    AccessibilityInfo.announceForAccessibility(announcement);
  };
  const value = useMemo(() => preferences, [preferences]);
  // No web, o zoom é aplicado em global.css. No nativo, reduzimos a área de
  // layout na mesma proporção antes de escalá-la: assim ela continua ocupando
  // a tela inteira, mas textos, ícones e alvos realmente ficam maiores.
  const nativeZoomStyle: ViewStyle | undefined = Platform.OS === "web" ? undefined : {
    width: `${100 / preferences.fontScale}%`,
    height: `${100 / preferences.fontScale}%`,
    transform: [{ scale: preferences.fontScale }],
    transformOrigin: "top left",
  };
  const contentStyle = Platform.OS === "web"
    ? styles.content
    : [styles.nativeContent, nativeZoomStyle];

  return <PreferencesContext.Provider value={value}>
    <View style={styles.screen}>
      <View style={contentStyle}>{React.cloneElement(children as React.ReactElement)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir recursos de acessibilidade" accessibilityHint="Permite ampliar a interface, ativar alto contraste e ajustar cores" onPress={() => setOpen(true)} style={styles.fab}>
        <Feather name="settings" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.panel}>
        <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Acessibilidade</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar recursos de acessibilidade" onPress={() => setOpen(false)}><Feather name="x" size={28} color="#FFFFFF" /></Pressable></View>
        <Text style={styles.description}>As escolhas são salvas e valem para todas as telas.</Text>
        <Text style={styles.label}>Tamanho da interface</Text>
        <View style={styles.row}>{([[0.9, "A−"], [1, "A"], [1.15, "A+"], [1.3, "A++"]] as [number, string][]).map(([scale, label]) => <Option key={label} label={label} selected={preferences.fontScale === scale} onPress={() => update({ fontScale: scale }, `Tamanho ${label} selecionado`)} />)}</View>
        <Toggle label="Alto contraste" value={preferences.highContrast} onPress={() => update({ highContrast: !preferences.highContrast }, preferences.highContrast ? "Alto contraste desativado" : "Alto contraste ativado")} />
        <Toggle label="Reduzir animações" value={preferences.reduceMotion} onPress={() => update({ reduceMotion: !preferences.reduceMotion }, preferences.reduceMotion ? "Redução de animações desativada" : "Redução de animações ativada")} />
        <Text style={styles.label}>Cores para visão</Text>
        {([["normal", "Padrão"], ["protanopia", "Vermelho reduzido"], ["deuteranopia", "Verde reduzido"], ["tritanopia", "Azul reduzido"]] as [VisionMode, string][]).map(([mode, label]) => <Option key={mode} label={label} selected={preferences.visionMode === mode} onPress={() => update({ visionMode: mode }, `${label} selecionado`)} wide />)}
        <Pressable accessibilityRole="button" accessibilityLabel="Restaurar recursos de acessibilidade ao padrão" onPress={() => update(defaults, "Recursos de acessibilidade restaurados ao padrão")} style={styles.reset}>
          <Text style={styles.resetText}>Restaurar padrão</Text>
        </Pressable>
        {Platform.OS !== "web" && <Text style={styles.note}>Para ampliar textos do aparelho inteiro, use também o tamanho de fonte nas configurações do dispositivo.</Text>}
      </View></View>
    </Modal>
  </PreferencesContext.Provider>;
}

function Option({ label, selected, onPress, wide }: { label: string; selected: boolean; onPress: () => void; wide?: boolean }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={[styles.option, wide && styles.wide, selected && styles.selected]}><Text style={styles.optionText}>{label}</Text></Pressable>; }
function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) { return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={onPress} style={styles.toggle}><Text style={styles.optionText}>{label}</Text><View style={[styles.switch, value && styles.switchOn]} /></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" }, content: { flex: 1 }, nativeContent: { position: "absolute", top: 0, left: 0 }, fab: { position: "absolute", right: 20, bottom: 100, width: 56, height: 56, borderRadius: 28, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", elevation: 8, zIndex: 1000 }, backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 20 }, panel: { width: "100%", maxWidth: 480, alignSelf: "center", borderRadius: 16, backgroundColor: "#0F172A", borderWidth: 2, borderColor: "#94A3B8", padding: 20, gap: 14 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, title: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" }, description: { color: "#CBD5E1", fontSize: 16 }, label: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" }, row: { flexDirection: "row", gap: 8 }, option: { minHeight: 44, minWidth: 54, borderWidth: 2, borderColor: "#94A3B8", borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }, wide: { alignItems: "flex-start" }, selected: { backgroundColor: "#2563EB", borderColor: "#FFFFFF" }, optionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" }, toggle: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#475569" }, switch: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#64748B" }, switchOn: { backgroundColor: "#2563EB" }, reset: { minHeight: 44, borderWidth: 2, borderColor: "#CBD5E1", borderRadius: 8, alignItems: "center", justifyContent: "center" }, resetText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" }, note: { color: "#CBD5E1", fontSize: 14 },
});
