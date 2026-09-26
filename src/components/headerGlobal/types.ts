import { ReactNode } from 'react';

export interface IHeaderGlobalProps {
  title: string;
  subtitle?: string;
  extraInfo?: string;
  onBack?: () => void;
  onSearchPress?: () => void;
  showCast?: boolean;
  /** Elemento antes do título, à esquerda (ex.: ícone do perfil) */
  leftAccessory?: ReactNode;
  /** Torna o título (e o leftAccessory) tocável */
  onTitlePress?: () => void;
  titleAccessibilityLabel?: string;
  testID?: string;
}

