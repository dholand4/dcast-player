import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CategoryManagerModalGlobal } from '../index';
import { IXtreamCategory, IXtreamLiveStream } from '../../../@types/xtream';
import { storageService } from '../../../services/storageService';

jest.mock('../../../services/storageService', () => ({
  storageService: {
    getAccount: jest.fn(() => ({ serverUrl: 'http://test.com', username: 'user', password: 'pass', label: 'Test' })),
    getSavedAccounts: jest.fn(() => []),
    getUserInfo: jest.fn(() => null),
    getCachedCategories: jest.fn(() => []),
    getCachedStreams: jest.fn(() => []),
    getHiddenCategories: jest.fn(() => []),
    toggleHideCategory: jest.fn(() => true),
    getHiddenStreams: jest.fn(() => []),
    toggleHideStream: jest.fn(() => true),
    getCustomFolders: jest.fn(() => [
      {
        id: 'custom_1',
        name: 'Canais Abertos',
        type: 'live',
        streamIds: ['10', '20'],
        createdAt: 1700000000,
      },
    ]),
    saveCustomFolder: jest.fn(),
    deleteCustomFolder: jest.fn(),
    toggleStreamInCustomFolder: jest.fn(() => true),
  },
}));

const mockCategories: IXtreamCategory[] = [
  { category_id: '1', category_name: 'VARIEDADES' },
  { category_id: '2', category_name: 'ESPORTES' },
];

const mockStreams: IXtreamLiveStream[] = [
  { stream_id: 10, name: 'Globo SP HD', category_id: '1' } as IXtreamLiveStream,
  { stream_id: 20, name: 'Globo RJ HD', category_id: '1' } as IXtreamLiveStream,
];

const renderComponent = (props: any = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CategoryManagerModalGlobal
        visible={true}
        onClose={jest.fn()}
        type="live"
        categories={mockCategories}
        availableStreams={mockStreams}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('CategoryManagerModalGlobal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders server categories list with toggle button', () => {
    const { getByText, getByTestId } = renderComponent();

    expect(getByText('Gerenciador de Pastas')).toBeTruthy();
    expect(getByText('VARIEDADES')).toBeTruthy();
    expect(getByText('ESPORTES')).toBeTruthy();

    fireEvent.press(getByTestId('toggle-cat-1'));
    expect(storageService.toggleHideCategory).toHaveBeenCalledWith('live', '1');
  });

  it('switches to custom folders tab and displays user folders', () => {
    const { getByTestId, getByText } = renderComponent();

    fireEvent.press(getByTestId('tab-custom'));

    expect(getByText('📁 Canais Abertos')).toBeTruthy();
    expect(getByText('2 canal(is) adicionado(s)')).toBeTruthy();
    expect(getByTestId('create-custom-folder-btn')).toBeTruthy();
  });

  it('switches to streams tab and allows hiding individual streams', () => {
    const { getByTestId, getByText } = renderComponent();

    fireEvent.press(getByTestId('tab-streams'));

    expect(getByText('Globo SP HD')).toBeTruthy();
    expect(getByText('Globo RJ HD')).toBeTruthy();

    fireEvent.press(getByTestId('toggle-stream-10'));
    expect(storageService.toggleHideStream).toHaveBeenCalledWith('live', '10');
  });
});
