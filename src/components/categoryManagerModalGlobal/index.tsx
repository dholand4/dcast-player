import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { ICustomCategoryFolder } from '../../@types/storage';
import { IXtreamCategory, IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';
import { useAuth } from '../../hooks/useAuth';
import { storageService } from '../../services/storageService';
import { xtreamService } from '../../services/xtreamService';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { CustomFolderEditModalGlobal } from '../customFolderEditModalGlobal';
import { InputGlobal } from '../inputGlobal';
import { ICategoryManagerModalGlobalProps, CategoryManagerTab } from './types';
import {
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  HeaderTitleContainer,
  ModalTitle,
  ModalSubtitle,
  CloseButton,
  TabBar,
  TabButton,
  TabButtonText,
  TabBadge,
  TabBadgeText,
  TabContent,
  SearchWrapper,
  CreateFolderBanner,
  CreateFolderBannerTitle,
  CategoryRow,
  CategoryInfo,
  CategoryName,
  StatusBadge,
  StatusBadgeText,
  ToggleButton,
  ToggleButtonText,
  CustomFolderRow,
  FolderInfoContainer,
  FolderIconBox,
  FolderTextsContainer,
  FolderMetaText,
  FolderActions,
  ActionIconButton,
  EmptyContainer,
  EmptyText,
} from './style';

export const CategoryManagerModalGlobal: React.FC<ICategoryManagerModalGlobalProps> = ({
  visible,
  onClose,
  type,
  categories = [],
  availableStreams = [],
}) => {
  const theme = useTheme();
  const { account } = useAuth();
  const [activeTab, setActiveTab] = useState<CategoryManagerTab>('server');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback states for categories and streams
  const [allCategories, setAllCategories] = useState<IXtreamCategory[]>(categories);
  const [allStreamsList, setAllStreamsList] = useState<any[]>(availableStreams);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setAllCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (availableStreams && availableStreams.length > 0) {
      setAllStreamsList((prev) => (availableStreams.length > prev.length ? availableStreams : prev));
    }
  }, [availableStreams]);

  // Load cached categories if empty
  useEffect(() => {
    let isMounted = true;
    if (visible && account && allCategories.length === 0) {
      const accKey = `${account.serverUrl}_${account.username}`;
      const catKey = `${accKey}_cat_${type}`;
      const cached = storageService.getCachedCategories<IXtreamCategory[]>(catKey);
      if (cached && cached.length > 0) {
        setAllCategories(cached);
      } else {
        const fetchCats = async () => {
          try {
            let res: IXtreamCategory[] = [];
            if (type === 'live') res = await xtreamService.getLiveCategories(account);
            else if (type === 'movie') res = await xtreamService.getVodCategories(account);
            else res = await xtreamService.getSeriesCategories(account);
            if (isMounted && res && res.length > 0) {
              setAllCategories(res);
              storageService.saveCachedCategories(catKey, res);
            }
          } catch {
            // ignore
          }
        };
        fetchCats();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [visible, account, type, allCategories.length]);

  // Load all streams for tab 3 and for custom folder creation
  useEffect(() => {
    let isMounted = true;
    if (visible && account && allStreamsList.length < 20) {
      const accKey = `${account.serverUrl}_${account.username}`;
      const allKey = `${accKey}_streams_${type}_all`;
      const cached = storageService.getCachedStreams<any[]>(allKey);
      if (cached && cached.length > 0) {
        setAllStreamsList(cached);
      } else {
        const fetchAll = async () => {
          try {
            let res: any[] = [];
            if (type === 'live') res = await xtreamService.getLiveStreams(account);
            else if (type === 'movie') res = await xtreamService.getVodStreams(account);
            else res = await xtreamService.getSeries(account);
            if (isMounted && res && res.length > 0) {
              setAllStreamsList(res);
              storageService.saveCachedStreams(allKey, res);
            }
          } catch {
            // ignore
          }
        };
        fetchAll();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [visible, account, type, allStreamsList.length]);

  // Custom folder editor state
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<ICustomCategoryFolder | null>(null);

  const {
    hiddenCategories,
    hiddenStreams,
    customFolders,
    toggleHideCategory,
    toggleHideStream,
    saveFolder,
    deleteFolder,
  } = useCategoryManager(type);

  const handleOpenNewFolder = useCallback(() => {
    setFolderToEdit(null);
    setIsEditorVisible(true);
  }, []);

  const handleOpenEditFolder = useCallback((folder: ICustomCategoryFolder) => {
    setFolderToEdit(folder);
    setIsEditorVisible(true);
  }, []);

  const handleDeleteFolder = useCallback(
    (folder: ICustomCategoryFolder) => {
      Alert.alert(
        'Excluir Pasta',
        `Deseja realmente excluir a pasta "${folder.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => deleteFolder(folder.id),
          },
        ]
      );
    },
    [deleteFolder]
  );

  const getStreamId = (item: IXtreamLiveStream | IXtreamVodStream | IXtreamSeries): string => {
    if ('stream_id' in item) return String(item.stream_id);
    if ('series_id' in item) return String(item.series_id);
    return '';
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((c) => (c.category_name || '').toLowerCase().includes(q));
  }, [allCategories, searchQuery]);

  // Filtered streams for hiding
  const filteredStreams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allStreamsList.slice(0, 100);
    return allStreamsList
      .filter((s) => (s.name || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [allStreamsList, searchQuery]);

  const hiddenCategoriesCount = useMemo(() => {
    return allCategories.filter((c) => hiddenCategories.includes(String(c.category_id))).length;
  }, [allCategories, hiddenCategories]);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        testID="category-manager-modal"
      >
        <ModalBackdrop>
          <ModalContainer>
            <ModalHeader>
              <HeaderTitleContainer>
                <ModalTitle>Gerenciador de Pastas</ModalTitle>
                <ModalSubtitle>
                  {type === 'live'
                    ? 'Organize e personalize seus canais de TV'
                    : type === 'movie'
                    ? 'Organize e personalize seus filmes'
                    : 'Organize e personalize suas séries'}
                </ModalSubtitle>
              </HeaderTitleContainer>
              <CloseButton onPress={onClose} testID="category-manager-close-btn">
                <MaterialIcons name="close" size={22} color={theme.colors.text} />
              </CloseButton>
            </ModalHeader>

            <TabBar>
              <TabButton
                isActive={activeTab === 'server'}
                onPress={() => {
                  setActiveTab('server');
                  setSearchQuery('');
                }}
                testID="tab-server"
              >
                <MaterialIcons
                  name="list"
                  size={16}
                  color={activeTab === 'server' ? theme.colors.primary : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <TabButtonText isActive={activeTab === 'server'}>
                  Pastas da Lista
                </TabButtonText>
                <TabBadge isActive={activeTab === 'server'}>
                  <TabBadgeText isActive={activeTab === 'server'}>
                    {categories.length}
                  </TabBadgeText>
                </TabBadge>
              </TabButton>

              <TabButton
                isActive={activeTab === 'custom'}
                onPress={() => {
                  setActiveTab('custom');
                  setSearchQuery('');
                }}
                testID="tab-custom"
              >
                <MaterialIcons
                  name="folder-special"
                  size={16}
                  color={activeTab === 'custom' ? theme.colors.primary : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <TabButtonText isActive={activeTab === 'custom'}>
                  Minhas Pastas
                </TabButtonText>
                <TabBadge isActive={activeTab === 'custom'}>
                  <TabBadgeText isActive={activeTab === 'custom'}>
                    {customFolders.length}
                  </TabBadgeText>
                </TabBadge>
              </TabButton>

              <TabButton
                isActive={activeTab === 'streams'}
                onPress={() => {
                  setActiveTab('streams');
                  setSearchQuery('');
                }}
                testID="tab-streams"
              >
                <MaterialIcons
                  name="visibility-off"
                  size={16}
                  color={activeTab === 'streams' ? theme.colors.primary : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <TabButtonText isActive={activeTab === 'streams'}>
                  {type === 'live' ? 'Canais' : 'Conteúdos'} Ocultos
                </TabButtonText>
                <TabBadge isActive={activeTab === 'streams'}>
                  <TabBadgeText isActive={activeTab === 'streams'}>
                    {hiddenStreams.length}
                  </TabBadgeText>
                </TabBadge>
              </TabButton>
            </TabBar>

            <TabContent>
              {/* Tab 1: Pastas da Lista (Server Categories) */}
              {activeTab === 'server' && (
                <>
                  <SearchWrapper>
                    <InputGlobal
                      placeholder="Buscar pasta da lista..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      noMargin
                      testID="manager-category-search-input"
                    />
                  </SearchWrapper>

                  <FlatList
                    data={filteredCategories}
                    keyExtractor={(c) => String(c.category_id)}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => {
                      const isHidden = hiddenCategories.includes(String(item.category_id));
                      return (
                        <CategoryRow isHidden={isHidden} testID={`category-row-${item.category_id}`}>
                          <CategoryInfo>
                            <CategoryName isHidden={isHidden} numberOfLines={1}>
                              {item.category_name}
                            </CategoryName>
                            <StatusBadge isHidden={isHidden}>
                              <StatusBadgeText isHidden={isHidden}>
                                {isHidden ? 'OCULTA NO MENU' : 'VISÍVEL'}
                              </StatusBadgeText>
                            </StatusBadge>
                          </CategoryInfo>

                          <ToggleButton
                            isHidden={isHidden}
                            onPress={() => toggleHideCategory(String(item.category_id))}
                            testID={`toggle-cat-${item.category_id}`}
                          >
                            <MaterialIcons
                              name={isHidden ? 'visibility-off' : 'visibility'}
                              size={18}
                              color={isHidden ? theme.colors.textSecondary : theme.colors.primary}
                            />
                            <ToggleButtonText isHidden={isHidden}>
                              {isHidden ? 'Mostrar' : 'Ocultar'}
                            </ToggleButtonText>
                          </ToggleButton>
                        </CategoryRow>
                      );
                    }}
                    ListEmptyComponent={
                      <EmptyContainer>
                        <MaterialIcons name="folder-off" size={40} color={theme.colors.textMuted} />
                        <EmptyText>Nenhuma pasta encontrada</EmptyText>
                      </EmptyContainer>
                    }
                  />
                </>
              )}

              {/* Tab 2: Minhas Pastas (Custom User Folders) */}
              {activeTab === 'custom' && (
                <>
                  <CreateFolderBanner
                    onPress={handleOpenNewFolder}
                    testID="create-custom-folder-btn"
                  >
                    <MaterialIcons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <CreateFolderBannerTitle>+ Nova Pasta Personalizada</CreateFolderBannerTitle>
                  </CreateFolderBanner>

                  <FlatList
                    data={customFolders}
                    keyExtractor={(f) => f.id}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => (
                      <CustomFolderRow testID={`custom-folder-row-${item.id}`}>
                        <FolderInfoContainer>
                          <FolderIconBox>
                            <MaterialIcons name="folder" size={22} color="#4CAF50" />
                          </FolderIconBox>
                          <FolderTextsContainer>
                            <CategoryName isHidden={false} numberOfLines={1}>
                              📁 {item.name}
                            </CategoryName>
                            <FolderMetaText>
                              {item.streamIds.length}{' '}
                              {type === 'live' ? 'canal(is) adicionado(s)' : 'item(ns) adicionado(s)'}
                            </FolderMetaText>
                          </FolderTextsContainer>
                        </FolderInfoContainer>

                        <FolderActions>
                          <ActionIconButton
                            onPress={() => handleOpenEditFolder(item)}
                            testID={`edit-folder-${item.id}`}
                            accessibilityLabel="Editar pasta"
                          >
                            <MaterialIcons name="edit" size={18} color={theme.colors.text} />
                          </ActionIconButton>
                          <ActionIconButton
                            onPress={() => handleDeleteFolder(item)}
                            testID={`delete-folder-${item.id}`}
                            accessibilityLabel="Excluir pasta"
                          >
                            <MaterialIcons name="delete" size={18} color={theme.colors.error} />
                          </ActionIconButton>
                        </FolderActions>
                      </CustomFolderRow>
                    )}
                    ListEmptyComponent={
                      <EmptyContainer>
                        <MaterialIcons name="create-new-folder" size={44} color={theme.colors.textMuted} />
                        <EmptyText>
                          Você ainda não criou pastas personalizadas.{'\n'}
                          Toque em "+ Nova Pasta" para criar (ex: "Canais Abertos").
                        </EmptyText>
                      </EmptyContainer>
                    }
                  />
                </>
              )}

              {/* Tab 3: Canais / Itens Ocultos */}
              {activeTab === 'streams' && (
                <>
                  <SearchWrapper>
                    <InputGlobal
                      placeholder={type === 'live' ? 'Buscar canal para ocultar...' : 'Buscar conteúdo...'}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      noMargin
                      testID="manager-stream-search-input"
                    />
                  </SearchWrapper>

                  <FlatList
                    data={filteredStreams}
                    keyExtractor={(s) => getStreamId(s)}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => {
                      const id = getStreamId(item);
                      const isHidden = hiddenStreams.includes(id);

                      return (
                        <CategoryRow isHidden={isHidden} testID={`stream-row-${id}`}>
                          <CategoryInfo>
                            <CategoryName isHidden={isHidden} numberOfLines={1}>
                              {item.name}
                            </CategoryName>
                            <StatusBadge isHidden={isHidden}>
                              <StatusBadgeText isHidden={isHidden}>
                                {isHidden ? 'CANAL OCULTO' : 'VISÍVEL'}
                              </StatusBadgeText>
                            </StatusBadge>
                          </CategoryInfo>

                          <ToggleButton
                            isHidden={isHidden}
                            onPress={() => toggleHideStream(id)}
                            testID={`toggle-stream-${id}`}
                          >
                            <MaterialIcons
                              name={isHidden ? 'visibility-off' : 'visibility'}
                              size={18}
                              color={isHidden ? theme.colors.textSecondary : theme.colors.primary}
                            />
                            <ToggleButtonText isHidden={isHidden}>
                              {isHidden ? 'Mostrar' : 'Ocultar'}
                            </ToggleButtonText>
                          </ToggleButton>
                        </CategoryRow>
                      );
                    }}
                    ListEmptyComponent={
                      <EmptyContainer>
                        <MaterialIcons name="search-off" size={40} color={theme.colors.textMuted} />
                        <EmptyText>Nenhum canal encontrado</EmptyText>
                      </EmptyContainer>
                    }
                  />
                </>
              )}
            </TabContent>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Modal de Criação / Edição de Pasta Customizada */}
      <CustomFolderEditModalGlobal
        visible={isEditorVisible}
        onClose={() => setIsEditorVisible(false)}
        type={type}
        folderToEdit={folderToEdit}
        availableStreams={allStreamsList}
        onSave={saveFolder}
      />
    </>
  );
};
