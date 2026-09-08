export interface IAccountCredentials {
  serverUrl: string;
  username: string;
  password: string;
  label: string;
}

export interface IXtreamUserInfo {
  username: string;
  password: string;
  message?: string;
  auth: number;
  status: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

export interface IXtreamServerInfo {
  url?: string;
  port?: string;
  https_port?: string;
  server_protocol?: string;
  rtmp_port?: string;
  timezone?: string;
  timestamp_now?: number;
  time_now?: string;
}

export interface IXtreamAuthResponse {
  user_info: IXtreamUserInfo;
  server_info: IXtreamServerInfo;
}

export interface IXtreamCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface IXtreamLiveStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  added?: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
  tv_archive_duration?: number;
}

export interface IXtreamVodStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  rating?: string;
  rating_5based?: number;
  added?: string;
  category_id: string;
  container_extension?: string;
  custom_sid?: string;
  direct_source?: string;
  year?: string;
}

export interface IXtreamSeries {
  num?: number;
  name: string;
  series_id: number | string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
}

export interface IXtreamEpisode {
  id: string | number;
  episode_num: number | string;
  title: string;
  container_extension?: string;
  info?: {
    movie_image?: string;
    plot?: string;
    releasedate?: string;
    duration_secs?: number;
    duration?: string;
    bitrate?: number;
    rating?: number;
  };
  custom_sid?: string;
  added?: string;
  season?: number | string;
  direct_source?: string;
}

export interface IXtreamSeason {
  air_date?: string;
  episode_count?: number;
  id?: number;
  name?: string;
  overview?: string;
  poster_path?: string;
  season_number: number;
}

export interface IXtreamSeriesInfo {
  seasons?: IXtreamSeason[];
  info?: {
    name?: string;
    cover?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    last_modified?: string;
    rating?: string;
    rating_5based?: number;
    backdrop_path?: string[];
    youtube_trailer?: string;
    episode_run_time?: string;
    category_id?: string;
  };
  episodes?: {
    [seasonNumber: string]: IXtreamEpisode[];
  };
}

export interface IEpgListing {
  id: string;
  epg_id?: string;
  title: string;
  lang?: string;
  start: string;
  end: string;
  description?: string;
  start_timestamp: number;
  stop_timestamp: number;
  now_playing?: number;
  has_archive?: number;
}
