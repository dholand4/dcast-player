import { useContext } from 'react';
import { CastContext, ICastContextData, ICastMediaParams } from '../providers/CastProvider.web';

export type { ICastMediaParams, ICastContextData };

export function useCast(): ICastContextData {
  const context = useContext(CastContext);
  return context;
}
