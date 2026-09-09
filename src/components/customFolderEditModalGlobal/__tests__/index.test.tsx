import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CustomFolderEditModalGlobal } from '../index';
import { IXtreamLiveStream } from '../../../@types/xtream';

const mockStreams: IXtreamLiveStream[] = [
  {
    stream_id: 1,
    name: 'Globo SP HD',
    category_id: '1',
  } as IXtreamLiveStream,
  {
    stream_id: 2,
    name: 'SBT HD',
    category_id: '1',
  } as IXtreamLiveStream,
  {
    stream_id: 3,
    name: 'Record HD',
    category_id: '1',
  } as IXtreamLiveStream,
];

const renderComponent = (props: any) => {
  return render(
    <ThemeProvider theme={theme}>
      <CustomFolderEditModalGlobal
        visible={true}
        onClose={jest.fn()}
        type="live"
        availableStreams={mockStreams}
        onSave={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('CustomFolderEditModalGlobal', () => {
  it('renders correctly with title and empty input for new folder', () => {
    const { getByText, getByTestId } = renderComponent({});

    expect(getByText('Nova Pasta')).toBeTruthy();
    expect(getByTestId('folder-name-input')).toBeTruthy();
    expect(getByText('Globo SP HD')).toBeTruthy();
    expect(getByText('SBT HD')).toBeTruthy();
  });

  it('selects and deselects streams on press', () => {
    const { getByText, getByTestId } = renderComponent({});

    expect(getByText('0 canal(is) selecionado(s)')).toBeTruthy();

    fireEvent.press(getByTestId('stream-item-1'));
    expect(getByText('1 canal(is) selecionado(s)')).toBeTruthy();

    fireEvent.press(getByTestId('stream-item-2'));
    expect(getByText('2 canal(is) selecionado(s)')).toBeTruthy();

    fireEvent.press(getByTestId('stream-item-1'));
    expect(getByText('1 canal(is) selecionado(s)')).toBeTruthy();
  });

  it('requires folder name on save', () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = renderComponent({ onSave });

    fireEvent.press(getByTestId('save-folder-btn'));
    expect(getByText('O nome da pasta é obrigatório')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves folder with name and selected streams', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = renderComponent({ onSave, onClose });

    fireEvent.changeText(getByTestId('folder-name-input'), 'Canais Abertos');
    fireEvent.press(getByTestId('stream-item-1'));
    fireEvent.press(getByTestId('stream-item-2'));

    fireEvent.press(getByTestId('save-folder-btn'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Canais Abertos',
        type: 'live',
        streamIds: ['1', '2'],
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
