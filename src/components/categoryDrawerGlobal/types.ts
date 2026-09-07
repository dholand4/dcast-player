import { IXtreamCategory } from '../../@types/xtream';

export interface ICategoryDrawerGlobalProps {
  visible: boolean;
  categories: IXtreamCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
  favoritesCount?: number;
  totalStreamsCount?: number;
}
