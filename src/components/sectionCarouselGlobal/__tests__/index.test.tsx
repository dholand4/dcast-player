import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { SectionCarouselGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SectionCarouselGlobal', () => {
  it('renders section title and list items', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    const { getByText } = wrap(
      <SectionCarouselGlobal
        title="Continuar Assistindo"
        data={items}
        keyExtractor={(item) => item}
        renderItem={(item) => <Text>{item}</Text>}
      />
    );

    expect(getByText('Continuar Assistindo')).toBeTruthy();
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('renders empty message when data is empty', () => {
    const { getByText } = wrap(
      <SectionCarouselGlobal
        title="Favoritos"
        data={[]}
        keyExtractor={(item: string) => item}
        renderItem={(item: string) => <Text>{item}</Text>}
        emptyMessage="Nenhum favorito adicionado ainda"
      />
    );

    expect(getByText('Nenhum favorito adicionado ainda')).toBeTruthy();
  });
});
