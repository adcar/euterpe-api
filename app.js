const ytdl = require("ytdl-core");
const express = require("express");
const app = express();
const youtubeSearch = require("youtube-api-v3-search");
const pirate = require("thepiratebay");

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/s/:track/:artist/:duration/:filter", (req, res) => {
  // Filter can be anything you want appended to YT search query, but is designed to be either "clean" or "explicit"
  youtubeSearch("AIzaSyD_uZJQ7E74CoN5D48t8mldAKGUPx9XQ9Y", {
    q: `${req.params.track.replace(
      /[^\w\s]/gi,
      ""
    )} ${req.params.artist.replace(/[^\w\s]/gi, "")} audio ${req.params.filter}`
  })
    .then(results => {
      const setUrl = url => {
        res.send(url);
      };
      let videoUrl;
      for (item of results.items) {
        let videoId = item.id.videoId;
        ytdl.getInfo(
          `https://www.youtube.com/watch?v=${videoId}`,
          (err, info) => {
            let format = info.formats.find(item => {
              if (item.type) {
                return item.type.includes("audio");
              }
            });

            if (
              format &&
              parseInt(info.length_seconds) >=
                parseInt(req.params.duration) - 30 &&
              parseInt(info.length_seconds) <=
                parseInt(req.params.duration) + 30
            ) {
              //res.send(format.url)
              if (!videoUrl) {
                setUrl(format.url);
              }
              videoUrl = format.url;
            }
          }
        );
      }
    })
    .catch(err => console.log(`Youtube search failed: ${err}`));
});

// The code for these two is identical however this will likely change in future (therefore I kept them seperate)
app.get("/dl/track/:track/:artist", (req, res) => {
  // Spit out magnet link for track
  (async () => {
    try {
      results = await pirate.search(
        `${req.params.track} ${req.params.artist}`,
        {
          category: 101,
          orderBy: "seeds"
        }
      );
      res.send(results[0].magnetLink);
    } catch (err) {
      console.log(`Error: ${err}`);
      res.send("ERROR");
    }
  })();
});
app.get("/dl/album/:name/:artist", (req, res) => {
  // Spit out magnet link for album
  (async () => {
    try {
      results = await pirate.search(`${req.params.name} ${req.params.artist}`, {
        category: 101,
        orderBy: "seeds"
      });
      res.send(results[0].magnetLink);
    } catch (err) {
      console.log(`Error: ${err}`);
      res.send("ERROR");
    }
  })();
});

app.get("/", (req, res) => {
  res.send("Welcome to the Euterpe API <3");
});

let port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Euterpe API listening on port ${port} <3`));
