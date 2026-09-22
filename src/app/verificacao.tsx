import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { YStack, Text, Input, Button, Label, Spinner } from 'tamagui';
import axios from 'axios';
import api from '../services/api';

export default function Verificacao() {

  const { email } = useLocalSearchParams(); 
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerificacao = async () => {
    if (!codigo) {
      Alert.alert('Atenção', 'Digite o código de verificação recebido no e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/verify', {
        email: email,
        code: codigo 
      });

      Alert.alert('Conta Ativada!', 'Sua conta foi verificada com sucesso. Agora você pode fazer o login.');
      router.push('/login'); 

    } catch (error) {
      console.error('Erro na verificação:', error);
      let mensagemErro = 'Código inválido ou expirado. Tente novamente.';

      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }
      
      Alert.alert('Erro de Ativação', mensagemErro);
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
            <Text fontSize="$9" fontWeight="800" color="white">Ativar Conta</Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Enviamos um código de ativação para {email || 'seu e-mail'}. Digite-o abaixo.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white">Código de Verificação</Label>
            <Input 
              size="$5" 
              placeholder="Ex: 329987" 
              keyboardType="number-pad" 
              value={codigo} 
              onChangeText={setCodigo} 
              bg="#1E293B" 
              borderColor="$gray6" 
              color="white" 
              maxLength={6}
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
            onPress={handleVerificacao}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
          >
            {isLoading ? 'Verificando...' : 'Ativar Conta'}
          </Button>

        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}