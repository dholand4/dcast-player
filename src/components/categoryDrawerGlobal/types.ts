import { IXtreamCategory } from '../../@types/xtream';

export interface ICategoryDrawerGlobalProps {
  visible: boolean;
  categories: IXtreamCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
  favoritesCount?: number;
  continueWatchingCount?: number;
  type?: 'live' | 'movie' | 'series';
  totalStreamsCount?: number;
  onOpenCategoryManager?: () => void;
}
