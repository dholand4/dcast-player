import { useContext } from 'react';
import { CastContext, ICastContextData, ICastMediaParams } from '../providers/CastProvider';

export type { ICastMediaParams, ICastContextData };

export function useCast(): ICastContextData {
  return useContext(CastContext);
}
