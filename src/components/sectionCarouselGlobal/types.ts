import { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export interface ISectionCarouselGlobalProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => ReactElement;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  testID?: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
