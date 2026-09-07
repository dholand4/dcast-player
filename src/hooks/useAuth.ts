import { useContext, useState, useCallback, useEffect } from 'react';
import { AuthContext, IAuthContextData } from '../providers/AuthProvider';
import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import { storageService } from '../services/storageService';
import { xtreamService } from '../services/xtreamService';
import { parseM3uUrl } from '../utils/m3uParser';

export function useAuth(): IAuthContextData {
  const context = useContext(AuthContext);
  if (context && typeof context.loginWithM3u === 'function') {
    return context;
  }

  // Standalone fallback for testing or unprovided trees
  const [account, setAccount] = useState<IAccountCredentials | null>(null);
  const [userInfo, setUserInfo] = useState<IXtreamUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = storageService.getAccount();
    const savedInfo = storageService.getUserInfo();
    setAccount(saved);
    setUserInfo(savedInfo);
  }, []);

  const loginWithM3u = useCallback(async (m3uUrl: string, label?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const creds = parseM3uUrl(m3uUrl, label);
    if (!creds) {
      setError('Formato de link M3U inválido. Verifique o link e tente novamente.');
      setIsLoading(false);
      return false;
    }

    try {
      const authData = await xtreamService.authenticate(creds);
      storageService.saveAccount(creds);
      setAccount(creds);
      if (authData?.user_info) {
        storageService.saveUserInfo(authData.user_info);
        setUserInfo(authData.user_info);
      }
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação com o servidor.';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loginWithCredentials = useCallback(async (creds: IAccountCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const authData = await xtreamService.authenticate(creds);
      storageService.saveAccount(creds);
      setAccount(creds);
      if (authData?.user_info) {
        storageService.saveUserInfo(authData.user_info);
        setUserInfo(authData.user_info);
      }
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação com o servidor.';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    storageService.clearAccount();
    setAccount(null);
    setUserInfo(null);
  }, []);

  return {
    account,
    userInfo,
    isLoading,
    error,
    loginWithM3u,
    loginWithCredentials,
    logout,
  };
}

