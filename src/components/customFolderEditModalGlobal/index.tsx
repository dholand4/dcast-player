import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, FlatList, Alert, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { ICustomCategoryFolder } from '../../@types/storage';
import { IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';
import { ICustomFolderEditModalGlobalProps } from './types';
import { InputGlobal } from '../inputGlobal';
import { ButtonGlobal } from '../buttonGlobal';
import {
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  HeaderTitleContainer,
  ModalTitle,
  ModalSubtitle,
  CloseButton,
  FormBody,
  SearchWrapper,
  SelectionCountBar,
  SelectionCountText,
  ClearSelectionText,
  StreamItem,
  StreamIconWrapper,
  StreamIcon,
  StreamName,
  CheckboxCircle,
  EmptySearchText,
  ModalFooter,
} from './style';

export const CustomFolderEditModalGlobal: React.FC<ICustomFolderEditModalGlobalProps> = ({
  visible,
  onClose,
  type,
  folderToEdit,
  availableStreams,
  onSave,
}) => {
  const theme = useTheme();
  const [folderName, setFolderName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      if (folderToEdit) {
        setFolderName(folderToEdit.name);
        setSelectedIds(folderToEdit.streamIds || []);
      } else {
        setFolderName('');
        setSelectedIds([]);
      }
      setNameError(null);
      setSearchQuery('');
    }
  }, [visible, folderToEdit]);

  const getStreamId = (item: IXtreamLiveStream | IXtreamVodStream | IXtreamSeries): string => {
    if ('stream_id' in item) return String(item.stream_id);
    if ('series_id' in item) return String(item.series_id);
    return '';
  };

  const getStreamIcon = (item: IXtreamLiveStream | IXtreamVodStream | IXtreamSeries): string | undefined => {
    if ('stream_icon' in item) return item.stream_icon;
    if ('cover' in item) return item.cover;
    return undefined;
  };

  const filteredStreams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableStreams.slice(0, 100);
    return availableStreams
      .filter((s) => (s.name || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [availableStreams, searchQuery]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleSave = () => {
    const trimmed = folderName.trim();
    if (!trimmed) {
      setNameError('O nome da pasta é obrigatório');
      return;
    }

    const folder: ICustomCategoryFolder = {
      id: folderToEdit ? folderToEdit.id : `custom_${Date.now()}`,
      name: trimmed,
      type,
      streamIds: selectedIds,
      createdAt: folderToEdit ? folderToEdit.createdAt : Date.now(),
    };

    onSave(folder);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="custom-folder-edit-modal"
    >
      <ModalBackdrop>
        <ModalContainer>
          <ModalHeader>
            <HeaderTitleContainer>
              <ModalTitle>
                {folderToEdit ? 'Editar Pasta' : 'Nova Pasta'}
              </ModalTitle>
              <ModalSubtitle>
                {type === 'live'
                  ? 'Selecione os canais que farão parte desta pasta'
                  : 'Selecione os conteúdos para esta pasta'}
              </ModalSubtitle>
            </HeaderTitleContainer>
            <CloseButton onPress={onClose} testID="custom-folder-close-btn">
              <MaterialIcons name="close" size={22} color={theme.colors.text} />
            </CloseButton>
          </ModalHeader>

          <FormBody>
            <InputGlobal
              label="Nome da Pasta"
              placeholder={type === 'live' ? 'Ex: Canais Abertos, Esportes VIP...' : 'Ex: Meus Filmes...'}
              value={folderName}
              onChangeText={(t) => {
                setFolderName(t);
                if (nameError) setNameError(null);
              }}
              error={nameError}
              testID="folder-name-input"
            />

            <SearchWrapper>
              <InputGlobal
                placeholder="Buscar para adicionar à pasta..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                noMargin
                testID="folder-stream-search-input"
              />
            </SearchWrapper>

            <SelectionCountBar>
              <SelectionCountText>
                {selectedIds.length} {type === 'live' ? 'canal(is) selecionado(s)' : 'item(ns) selecionado(s)'}
              </SelectionCountText>
              {selectedIds.length > 0 && (
                <ClearSelectionText
                  onPress={() => setSelectedIds([])}
                  testID="clear-selection-btn"
                >
                  Limpar todos
                </ClearSelectionText>
              )}
            </SelectionCountBar>
          </FormBody>

          <FlatList
            data={filteredStreams}
            keyExtractor={(item) => getStreamId(item)}
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => {
              const id = getStreamId(item);
              const isSelected = selectedIds.includes(id);
              const icon = getStreamIcon(item);

              return (
                <StreamItem
                  isSelected={isSelected}
                  onPress={() => handleToggleSelect(id)}
                  testID={`stream-item-${id}`}
                >
                  <StreamIconWrapper>
                    {icon ? (
                      <StreamIcon source={{ uri: icon }} contentFit="contain" />
                    ) : (
                      <MaterialIcons
                        name={type === 'live' ? 'live-tv' : 'movie'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    )}
                  </StreamIconWrapper>
                  <StreamName isSelected={isSelected} numberOfLines={1}>
                    {item.name}
                  </StreamName>
                  <CheckboxCircle isSelected={isSelected}>
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color="#FFFFFF" />
                    )}
                  </CheckboxCircle>
                </StreamItem>
              );
            }}
            ListEmptyComponent={
              <EmptySearchText>
                {searchQuery
                  ? 'Nenhum resultado encontrado para a busca'
                  : 'Nenhum conteúdo disponível para seleção'}
              </EmptySearchText>
            }
          />

          <ModalFooter>
            <View style={{ flex: 1 }}>
              <ButtonGlobal
                variant="secondary"
                label="Cancelar"
                onPress={onClose}
                testID="cancel-folder-btn"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ButtonGlobal
                variant="primary"
                label="Salvar Pasta"
                onPress={handleSave}
                testID="save-folder-btn"
              />
            </View>
          </ModalFooter>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
