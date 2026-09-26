import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Alert, Modal, Image, Platform } from 'react-native';
import { YStack, XStack, Text, Button, Input, Spinner, Label } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function Carros() {
  const [carros, setCarros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Formulário
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    modelo: '',
    ano: '',
    placa: '',
    imagem: null as any
  });

  useEffect(() => {
    carregarCarros();
  }, []);

  const carregarCarros = async () => {
    try {
      // Usa a rota GET /car com paginação padrão (page=0, size=10)
      const response = await api.get('/car');
      // O backend retorna um Page<CarResponseDTO>, os dados estão em response.data.content
      setCarros(response.data.content || response.data);
    } catch (error) {
      console.error('Erro ao buscar carros:', error);
      Alert.alert('Erro', 'Não foi possível carregar a sua lista de carros.');
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imagem: result.assets[0] });
    }
  };

  const abrirModalNovo = () => {
    setEditingId(null);
    setFormData({ modelo: '', ano: '', placa: '', imagem: null });
    setModalVisible(true);
  };

  const abrirModalEditar = (carro: any) => {
    setEditingId(carro.id);
    setFormData({
      modelo: carro.modelo,
      ano: carro.ano,
      placa: carro.placa,
      imagem: { uri: carro.link } // Mock para exibir a imagem atual
    });
    setModalVisible(true);
  };

  const salvarCarro = async () => {
    if (!formData.modelo || !formData.ano) {
      Alert.alert('Aviso', 'Modelo e Ano são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Como a API exige @ModelAttribute, temos de usar FormData em vez de JSON
      const form = new FormData();
      form.append('modelo', formData.modelo);
      form.append('ano', formData.ano);
      form.append('placa', formData.placa);

      // Só anexa o ficheiro se o utilizador selecionou uma imagem nova
      if (formData.imagem && formData.imagem.fileName !== undefined) {
        form.append('imagem', {
          uri: formData.imagem.uri,
          name: 'carro.jpg',
          type: 'image/jpeg',
        } as any);
      } else if (!editingId) {
         // Se for um carro novo e não tiver imagem, a API pode falhar dependendo da validação.
         // Enviar um ficheiro vazio ou mock caso a imagem seja estritamente obrigatória no Cloudinary.
      }

      if (editingId) {
        await api.put(`/car/${editingId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Alert.alert('Sucesso', 'Veículo atualizado!');
      } else {
        await api.post('/car/add', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Alert.alert('Sucesso', 'Veículo adicionado!');
      }

      setModalVisible(false);
      carregarCarros();
    } catch (error) {
      console.error('Erro ao salvar carro:', error);
      Alert.alert('Erro', 'Não foi possível guardar os dados do veículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletarCarro = (id: string) => {
    Alert.alert('Apagar Veículo', 'Tem a certeza que deseja remover este carro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/car/${id}`);
            Alert.alert('Sucesso', 'Veículo removido.');
            carregarCarros();
          } catch (error) {
            console.error('Erro ao deletar:', error);
            Alert.alert('Erro', 'Não foi possível remover o veículo.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      
      {/* CABEÇALHO */}
      <XStack px="$6" pt="$8" pb="$4" jc="space-between" ai="center">
        <Text fontSize="$7" fontWeight="bold" color="white">Meus Carros</Text>
        <Button size="$3" bg="$blue10" color="white" circular icon={<Feather name="plus" size={20} />} onPress={abrirModalNovo} />
      </XStack>

      {/* LISTA DE CARROS */}
      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {carros.length === 0 ? (
            <YStack ai="center" mt="$10" gap="$4">
              <Ionicons name="car-sport-outline" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">Nenhum carro cadastrado.</Text>
            </YStack>
          ) : (
            carros.map((carro) => (
              <YStack key={carro.id} bg="#1E293B" br="$4" overflow="hidden" mb="$4" borderWidth={1} borderColor="#334155">
                {carro.link ? (
                  <Image source={{ uri: carro.link }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                ) : (
                  <YStack width="100%" height={160} bg="#0F172A" jc="center" ai="center">
                    <Ionicons name="car" size={48} color="#334155" />
                  </YStack>
                )}
                
                <YStack p="$4" gap="$2">
                  <XStack jc="space-between" ai="flex-start">
                    <YStack>
                      <Text color="white" fontSize="$5" fontWeight="bold">{carro.modelo}</Text>
                      <Text color="#94A3B8" fontSize="$3">{carro.ano} • Placa: {carro.placa}</Text>
                    </YStack>
                    <YStack ai="center" bg="#0F172A" p="$2" br="$2">
                      <Ionicons name="qr-code" size={24} color="white" />
                      <Text color="white" fontSize={10} mt="$1">SmartTag</Text>
                    </YStack>
                  </XStack>

                  <XStack gap="$3" mt="$3">
                    <Button f={1} size="$3" bg="#334155" color="white" onPress={() => abrirModalEditar(carro)}>
                      Editar
                    </Button>
                    <Button f={1} size="$3" bg="transparent" color="$red10" borderWidth={1} borderColor="$red10" onPress={() => deletarCarro(carro.id)}>
                      Apagar
                    </Button>
                  </XStack>
                </YStack>
              </YStack>
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL DE ADICIONAR/EDITAR */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <YStack f={1} bg="rgba(15, 23, 42, 0.95)" jc="flex-end">
          <YStack bg="#1E293B" p="$6" borderTopLeftRadius={24} borderTopRightRadius={24} gap="$4">
            <XStack jc="space-between" ai="center" mb="$2">
              <Text color="white" fontSize="$6" fontWeight="bold">
                {editingId ? 'Editar Veículo' : 'Novo Veículo'}
              </Text>
              <Feather name="x" size={24} color="#94A3B8" onPress={() => setModalVisible(false)} />
            </XStack>

            <YStack gap="$2" ai="center" mb="$2">
              <Button size="$3" bg="#334155" color="white" onPress={selecionarImagem}>
                {formData.imagem ? 'Trocar Imagem' : 'Selecionar Imagem do Carro'}
              </Button>
              {formData.imagem && (
                <Image source={{ uri: formData.imagem.uri }} style={{ width: 100, height: 75, borderRadius: 8, marginTop: 8 }} />
              )}
            </YStack>

            <YStack gap="$2">
              <Label color="white">Modelo</Label>
              <Input value={formData.modelo} onChangeText={(t) => setFormData({...formData, modelo: t})} bg="#0F172A" color="white" borderColor="$gray6" />
            </YStack>

            <XStack gap="$4">
              <YStack f={1} gap="$2">
                <Label color="white">Ano</Label>
                <Input value={formData.ano} onChangeText={(t) => setFormData({...formData, ano: t})} keyboardType="numeric" bg="#0F172A" color="white" borderColor="$gray6" />
              </YStack>
              <YStack f={1} gap="$2">
                <Label color="white">Placa</Label>
                <Input value={formData.placa} onChangeText={(t) => setFormData({...formData, placa: t})} autoCapitalize="characters" bg="#0F172A" color="white" borderColor="$gray6" />
              </YStack>
            </XStack>

            <Button size="$5" bg="$blue10" color="white" fontWeight="700" mt="$4" onPress={salvarCarro} disabled={isSubmitting} icon={isSubmitting ? () => <Spinner color="white" /> : undefined}>
              {isSubmitting ? 'A Guardar...' : 'Guardar Veículo'}
            </Button>
          </YStack>
        </YStack>
      </Modal>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack bg="#0F172A" pt="$3" pb="$5" px="$6" jc="space-between" borderTopWidth={1} borderTopColor="#1E293B">
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/home')}>
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>Home</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/notificacoes')}>
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>Notificações</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={1} onPress={() => router.replace('/carros')}>
          <Ionicons name="car-sport" size={26} color="white" />
          <Text color="white" fontSize={10}>Carros</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/perfil')}>
          <Feather name="user" size={24} color="white" />
          <Text color="white" fontSize={10}>Perfil</Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}