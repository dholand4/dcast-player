import React from 'react';
import { ISectionCarouselGlobalProps } from './types';
import {
  Container,
  Title,
  ScrollList,
  ItemSpacing,
  EmptyContainer,
  EmptyText,
} from './style';

export function SectionCarouselGlobal<T>({
  title,
  data,
  renderItem,
  keyExtractor,
  emptyMessage,
  testID,
}: ISectionCarouselGlobalProps<T>) {
  if (!data || data.length === 0) {
    if (!emptyMessage) return null;
    return (
      <Container testID={testID}>
        <Title>{title}</Title>
        <EmptyContainer>
          <EmptyText>{emptyMessage}</EmptyText>
        </EmptyContainer>
      </Container>
    );
  }

  return (
    <Container testID={testID}>
      <Title>{title}</Title>
      <ScrollList>
        {data.map((item, index) => (
          <ItemSpacing key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </ItemSpacing>
        ))}
      </ScrollList>
    </Container>
  );
}
