import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { YStack, Text, Input, Button, Label, Spinner } from 'tamagui';
import axios from 'axios';
import api from '../services/api';

export default function ResetarSenha() {
  
  const { email } = useLocalSearchParams();
  
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetarSenha = async () => {
    if (!codigo || !novaSenha) {
      Alert.alert('Atenção', 'Por favor, preencha o código e a nova senha.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: email,
        code: codigo,
        newPassword: novaSenha
      });

      Alert.alert('Sucesso!', 'Sua senha foi redefinida. Faça login com a nova credencial.');
      router.replace('/login'); 

    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      let mensagemErro = 'Não foi possível redefinir a senha. Verifique o código e tente novamente.';

      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }
      
      Alert.alert('Erro', mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#0F172A' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <YStack f={1} jc="center" px="$6" py="$8" gap="$4">
          
          <YStack mb="$6">
            <Text fontSize="$9" fontWeight="800" color="white">Criar Nova Senha</Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Digite o código que enviamos para {email || 'seu e-mail'} e escolha sua nova senha.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white">Código de Recuperação</Label>
            <Input 
              size="$5" 
              placeholder="Ex: 123456" 
              keyboardType="number-pad" 
              value={codigo} 
              onChangeText={setCodigo} 
              bg="#1E293B" 
              borderColor="$gray6" 
              color="white" 
            />
          </YStack>

          <YStack gap="$2">
            <Label color="white">Nova Senha</Label>
            <Input 
              size="$5" 
              placeholder="Digite a nova senha" 
              secureTextEntry 
              value={novaSenha} 
              onChangeText={setNovaSenha} 
              bg="#1E293B" 
              borderColor="$gray6" 
              color="white" 
            />
          </YStack>

          <Button 
            size="$5" 
            bg="$orange10" 
            color="white" 
            fontWeight="700" 
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            pressStyle={{ scale: 0.97, bg: "$orange9" }}
            onPress={handleResetarSenha}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
          >
            {isLoading ? 'Salvando...' : 'Redefinir Senha'}
          </Button>

        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}