// Youtube Data Fetcher (ydf) is a simple Youtube Data API V3 Wrapper that simplifies fetching playlists & videos.
// Copyright (C)   2017   Abdelbasset Oueryemchi

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

(window => {
  'use strict';

  /**
   * Creates a promisified HTTP Request
   *
   * @param  {Object} settings Request settings (method, url & parameters)
   * @return {function}
   */
  const sendRequest = settings => {

    /** @return {Promise.<Object>} */
    return otherSettings => {

      // Create the request
      const xhr = new XMLHttpRequest();

      // Combine the settings objects
      const settingsObj = Object.assign({}, settings, otherSettings);

      // Build the parameters string
      let params = settingsObj.params;
      if (params && typeof params === 'object') {
        params = Object.keys(params).map(key =>
          encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
        ).join('&');
      }

      return new Promise((resolve, reject) => {

        // Open & send the request
        xhr.open(settings.method, settings.url + '?' + params);
        xhr.send();

        // Once the request is successfully loaded, resolve the promise, else reject it
        xhr.onload = () => {
          if (xhr.readyState === xhr.DONE) {
            if (this.status >= 200 || this.status < 300) {
              resolve(JSON.parse(xhr.response));
            } else {
              reject({
                status: this.status,
                statusText: xhr.statusText
              });
            }
          }
        };

        // Handle request error by rejecting the promise
        xhr.onerror = () => reject({
          status: this.status,
          statusText: xhr.statusText
        });
      });
    };
  };


  /**
   * Sends a request for channels
   */
  const channelsRequest = sendRequest({
    method: 'GET',
    url: 'https://www.googleapis.com/youtube/v3/channels'
  });


  /**
   * Sends a request for playlists
   */
  const playlistsRequest = sendRequest({
    method: 'GET',
    url: 'https://www.googleapis.com/youtube/v3/playlists'
  });


  /**
   * Sends a request for playlistItems
   */
  const playlistItemsRequest = sendRequest({
    method: 'GET',
    url: 'https://www.googleapis.com/youtube/v3/playlistItems'
  });


  /**
   * Builds an array of data objects using values from a response object
   *
   * @param  {Object} response      The resolved response object
   * @param  {string} privacyStatus Privacy status of data to fetch
   * @param  {string} dataType      Type of data that's going to be accumulated (playlists or videos)
   * @return {Array}
   */
  const accumulateDataFromResponse = (response, privacyStatus, dataType) => {
    return response.items.reduce((accumulator, value) => {
      let dataObj;

      switch (dataType) {
        case 'videos':
          dataObj = new YoutubeDataObject('video', {
            id: value.snippet.resourceId.videoId,
            title: value.snippet.title,
            description: value.snippet.description,
            playlistId: value.snippet.playlistId,
            positionInPlaylist: value.snippet.position,
            creationDate: value.snippet.publishedAt.substring(0, 10),
            thumbnails: value.snippet.thumbnails,
            privacyStatus: value.status.privacyStatus
          });
          break;

        case 'playlists':
          dataObj = new YoutubeDataObject('playlist', {
            id: value.id,
            title: value.snippet.title,
            description: value.snippet.localized.description,
            creationDate: value.snippet.publishedAt.substring(0, 10),
            videoCount: value.contentDetails.itemCount,
            thumbnails: value.snippet.thumbnails,
            privacyStatus: value.status.privacyStatus
          });
          break;

        default:
          break;
      }

      if (privacyStatus && typeof privacyStatus === 'string') {
        if (dataObj.attributes.privacyStatus === privacyStatus) {
          accumulator.push(dataObj);
        }
      } else {
        accumulator.push(dataObj);
      }

      return accumulator;
    }, []);
  };


  /**
   * Fetches the channel's playlists
   *
   * @param  {number} maxResults    Maximum number of playlists to fetch
   * @param  {string} privacyStatus Privacy status of playlists to fetch
   * @return {Promise.<YoutubeResultsPage>}
   */
  const fetchPlaylists = (maxResults, privacyStatus, pageToken) => {
    const params = {
      part: 'contentDetails, snippet, status',
      channelId: credentials.id,
      key: credentials.key
    };

    if (typeof maxResults !== 'undefined') {
      Object.assign(params, {
        maxResults
      });
    }

    if (typeof pageToken !== 'undefined') {
      Object.assign(params, {
        pageToken
      });
    }

    return playlistsRequest({
        params: params
      })
      .then(response => {
        return new YoutubeResultsPage(response.kind,
          response.pageInfo.resultsPerPage,
          response.pageInfo.totalResults,
          response.prevPageToken,
          response.nextPageToken,
          accumulateDataFromResponse(response, privacyStatus, 'playlists'),
          privacyStatus);
      });
  };

  /**
   * Fetches videos of a specific playlist
   *
   * @param  {string} playlistId    Id of playlist whose videos are going to be fetched
   * @param  {number} maxResults    Maximum number of videos to fetch
   * @param  {string} privacyStatus Privacy status of videos to fetch
   * @return {Promise.<YoutubeResultsPage>}
   */
  const fetchVideos = (playlistId, maxResults, privacyStatus, pageToken) => {
    return channelsRequest({
        params: {
          part: 'contentDetails',
          id: credentials.id,
          key: credentials.key
        }
      })
      .then(response => {

        const params = {
          part: 'snippet, status',
          playlistId: playlistId,
          key: credentials.key
        };

        if (typeof maxResults !== 'undefined') {
          Object.assign(params, {
            maxResults
          });
        }

        if (typeof pageToken !== 'undefined') {
          Object.assign(params, {
            pageToken
          });
        }

        return playlistItemsRequest({
            params: params
          })
          .then(response => {
            return new YoutubeResultsPage(response.kind,
              response.pageInfo.resultsPerPage,
              response.pageInfo.totalResults,
              response.prevPageToken,
              response.nextPageToken,
              accumulateDataFromResponse(response, privacyStatus, 'videos'),
              privacyStatus);
          });
      });
  };


  /**
   * Assigns attributes to an object then freezes it
   *
   * @param  {Object} obj        The object to be assigned & frozen
   * @param  {Object} attributes The attributes to set
   * @return {Object}
   */
  const constructImmutable = (obj, attributes) => {
    Object.assign(obj, attributes);
    Object.freeze(obj);
    return obj;
  };


  /**
   * Represents the results page that we get from the response object
   *
   * @class YoutubeResultsPage
   */
  const YoutubeResultsPage = class {

    /**
     * @constructor
     * @param {string} kind           Youtube request kind
     * @param {number} resultsPerPage The number of results per page sent in the request
     * @param {number} totalResults   The number of total results retrieved by the request
     * @param {string} prevPageToken  The previous results page token
     * @param {string} nextPageToken  The next results page token
     * @param {Array}  data           The actual results data (playlists or videos)
     * @param {string} privacyStatus  The privacy status of the retrieved results (public or private)
     */
    constructor(kind, resultsPerPage, totalResults, prevPageToken, nextPageToken, data, privacyStatus) {
      constructImmutable(this, {
        kind,
        resultsPerPage,
        totalResults,
        prevPageToken,
        nextPageToken,
        data,
        privacyStatus
      });
    }

    /**
     * Fetches the next results page
     */
    fetchNextPage() {
      if (this.nextPageToken) {
        const kind = this.kind.substring(8);

        switch (kind) {
          case 'playlistListResponse':
            return fetchPlaylists(this.resultsPerPage, this.privacyStatus, this.nextPageToken);

          case 'playlistItemListResponse':
            return fetchVideos(this.data[0].attributes.playlistId, this.resultsPerPage, this.privacyStatus, this.nextPageToken);

          default:
            break;
        }
      } else {
        throw new Error('Cannot fetch the next results page, no such page!');
      }
    }

    /**
     * Fetches the previous results page
     */
    fetchPreviousPage() {
      if (this.prevPageToken) {
        const kind = this.kind.substring(8);

        switch (kind) {
          case 'playlistListResponse':
            return fetchPlaylists(this.resultsPerPage, this.privacyStatus, this.prevPageToken);

          case 'playlistItemListResponse':
            return fetchVideos(this.data[0].attributes.playlistId, this.resultsPerPage, this.privacyStatus, this.prevPageToken);

          default:
            break;
        }
      } else {
        throw new Error('Cannot fetch the previous results page, no such page!');
      }
    }
  };


  /**
   * Represents Youtube Data
   *
   * @class YoutubeDataObject
   */
  const YoutubeDataObject = class {

    /**
     * @constructor
     * @param {string} type       The data type (playlist or video)
     * @param {Object} attributes The object's attributes
     */
    constructor(type, attributes) {
      constructImmutable(this, {
        type,
        attributes
      });
    }
  };


  /**
   * Credentials object, used for sharing api credentials across classes
   * Will be assigned & frozen in the ydf constructor
   * Contains the Youtube Data V3 API key & the channel's id
   *
   * @type {Object}
   */
  const credentials = {};


  /**
   * Youtube Data Fetcher Class
   *
   * @class ydf
   */
  const ydf = class {

    /**
     * @constructor
     * @param {string} key Youtube Data v3 API key
     * @param {string} id  The channel's id
     */
    constructor(key, id) {
      constructImmutable(credentials, {
        key,
        id
      });
    }

    /**
     * Fetches general channel information
     *
     * @return {Promise.<Object>}
     */
    channelInfo() {
      return channelsRequest({
          params: {
            part: 'snippet, statistics',
            id: credentials.id,
            key: credentials.key
          }
        })
        .then(response => {
          return {
            localization: response.items[0].snippet.country,
            customUrl: response.items[0].snippet.customUrl,
            title: response.items[0].snippet.title,
            description: response.items[0].snippet.description,
            creationDate: response.items[0].snippet.publishedAt.substring(0, 10),
            subscriberCount: response.items[0].statistics.subscriberCount,
            videoCount: response.items[0].statistics.videoCount,
            viewCount: response.items[0].statistics.viewCount
          };
        });
    }

    /**
     * Fetches all playlists
     *
     * @argument fetchPlaylists
     * @inheritdoc
     */
    playlists(maxResults, privacyStatus) {
      return fetchPlaylists(maxResults, privacyStatus);
    }

    /**
     * Fetches a single playlist by it's name
     *
     * @param  {string} playlistTitle Title of playlist to fetch
     * @return {Promise.<YoutubeDataObject>}
     */
    playlist(playlistTitle) {

      return this.playlists(50).then(playlists => {

        // Retrieve the specified playlist
        const playlist = playlists.data.find(playlist => playlist.attributes.title === playlistTitle);

        // If the playlist exists, fetch it's videos
        if (playlist) {
          return playlist;
        } else {
          throw new Error(`Cannot fetch videos from "${playlistTitle}", no such playlist!`);
        }
      });
    }

    /**
     * Fetches all channel videos
     *
     * @argument fetchVideos
     * @inheritdoc
     */
    uploads(maxResults, privacyStatus) {
      return channelsRequest({
          params: {
            part: 'contentDetails',
            id: credentials.id,
            key: credentials.key
          }
        })
        .then(response =>
          fetchVideos(response.items[0].contentDetails.relatedPlaylists.uploads, maxResults, privacyStatus)
        );
    }

    /**
     * Fetches videos from a specific playlist
     *
     * @param  {string} playlistTitle Playlist title
     * @param  {number} maxResults    Maximum number of videos to fetch
     * @param  {string} privacyStatus Privacy status of videos to fetch
     * @return {Promise.<YoutubeResultsPage>}
     */
    playlistUploads(playlistTitle, maxResults, privacyStatus) {

      return this.playlists(50).then(playlists => {

        // Retrieve the specified playlist
        const playlist = playlists.data.find(playlist => playlist.attributes.title === playlistTitle);

        // If the playlist exists, fetch it's videos
        if (playlist) {
          return fetchVideos(playlist.attributes.id, maxResults, privacyStatus);
        } else {
          throw new Error(`Cannot fetch videos from "${playlistTitle}", no such playlist!`);
        }
      });
    }
  };

  if (typeof window !== 'undefined' && !window.ydf) {
    window.ydf = ydf;
  }

})(window);
