import { useContext, useEffect, useState } from "react";
import Navbar from "./Navbar";
import { MusicContext } from "../Context";
import "./Home.css";

function Home() {
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("Search your favorite song");
  const [tracks, setTracks] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [token, setToken] = useState(
    "BQBEjOFdpRyg69EHXxLw9eMUquzurNg9i1N8_asT5b6F3c8Xkdf4sLjMKvG6vw_QyvHl-VOc8tRQvQG8F2Dts0kDgwDUmOI5z5BPybAFqmGzlBNDExh_LaVbpR2SQECEgc56rcp9ludGM7IFIqdotAftmTA5qzUHaX6RTtjNBfqvNRHnyQ-0poqy9YfBL1-QFNUjtyCb9rhsPO5my0VuEXBuMOd-UkiLhvd7UGkg"
  ); // Replace with your initial token
  const [hasSearched, setHasSearched] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isLoading, setIsLoading, resultOffset, setResultOffset } =
    useContext(MusicContext);

  const refreshToken = async () => {
    try {
      const response = await fetch("YOUR_REFRESH_ENDPOINT", {
        method: "POST",
        body: JSON.stringify({
          grant_type:
            "BQBEjOFdpRyg69EHXxLw9eMUquzurNg9i1N8_asT5b6F3c8Xkdf4sLjMKvG6vw_QyvHl-VOc8tRQvQG8F2Dts0kDgwDUmOI5z5BPybAFqmGzlBNDExh_LaVbpR2SQECEgc56rcp9ludGM7IFIqdotAftmTA5qzUHaX6RTtjNBfqvNRHnyQ-0poqy9YfBL1-QFNUjtyCb9rhsPO5my0VuEXBuMOd-UkiLhvd7UGkg",
          refresh_token: "YOUR_REFRESH_TOKEN",
          client_id: "200bcacaaa5a4e3f81f9ce5057705b91",
          client_secret: "ff85bde297c64fae98c3f663bc2e6d2b",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.access_token); // Update the token
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  };

  const fetchMusicData = async (query = "", offset = 0) => {
    if (!token) {
      console.error("No token available");
      return;
    }

    setTracks([]);
    setMessage("");
    window.scrollTo(0, 0);
    setIsLoading(true);

    try {
      const searchQuery = query || keyword;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await refreshToken(); // Refresh the token if it has expired
          await fetchMusicData(query, offset); // Retry the request
        } else {
          throw new Error(`Failed to fetch music data: ${response.statusText}`);
        }
      } else {
        const jsonData = await response.json();
        setTracks(jsonData.tracks.items.slice(0, 50));
        setHasSearched(true);
      }
    } catch (error) {
      setMessage("We couldn’t retrieve the music data. Please try again.");
      console.error("Error fetching music data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      setResultOffset(0);
      fetchMusicData(keyword, 0);
    }
  };

  const handleSearchClick = () => {
    setResultOffset(0);
    fetchMusicData(keyword, 0);
  };

  useEffect(() => {
    if (token) {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const newPlayer = new window.Spotify.Player({
          name: "Web Playback SDK",
          getOAuthToken: (cb) => {
            cb(token);
          },
          volume: 0.5,
        });

        newPlayer.addListener("ready", ({ device_id }) => {
          setDeviceId(device_id);
          console.log("Ready with Device ID", device_id);
        });

        newPlayer.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        newPlayer.addListener("player_state_changed", (state) => {
          if (!state) {
            return;
          }
          const {
            paused,
            track_window: { current_track },
          } = state;
          setIsPlaying(!paused);
          setCurrentTrack(current_track);
        });

        newPlayer.connect();
        setPlayer(newPlayer);
      };

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [token]);

  const playSong = async (uri) => {
    if (player && deviceId) {
      if (isPlaying && currentTrack.uri === uri) {
        await fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setIsPlaying(false);
      } else {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            body: JSON.stringify({ uris: [uri] }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setIsPlaying(true);
      }
    }
  };

  const likeSong = (trackId) => {
    console.log(`Liked song with ID: ${trackId}`);
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      setLikedTracks([...likedTracks, track]);
    }
  };

  const addToPlaylist = (trackId) => {
    console.log(`Added song with ID: ${trackId} to playlist`);
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      setPlaylistTracks([...playlistTracks, track]);
    }
  };

  const showLikedSongs = () => {
    setTracks(likedTracks);
    setHasSearched(true);
  };

  const showPlaylistedSongs = () => {
    setTracks(playlistTracks);
    setHasSearched(true);
  };

  return (
    <>
      <Navbar
        keyword={keyword}
        setKeyword={setKeyword}
        handleKeyPress={handleKeyPress}
        fetchMusicData={handleSearchClick}
        showLikedSongs={showLikedSongs}
        showPlaylistedSongs={showPlaylistedSongs}
      />

      <div className="container">
        <div className={`row ${isLoading ? "" : "d-none"}`}>
          <div className="col-12 py-5 text-center">
            <div
              className="spinner-border"
              style={{ width: "3rem", height: "3rem" }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>

      {!hasSearched && (
        <div className="row text-center default-message">
          <div className="col-12">
            <h5>{message}</h5>
          </div>
        </div>
      )}

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {hasSearched && tracks.length === 0 && (
          <div className="col-12 text-center">
            <h5>{message}</h5>
          </div>
        )}
        {tracks.map((track) => (
          <div className="col" key={track.id}>
            <div className="card h-100">
              <img
                src={track.album.images[0]?.url}
                alt={track.name}
                className="card-img-top"
              />
              <div className="card-body">
                <h5 className="card-title">{track.name}</h5>
                <p className="card-text">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => playSong(track.uri)}
                >
                  {isPlaying && currentTrack?.uri === track.uri
                    ? "Pause"
                    : "Play"}
                </button>
                <button
                  className="btn btn-success me-2"
                  onClick={() => likeSong(track.id)}
                >
                  Like
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => addToPlaylist(track.id)}
                >
                  Add to Playlist
                </button>
              </div>
            </div>
          </div>
        ))}

        {currentTrack && (
          <div className="player">
            {" "}
            <div className="track-info">
              {" "}
              <img
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                className={isPlaying ? "playing" : ""}
              />{" "}
              <div>
                {" "}
                <h5>Now Playing:</h5>{" "}
                <p>
                  {" "}
                  {currentTrack.name} by{" "}
                  {currentTrack.artists.map((artist) => artist.name).join(", ")}{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            {isPlaying && (
              <div className="vibrations">
                {" "}
                <div></div> <div></div> <div></div> <div></div> <div></div>{" "}
                <div></div> <div></div> <div></div> <div></div> <div></div>{" "}
              </div>
            )}{" "}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
