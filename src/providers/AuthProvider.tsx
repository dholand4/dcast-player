import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import { storageService } from '../services/storageService';
import { xtreamService } from '../services/xtreamService';
import { parseM3uUrl } from '../utils/m3uParser';

export interface IAuthContextData {
  account: IAccountCredentials | null;
  userInfo: IXtreamUserInfo | null;
  savedAccounts: IAccountCredentials[];
  isLoading: boolean;
  error: string | null;
  loginWithM3u: (m3uUrl: string, label?: string) => Promise<boolean>;
  loginWithCredentials: (creds: IAccountCredentials) => Promise<boolean>;
  removeSavedAccount: (serverUrl: string, username: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<IAuthContextData>({} as IAuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<IAccountCredentials | null>(null);
  const [userInfo, setUserInfo] = useState<IXtreamUserInfo | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<IAccountCredentials[]>(() => {
    try {
      return storageService.getSavedAccounts();
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = storageService.getAccount();
    const savedInfo = storageService.getUserInfo();
    setAccount(saved);
    setUserInfo(savedInfo);
    setSavedAccounts(storageService.getSavedAccounts());
    setIsLoading(false);

    if (saved) {
      xtreamService
        .authenticate(saved)
        .then((data) => {
          if (data?.user_info) {
            storageService.saveUserInfo(data.user_info);
            setUserInfo(data.user_info);
          }
        })
        .catch(() => {
          // ignore background refresh failure
        });
    }
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
      setSavedAccounts(storageService.getSavedAccounts());
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
      setSavedAccounts(storageService.getSavedAccounts());
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

  const removeSavedAccount = useCallback((serverUrl: string, username: string) => {
    storageService.removeSavedAccount(serverUrl, username);
    setSavedAccounts(storageService.getSavedAccounts());
  }, []);

  const logout = useCallback(() => {
    storageService.clearAccount();
    setAccount(null);
    setUserInfo(null);
    setSavedAccounts(storageService.getSavedAccounts());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        account,
        userInfo,
        savedAccounts,
        isLoading,
        error,
        loginWithM3u,
        loginWithCredentials,
        removeSavedAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

