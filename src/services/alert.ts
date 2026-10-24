import { Alert as RNAlert, Platform, AlertButton } from "react-native";

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== "web") {
      RNAlert.alert(title, message, buttons);
      return;
    }
    const texto = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length <= 1) {
      window.alert(texto);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancelar = buttons.find((b) => b.style === "cancel");
    const confirmar = buttons.find((b) => b.style !== "cancel");
    if (window.confirm(texto)) confirmar?.onPress?.();
    else cancelar?.onPress?.();
  },
};