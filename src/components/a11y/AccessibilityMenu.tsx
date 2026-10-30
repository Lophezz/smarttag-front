import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Dimensions, Modal, PanResponder, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cores } from "./colors";

type VisionMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";
export type ThemeMode = "dark" | "light";
type Preferences = { fontScale: number; highContrast: boolean; visionMode: VisionMode; reduceMotion: boolean; theme: ThemeMode };
type Position = { x: number; y: number };

const STORAGE_KEY = "smarttag.accessibility-preferences.v1";
const POSITION_STORAGE_KEY = "smarttag.accessibility-position.v1";
const defaults: Preferences = { fontScale: 1, highContrast: false, visionMode: "normal", reduceMotion: false, theme: "dark" };
const baseColors = { ...cores };

type PreferencesContextType = {
  preferences: Preferences;
  update: (change: Partial<Preferences>, announcement: string) => void;
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaults,
  update: () => {},
});

export const useAccessibilityPreferences = () => useContext(PreferencesContext).preferences;
export const useAccessibilityUpdate = () => useContext(PreferencesContext).update;

/** Hook reativo que força o componente a atualizar sempre que o tema/acessibilidade mudar */
export const useCores = () => {
  useContext(PreferencesContext);
  return cores;
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);

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

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => undefined);
  }, [preferences]);

  const update = (change: Partial<Preferences>, announcement: string) => {
    const next = { ...preferences, ...change };
    applyPreferences(next);
    setPreferences(next);
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  // Garante que `cores` esteja sincronizado antes de cada renderização
  applyPreferences(preferences);

  const value = useMemo(() => ({ preferences, update }), [preferences]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

function applyPreferences(preferences: Preferences) {
  Object.assign(cores, baseColors);
  if (preferences.theme === "light") {
    Object.assign(cores, {
      fundo: "#F8FAFC",
      cartao: "#FFFFFF",
      texto: "#0F172A",
      textoSecundario: "#475569",
      textoSuave: "#334155",
      bordaControle: "#CBD5E1",
      bordaCartao: "#E2E8F0",
      botaoNeutro: "#E2E8F0",
      textoEmBotao: "#FFFFFF",
    });
  }
  if (preferences.visionMode === "protanopia" || preferences.visionMode === "deuteranopia") {
    Object.assign(cores, { sucesso: "#60A5FA", erro: "#FBBF24", aviso: "#FBBF24", botaoPrimario: "#1D4ED8", botaoAlternativo: "#A16207" });
  }
  if (preferences.visionMode === "tritanopia") {
    Object.assign(cores, { link: "#F59E0B", sucesso: "#F59E0B", erro: "#E879F9", aviso: "#E879F9", botaoPrimario: "#B45309", botaoAlternativo: "#A21CAF" });
  }
  if (preferences.highContrast) {
    if (preferences.theme === "light") {
      Object.assign(cores, { fundo: "#FFFFFF", cartao: "#FFFFFF", texto: "#000000", textoSecundario: "#000000", textoSuave: "#000000", bordaControle: "#000000", bordaCartao: "#000000" });
    } else {
      Object.assign(cores, { fundo: "#000000", cartao: "#000000", texto: "#FFFFFF", textoSecundario: "#FFFFFF", textoSuave: "#FFFFFF", bordaControle: "#FFFFFF", bordaCartao: "#FFFFFF" });
    }
  }
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dataset.smarttagContrast = preferences.highContrast ? "high" : "normal";
    document.documentElement.dataset.smarttagMotion = preferences.reduceMotion ? "reduce" : "normal";
    document.documentElement.dataset.smarttagTheme = preferences.theme;
    document.documentElement.style.setProperty("--smarttag-zoom", String(preferences.fontScale));
    document.documentElement.style.setProperty("--smarttag-contrast", preferences.highContrast ? "1.35" : "1");
    document.body.style.backgroundColor = cores.fundo;
  }
}

export default function AccessibilityMenu({ children }: { children: React.ReactNode }) {
  const preferences = useAccessibilityPreferences();
  const update = useAccessibilityUpdate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 });
  const panRef = useRef(position);
  panRef.current = position;
  const windowDimensions = Dimensions.get("window");
  const [screenSize, setScreenSize] = useState({ width: windowDimensions.width, height: windowDimensions.height });

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreenSize({ width: window.width, height: window.height });
    });
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(POSITION_STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const pos = JSON.parse(saved);
        if (typeof pos.x === "number" && typeof pos.y === "number") {
          setPosition(pos);
        }
      })
      .catch(() => undefined);
  }, []);

  const savePosition = (pos: Position) => {
    AsyncStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos)).catch(() => undefined);
  };

  const panResponder = useMemo(() => {
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startX = panRef.current.x;
        startY = panRef.current.y;
        hasMoved = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          hasMoved = true;
        }
        const fabSize = 56;
        const maxX = screenSize.width - fabSize - 10;
        const maxY = screenSize.height - fabSize - 10;
        const newX = Math.max(10, Math.min(maxX, startX + gestureState.dx));
        const newY = Math.max(10, Math.min(maxY, startY + gestureState.dy));
        setPosition({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!hasMoved && Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          setOpen(true);
        } else {
          savePosition(panRef.current);
        }
      },
    });
  }, [screenSize]);

  useEffect(() => {
    AsyncStorage.getItem(POSITION_STORAGE_KEY).then((saved) => {
      if (!saved) {
        setPosition({
          x: Math.max(20, screenSize.width - 76),
          y: Math.max(20, screenSize.height - 180),
        });
      }
    }).catch(() => {});
  }, [screenSize.width, screenSize.height]);

  const nativeZoomStyle: ViewStyle | undefined = Platform.OS === "web" ? undefined : {
    width: `${100 / preferences.fontScale}%`,
    height: `${100 / preferences.fontScale}%`,
    transform: [{ scale: preferences.fontScale }],
    transformOrigin: "top left",
  };
  const contentStyle = Platform.OS === "web"
    ? styles.content
    : [styles.nativeContent, nativeZoomStyle];
  const isLight = preferences.theme === "light";

  return (
    <>
      <View style={[styles.screen, { backgroundColor: cores.fundo }]}>
        <View style={contentStyle}>{React.cloneElement(children as React.ReactElement)}</View>
        <View
          style={[styles.fab, { left: position.x, top: position.y, right: undefined, bottom: undefined }]}
          {...panResponder.panHandlers}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir recursos de acessibilidade"
            accessibilityHint="Arraste para mover o botão ou toque para abrir o menu"
            onPress={() => setOpen(true)}
            style={styles.fabPressable}
          >
            <Feather name="settings" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}><View accessibilityViewIsModal style={[styles.panel, isLight && styles.panelLight]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, isLight && styles.titleLight]}>Acessibilidade</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar recursos de acessibilidade" onPress={() => setOpen(false)}>
              <Feather name="x" size={28} color={isLight ? "#0F172A" : "#FFFFFF"} />
            </Pressable>
          </View>
          <Text style={[styles.description, isLight && styles.descriptionLight]}>As escolhas são salvas e valem para todas as telas. Você também pode arrastar o botão de acessibilidade para qualquer lugar da tela.</Text>
          
          <Text style={[styles.label, isLight && styles.labelLight]}>Tamanho da interface</Text>
          <View style={styles.row}>{([[0.9, "A-"], [1, "A"], [1.15, "A+"], [1.3, "A++"]] as [number, string][]).map(([scale, label]) => <Option key={label} label={label} selected={preferences.fontScale === scale} onPress={() => update({ fontScale: scale }, `Tamanho ${label} selecionado`)} isLight={isLight} />)}</View>
          <Toggle label="Alto contraste" value={preferences.highContrast} onPress={() => update({ highContrast: !preferences.highContrast }, preferences.highContrast ? "Alto contraste desativado" : "Alto contraste ativado")} isLight={isLight} />
          <Toggle label="Reduzir animações" value={preferences.reduceMotion} onPress={() => update({ reduceMotion: !preferences.reduceMotion }, preferences.reduceMotion ? "Redução de animações desativada" : "Redução de animações ativada")} isLight={isLight} />
          <Text style={[styles.label, isLight && styles.labelLight]}>Cores para visão</Text>
          {([["normal", "Padrão"], ["protanopia", "Vermelho reduzido"], ["deuteranopia", "Verde reduzido"], ["tritanopia", "Azul reduzido"]] as [VisionMode, string][]).map(([mode, label]) => <Option key={mode} label={label} selected={preferences.visionMode === mode} onPress={() => update({ visionMode: mode }, `${label} selecionado`)} wide isLight={isLight} />)}
          <Pressable accessibilityRole="button" accessibilityLabel="Restaurar recursos de acessibilidade ao padrão" onPress={() => update(defaults, "Recursos de acessibilidade restaurados ao padrão")} style={[styles.reset, isLight && styles.resetLight]}>
            <Text style={[styles.resetText, isLight && styles.resetTextLight]}>Restaurar padrão</Text>
          </Pressable>
          {Platform.OS !== "web" && <Text style={[styles.note, isLight && styles.noteLight]}>Para ampliar textos do aparelho inteiro, use também o tamanho de fonte nas configurações do dispositivo.</Text>}
        </View></View>
      </Modal>
    </>
  );
}

export function ThemeToggle() {
  const preferences = useAccessibilityPreferences();
  const update = useAccessibilityUpdate();
  const insets = useSafeAreaInsets();
  const isLight = preferences.theme === "light";
  const nextTheme: ThemeMode = isLight ? "dark" : "light";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      accessibilityHint="Altera a aparência do aplicativo"
      onPress={() => update({ theme: nextTheme }, `${nextTheme === "dark" ? "Modo escuro" : "Modo claro"} ativado`)}
      style={[
        styles.themeToggle,
        { top: Math.max(insets.top + 8, 18) }, // Respeita a barra de notificações/bateria do celular
        isLight && styles.themeToggleLight,
      ]}
    >
      <Feather name={isLight ? "moon" : "sun"} size={20} color={isLight ? "#0F172A" : "#FFFFFF"} />
      <Text style={[styles.themeToggleText, isLight && styles.themeToggleTextLight]}>{isLight ? "Escuro" : "Claro"}</Text>
    </Pressable>
  );
}

function Option({ label, selected, onPress, wide, isLight }: { label: string; selected: boolean; onPress: () => void; wide?: boolean; isLight?: boolean }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.option,
        isLight && styles.optionLight,
        wide && styles.wide,
        selected && (isLight ? styles.selectedLight : styles.selected),
      ]}
    >
      <Text style={[styles.optionText, isLight && styles.optionTextLight, selected && isLight && styles.selectedTextLight]}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ label, value, onPress, isLight }: { label: string; value: boolean; onPress: () => void; isLight?: boolean }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.toggle, isLight && styles.toggleLight]}
    >
      <Text style={[styles.optionText, isLight && styles.optionTextLight]}>{label}</Text>
      <View style={[styles.switch, value && (isLight ? styles.switchOnLight : styles.switchOn)]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  content: { flex: 1 },
  nativeContent: { position: "absolute", top: 0, left: 0 },
  fab: { position: "absolute", width: 56, height: 56, borderRadius: 28, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", elevation: 8, zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabPressable: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  themeToggle: { position: "absolute", right: 18, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1D4ED8", borderWidth: 1, borderColor: "#93C5FD", elevation: 8, zIndex: 1001 },
  themeToggleLight: { backgroundColor: "#FFFFFF", borderColor: "#475569" },
  themeToggleText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  themeToggleTextLight: { color: "#0F172A" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 20 },
  panel: { width: "100%", maxWidth: 480, alignSelf: "center", borderRadius: 16, backgroundColor: "#0F172A", borderWidth: 2, borderColor: "#94A3B8", padding: 20, gap: 14 },
  panelLight: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  titleLight: { color: "#0F172A" },
  description: { color: "#CBD5E1", fontSize: 16 },
  descriptionLight: { color: "#475569" },
  label: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  labelLight: { color: "#0F172A" },
  row: { flexDirection: "row", gap: 8 },
  option: { minHeight: 44, minWidth: 54, borderWidth: 2, borderColor: "#94A3B8", borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  optionLight: { borderColor: "#CBD5E1", backgroundColor: "#F1F5F9" },
  wide: { alignItems: "flex-start" },
  selected: { backgroundColor: "#2563EB", borderColor: "#FFFFFF" },
  selectedLight: { backgroundColor: "#2563EB", borderColor: "#0F172A" },
  optionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  optionTextLight: { color: "#0F172A" },
  selectedTextLight: { color: "#FFFFFF" },
  toggle: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#475569" },
  toggleLight: { borderBottomColor: "#E2E8F0" },
  switch: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#64748B" },
  switchOn: { backgroundColor: "#2563EB" },
  switchOnLight: { backgroundColor: "#2563EB" },
  reset: { minHeight: 44, borderWidth: 2, borderColor: "#CBD5E1", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resetLight: { borderColor: "#CBD5E1", backgroundColor: "#F8FAFC" },
  resetText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  resetTextLight: { color: "#0F172A" },
  note: { color: "#CBD5E1", fontSize: 14 },
  noteLight: { color: "#475569" },
});