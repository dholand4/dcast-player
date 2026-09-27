import { mergeFavorites } from '../favoritesMerge';
import { IFavoriteItem } from '../../@types/storage';

const fav = (id: string, addedAt = 1): IFavoriteItem => ({
  id,
  name: `Item ${id}`,
  posterUrl: '',
  type: 'series',
  categoryId: '1',
  addedAt,
});

const ids = (items: IFavoriteItem[]) => items.map((item) => item.id).sort();

describe('mergeFavorites', () => {
  it('removes locally what another device removed from the cloud', () => {
    const result = mergeFavorites([fav('1'), fav('2')], [fav('1')], ['1', '2']);
    expect(ids(result.merged)).toEqual(['1']);
    expect(result.toUpload).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('uploads favorites added on this device', () => {
    const result = mergeFavorites([fav('1'), fav('3')], [fav('1')], ['1']);
    expect(ids(result.merged)).toEqual(['1', '3']);
    expect(ids(result.toUpload)).toEqual(['3']);
  });

  it('brings favorites added on another device', () => {
    const result = mergeFavorites([fav('1')], [fav('1'), fav('4')], ['1']);
    expect(ids(result.merged)).toEqual(['1', '4']);
    expect(result.toDelete).toEqual([]);
  });

  it('deletes from the cloud what was removed here while offline', () => {
    const result = mergeFavorites([fav('1')], [fav('1'), fav('2')], ['1', '2']);
    expect(ids(result.merged)).toEqual(['1']);
    expect(result.toDelete).toEqual(['2']);
  });

  it('trusts the cloud on the first sync of a device', () => {
    const result = mergeFavorites([fav('1'), fav('2')], [fav('1')], null);
    expect(ids(result.merged)).toEqual(['1']);
    expect(result.toUpload).toEqual([]);
  });

  it('uploads local favorites on the first sync when the cloud is empty', () => {
    const result = mergeFavorites([fav('1')], [], null);
    expect(ids(result.merged)).toEqual(['1']);
    expect(ids(result.toUpload)).toEqual(['1']);
  });
});
