import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CategoryDrawerGlobal } from '../index';

const mockCategories = [
  { category_id: '1', category_name: 'Abertos', parent_id: 0 },
  { category_id: '2', category_name: 'Esportes', parent_id: 0 },
];

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CategoryDrawerGlobal', () => {
  it('renders drawer with categories and selects category', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    const { getByText, getByTestId } = wrap(
      <CategoryDrawerGlobal
        visible={true}
        categories={mockCategories}
        selectedCategory="1"
        onSelectCategory={onSelect}
        onClose={onClose}
        favoritesCount={3}
      />
    );

    expect(getByText('Listas & Categorias')).toBeTruthy();
    expect(getByText('Favoritos (3)')).toBeTruthy();
    expect(getByText('Abertos')).toBeTruthy();
    expect(getByText('Esportes')).toBeTruthy();

    fireEvent.press(getByTestId('drawer-item-2'));
    expect(onSelect).toHaveBeenCalledWith('2');
    expect(onClose).toHaveBeenCalled();
  });

  it('handles close button press', () => {
    const onClose = jest.fn();

    const { getByTestId } = wrap(
      <CategoryDrawerGlobal
        visible={true}
        categories={mockCategories}
        selectedCategory="1"
        onSelectCategory={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId('close-drawer-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
