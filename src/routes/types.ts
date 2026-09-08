import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ContentType } from '../@types/storage';

export type SeriesEpisodeItem = {
  id: string;
  title: string;
  streamUrl: string;
  posterUrl?: string;
  seasonNumber: number;
  episodeNumber: number;
};

export type LiveChannelItem = {
  id: string;
  name: string;
  streamUrl: string;
  logoUrl?: string;
  streamId: number | string;
  epgChannelId?: string;
};

export type RootStackParamList = {
  SetupScreen: undefined;
  HomeScreen: undefined;
  CategoryScreen: {
    type: ContentType;
    title: string;
  };
  DetailsScreen: {
    id: string;
    type: 'movie' | 'series';
    title: string;
    posterUrl?: string;
    containerExtension?: string;
  };
  PlayerScreen: {
    streamUrl: string;
    title: string;
    posterUrl?: string;
    type: ContentType;
    contentId: string;
    seriesId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    initialTime?: number;
    seriesEpisodes?: SeriesEpisodeItem[];
    liveChannels?: LiveChannelItem[];
  };
  SearchScreen: undefined;
};

export type SetupScreenProps = NativeStackScreenProps<RootStackParamList, 'SetupScreen'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;
export type CategoryScreenProps = NativeStackScreenProps<RootStackParamList, 'CategoryScreen'>;
export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'DetailsScreen'>;
export type PlayerScreenProps = NativeStackScreenProps<RootStackParamList, 'PlayerScreen'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'SearchScreen'>;
