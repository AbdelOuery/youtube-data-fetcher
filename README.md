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

More to come...
