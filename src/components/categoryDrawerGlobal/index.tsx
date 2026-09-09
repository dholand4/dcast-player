import React, { useState, useMemo } from 'react';
import { Modal, FlatList, Platform, Alert, TouchableOpacity, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useAuth } from '../../hooks/useAuth';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { clearXtreamCache } from '../../hooks/useXtream';
import { storageService } from '../../services/storageService';
import { formatExpirationDate } from '../../utils/formatters';
import { ICategoryDrawerGlobalProps } from './types';
import { InputGlobal } from '../inputGlobal';
import { ConfirmModalGlobal } from '../confirmModalGlobal';
import {
  ModalOverlay,
  DrawerContainer,
  DrawerHeader,
  DrawerTitle,
  CloseButton,
  ManageBannerButton,
  ManageBannerLeft,
  ManageBannerTitle,
  SectionHeader,
  SectionHeaderText,
  FolderIconCircle,
  FolderCountBadge,
  FolderCountText,
  DrawerSearchWrapper,
  CategoryItem,
  CategoryItemContent,
  CategoryItemText,
  EmptySearchText,
  DrawerFooter,
  DrawerFooterTitle,
  DrawerFooterSub,
  DrawerFooterExp,
} from './style';

export const CategoryDrawerGlobal: React.FC<ICategoryDrawerGlobalProps> = ({
  visible,
  categories,
  selectedCategory,
  onSelectCategory,
  onClose,
  favoritesCount = 0,
  continueWatchingCount = 0,
  type,
  onOpenCategoryManager,
}) => {
  const theme = useTheme();
  const insets = useAppInsets();
  const { account, userInfo, logout } = useAuth();
  const { hiddenCategories, customFolders } = useCategoryManager(type || 'live');
  const [filterText, setFilterText] = useState('');
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const handleExecuteLogout = () => {
    setIsLogoutModalVisible(false);
    onClose();
    clearXtreamCache();
    storageService.clearCatalogCache();
    logout();
  };


  const filteredCategories = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const visibleCats = categories.filter(
      (cat) => !hiddenCategories.includes(String(cat.category_id))
    );
    if (!q) return visibleCats;
    return visibleCats.filter((cat) =>
      (cat.category_name || '').toLowerCase().includes(q)
    );
  }, [categories, filterText, hiddenCategories]);

  const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="category-drawer-modal"
    >
      <ModalOverlay activeOpacity={1} onPress={onClose}>
        <DrawerContainer
          activeOpacity={1}
          insetTop={insets.top}
          insetBottom={insets.bottom}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <DrawerHeader>
            <DrawerTitle>Listas & Categorias</DrawerTitle>
            <CloseButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              testID="close-drawer-button"
            >
              <MaterialIcons name="close" size={22} color={theme.colors.text} />
            </CloseButton>
          </DrawerHeader>

          {/* Banner de Gerenciamento de Pastas */}
          {onOpenCategoryManager && (
            <ManageBannerButton
              onPress={() => {
                onClose();
                onOpenCategoryManager();
              }}
              accessibilityRole="button"
              accessibilityLabel="Gerenciar pastas"
              testID="drawer-manage-folders-button"
            >
              <ManageBannerLeft>
                <MaterialIcons name="tune" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <ManageBannerTitle>Gerenciar Pastas e Categorias</ManageBannerTitle>
              </ManageBannerLeft>
              <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
            </ManageBannerButton>
          )}

          {/* Busca de Categoria */}
          <DrawerSearchWrapper>
            <InputGlobal
              placeholder="Buscar lista/categoria..."
              value={filterText}
              onChangeText={setFilterText}
              onClear={() => setFilterText('')}
            />
          </DrawerSearchWrapper>

          {/* Lista de Categorias */}
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.category_id}
            ListHeaderComponent={
              !filterText ? (
                <>
                  <SectionHeader>
                    <SectionHeaderText>NAVEGAÇÃO</SectionHeaderText>
                  </SectionHeader>

                  <CategoryItem
                    isSelected={selectedCategory === 'favorites'}
                    onPress={() => handleSelect('favorites')}
                    accessibilityRole="button"
                    testID="drawer-item-favorites"
                  >
                    <CategoryItemContent>
                      <MaterialIcons
                        name="favorite"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <CategoryItemText isSelected={selectedCategory === 'favorites'}>
                        Favoritos {favoritesCount > 0 ? `(${favoritesCount})` : ''}
                      </CategoryItemText>
                    </CategoryItemContent>
                    {selectedCategory === 'favorites' && (
                      <MaterialIcons
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </CategoryItem>

                  {type !== 'live' && (
                    <CategoryItem
                      isSelected={selectedCategory === 'continue_watching'}
                      onPress={() => handleSelect('continue_watching')}
                      accessibilityRole="button"
                      testID="drawer-item-continue-watching"
                    >
                      <CategoryItemContent>
                        <MaterialIcons
                          name="history"
                          size={20}
                          color={
                            selectedCategory === 'continue_watching'
                              ? theme.colors.primary
                              : '#FFB300'
                          }
                        />
                        <CategoryItemText
                          isSelected={selectedCategory === 'continue_watching'}
                        >
                          Continuar Assistindo {continueWatchingCount > 0 ? `(${continueWatchingCount})` : ''}
                        </CategoryItemText>
                      </CategoryItemContent>
                      {selectedCategory === 'continue_watching' && (
                        <MaterialIcons
                          name="check"
                          size={18}
                          color={theme.colors.primary}
                        />
                      )}
                    </CategoryItem>
                  )}

                  <CategoryItem
                    isSelected={selectedCategory === 'all'}
                    onPress={() => handleSelect('all')}
                    accessibilityRole="button"
                    testID="drawer-item-all"
                  >
                    <CategoryItemContent>
                      <MaterialIcons
                        name="view-list"
                        size={20}
                        color={
                          selectedCategory === 'all'
                            ? theme.colors.white
                            : theme.colors.textSecondary
                        }
                      />
                      <CategoryItemText isSelected={selectedCategory === 'all'}>
                        {type === 'live'
                          ? 'Todos os Canais'
                          : type === 'movie'
                          ? 'Todos os Filmes'
                          : type === 'series'
                          ? 'Todas as Séries'
                          : 'Todos os Conteúdos'}
                      </CategoryItemText>
                    </CategoryItemContent>
                    {selectedCategory === 'all' && (
                      <MaterialIcons
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </CategoryItem>

                  {customFolders.length > 0 && (
                    <>
                      <SectionHeader>
                        <SectionHeaderText>MINHAS PASTAS ({customFolders.length})</SectionHeaderText>
                      </SectionHeader>
                      {customFolders.map((folder) => {
                        const isSelected = selectedCategory === folder.id;
                        return (
                          <CategoryItem
                            key={folder.id}
                            isSelected={isSelected}
                            onPress={() => handleSelect(folder.id)}
                            accessibilityRole="button"
                            testID={`drawer-item-custom-${folder.id}`}
                          >
                            <CategoryItemContent>
                              <FolderIconCircle isSelected={isSelected}>
                                <MaterialIcons
                                  name="folder"
                                  size={16}
                                  color={isSelected ? '#FFFFFF' : '#4CAF50'}
                                />
                              </FolderIconCircle>
                              <CategoryItemText isSelected={isSelected} numberOfLines={1}>
                                {folder.name}
                              </CategoryItemText>
                              <FolderCountBadge isSelected={isSelected}>
                                <FolderCountText isSelected={isSelected}>
                                  {folder.streamIds.length} {folder.streamIds.length === 1 ? 'canal' : 'canais'}
                                </FolderCountText>
                              </FolderCountBadge>
                            </CategoryItemContent>
                            {isSelected && (
                              <MaterialIcons
                                name="check"
                                size={18}
                                color={theme.colors.primary}
                              />
                            )}
                          </CategoryItem>
                        );
                      })}
                    </>
                  )}

                  <SectionHeader>
                    <SectionHeaderText>CATEGORIAS DA LISTA ({filteredCategories.length})</SectionHeaderText>
                  </SectionHeader>
                </>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.category_id;
              return (
                <CategoryItem
                  isSelected={isSelected}
                  onPress={() => handleSelect(item.category_id)}
                  accessibilityRole="button"
                  testID={`drawer-item-${item.category_id}`}
                >
                  <CategoryItemContent>
                    <MaterialIcons
                      name="folder"
                      size={20}
                      color={
                        isSelected ? theme.colors.primaryLight : theme.colors.textMuted
                      }
                    />
                    <CategoryItemText isSelected={isSelected}>
                      {item.category_name}
                    </CategoryItemText>
                  </CategoryItemContent>
                  {isSelected && (
                    <MaterialIcons
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </CategoryItem>
              );
            }}
            ListEmptyComponent={
              <EmptySearchText>Nenhuma lista encontrada com esse nome.</EmptySearchText>
            }
          />

          {account && (
            <DrawerFooter testID="drawer-account-footer">
              <DrawerFooterTitle>{account.label || 'DCast Player'}</DrawerFooterTitle>
              <DrawerFooterSub>@{account.username}</DrawerFooterSub>
              <DrawerFooterExp>
                📅 {formatExpirationDate(userInfo?.exp_date)}
              </DrawerFooterExp>

              <TouchableOpacity
                onPress={handleConfirmLogout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.08)',
                  gap: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel="Sair ou trocar lista"
                testID="drawer-logout-button"
              >
                <MaterialIcons name="logout" size={16} color="#E50914" />
                <Text style={{ color: '#E50914', fontSize: 12, fontWeight: 'bold' }}>
                  Trocar / Sair da Lista
                </Text>
              </TouchableOpacity>
            </DrawerFooter>
          )}
        </DrawerContainer>
      </ModalOverlay>

      <ConfirmModalGlobal
        visible={isLogoutModalVisible}
        title="Sair da Lista"
        description={`Deseja sair de "${account?.label || account?.username || 'esta lista'}"? Suas listas continuarão salvas para você alternar quando quiser.`}
        confirmText="Sair e Trocar"
        cancelText="Cancelar"
        variant="danger"
        iconName="logout"
        onConfirm={handleExecuteLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
        testID="drawer-logout-modal"
      />
    </Modal>
  );
};
