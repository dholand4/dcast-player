import { useContext } from 'react';
import { ProfileContext, IProfileContextData } from '../providers/ProfileProvider';

export function useProfiles(): IProfileContextData {
  return useContext(ProfileContext);
}
