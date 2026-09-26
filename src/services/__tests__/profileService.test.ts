import { profileService, MAX_PROFILES } from '../profileService';
import { storageService } from '../storageService';
import { supabaseService } from '../supabaseService';
import { IProfile } from '../../@types/storage';

let mockStored: IProfile[] = [];

jest.mock('../storageService', () => ({
  DEFAULT_PROFILE_ID: 'default',
  storageService: {
    getAccount: jest.fn(() => ({ serverUrl: 'http://a.tv', username: 'ana', password: '1', label: '' })),
    getActiveProfileId: jest.fn(() => 'default'),
    getProfiles: jest.fn((includeDeleted?: boolean) =>
      includeDeleted ? mockStored : mockStored.filter((profile) => !profile.deleted)
    ),
    saveProfiles: jest.fn((list: IProfile[]) => {
      mockStored = list;
    }),
    deleteProfileData: jest.fn(),
  },
}));

jest.mock('../supabaseService', () => ({
  supabaseService: {
    getUserKey: jest.fn(() => 'account_key'),
    getProfileKey: jest.fn((_account: unknown, profileId: string) => `profile_key_${profileId}`),
    upsertProfiles: jest.fn(async () => {}),
    fetchProfiles: jest.fn(async () => []),
    clearWatchProgress: jest.fn(async () => {}),
    clearFavorites: jest.fn(async () => {}),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    mockStored = [];
    jest.clearAllMocks();
  });

  it('creates the "Principal" profile the first time', () => {
    const profiles = profileService.getProfiles();
    expect(profiles).toEqual([expect.objectContaining({ id: 'default', name: 'Principal' })]);
  });

  it('creates, renames and syncs a profile to the account key', () => {
    profileService.getProfiles();
    const created = profileService.createProfile('  Maria  ', '#29B6F6');

    expect(created).toEqual(expect.objectContaining({ name: 'Maria', color: '#29B6F6' }));
    expect(supabaseService.upsertProfiles).toHaveBeenCalledWith('account_key', [created]);

    profileService.updateProfile(created!.id, { name: 'Mãe', color: '#46D369' });
    expect(storageService.getProfiles().find((p) => p.id === created!.id)?.name).toBe('Mãe');
  });

  it(`limits to ${MAX_PROFILES} profiles`, () => {
    profileService.getProfiles();
    for (let i = 0; i < MAX_PROFILES; i++) profileService.createProfile(`P${i}`, '#FFFFFF');
    expect(storageService.getProfiles()).toHaveLength(MAX_PROFILES);
  });

  it('deletes a profile with its data but never the default one', () => {
    profileService.getProfiles();
    const created = profileService.createProfile('Kids', '#FFB300')!;

    expect(profileService.deleteProfile('default')).toBe(false);
    expect(profileService.deleteProfile(created.id)).toBe(true);

    expect(storageService.getProfiles().map((p) => p.id)).toEqual(['default']);
    expect(storageService.deleteProfileData).toHaveBeenCalledWith(created.id);
    expect(supabaseService.clearWatchProgress).toHaveBeenCalledWith(`profile_key_${created.id}`);
    expect(supabaseService.clearFavorites).toHaveBeenCalledWith(`profile_key_${created.id}`);
    expect(supabaseService.upsertProfiles).toHaveBeenLastCalledWith('account_key', [
      expect.objectContaining({ id: created.id, deleted: true }),
    ]);
  });

  it('merges cloud profiles by most recent change and uploads local-only ones', async () => {
    mockStored = [
      { id: 'default', name: 'Principal', color: '#E50914', createdAt: 0, updatedAt: 0 },
      { id: 'local', name: 'Só aqui', color: '#E50914', createdAt: 5, updatedAt: 5 },
      { id: 'gone', name: 'Removido lá', color: '#E50914', createdAt: 3, updatedAt: 3 },
    ];
    (supabaseService.fetchProfiles as jest.Mock).mockResolvedValueOnce([
      { id: 'default', name: 'Daniel', color: '#E50914', createdAt: 0, updatedAt: 10 },
      { id: 'gone', name: 'Removido lá', color: '#E50914', createdAt: 3, updatedAt: 9, deleted: true },
    ]);

    const changed = await profileService.syncWithCloud();

    expect(changed).toBe(true);
    expect(storageService.getProfiles().map((p) => p.name)).toEqual(['Daniel', 'Só aqui']);
    expect(storageService.deleteProfileData).toHaveBeenCalledWith('gone');
    expect(supabaseService.upsertProfiles).toHaveBeenCalledWith('account_key', [
      expect.objectContaining({ id: 'local' }),
    ]);
  });
});
