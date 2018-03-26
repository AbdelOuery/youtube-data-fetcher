## **Youtube Data Fetcher**

### Introduction
Youtube Data Fetcher *(ydf)* is a minimal Javascript library that aims to simplify the process of fetching data *(mainly playlists & videos)* from Youtube using the [Youtube Data API V3](https://developers.google.com/youtube/v3/docs/).
> **Note:**
> Due to ydf being written in pure ECMAScript 6, it uses arrow functions and promises which means it may not fonction as expected on older browsers.

### Usage
Let's run through some examples of how we can use ydf to fetch a channel's playlists and videos in json format.
Since ydf does not support NodeJS for the moment, we need to grab the **ydf.js** file from the repo's source code folder and add it to our HTML document *(for now)*
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Youtube Data Fetcher</title>
</head>
<body>
  <script src="/path/to/ydf.min.js"></script>
  <script>

    // Instantiate ydf
    const youtube = new ydf('API_Key', 'Youtube_Channel_ID');

    // Fetch all playlists
    youtube.playlists().then(data => {
      // Do something with data
    });
  </script>
</body>
</html>
```

In the previous example, data represents a **YoutubeResultsPage** object which contains the following attributes:

| Attribute        | Type           | Description  |
| ------------- |:-------------:| :-----|
| data      | array | Contains `YoutubeDataObject` objects. |
| kind      | string      |   String that represents the kind of the retrieved data, `'youtube#playlistListResponse'` or `'youtube#playlistListResponse'`. |
| nextPageToken | string      |    Token that represents the next results page. |
| prevPageToken | string      |    Token that represents the previous results page. |
| privacyStatus | string      |    The privacy status of retrieved data, `'public'` or `'private'` |
| resultsPerPage | number      |    Number of results per page. (length of the data array per page). |
| totalResults | number      |    Total number of results. |







