import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
// 1. Importamos o arquivo que você acabou de criar na raiz
import { themes } from './theme' 

// 2. Juntamos a configuração padrão com os seus novos temas
const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes, // Mantém os temas padrões de segurança
    ...themes,        // Injeta os temas personalizados do Smart Tag!
  }
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig