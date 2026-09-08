import { ReactElement } from 'react';

export interface ISectionCarouselGlobalProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => ReactElement;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  testID?: string;
  rightAction?: React.ReactNode;
}
