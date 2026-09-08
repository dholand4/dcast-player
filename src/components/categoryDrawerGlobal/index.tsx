import React, { useState, useMemo } from 'react';
import { Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useAuth } from '../../hooks/useAuth';
import { formatExpirationDate } from '../../utils/formatters';
import { ICategoryDrawerGlobalProps } from './types';
import { InputGlobal } from '../inputGlobal';
import {
  ModalOverlay,
  DrawerContainer,
  DrawerHeader,
  DrawerTitle,
  CloseButton,
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
}) => {
  const theme = useTheme();
  const insets = useAppInsets();
  const { account, userInfo } = useAuth();
  const [filterText, setFilterText] = useState('');


  const filteredCategories = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) =>
      (cat.category_name || '').toLowerCase().includes(q)
    );
  }, [categories, filterText]);

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
                        Todos os Conteúdos
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
            </DrawerFooter>
          )}
        </DrawerContainer>
      </ModalOverlay>
    </Modal>
  );
};
