// Configuração da API do Spotify
export const spotifyConfig = {
  clientId: "adefef0cb2e14e139ee5bcb1ec9e47c4",
  clientSecret: "c1ab3e3638c84bbbb051fefa2783f302", 
  redirectUri: window.location.hostname === 'localhost' 
    ? "http://localhost:3000"
    : "https://innrani.github.io/Caratify/",
  scopes: [
    "user-top-read",
    "user-read-recently-played",
    "user-library-read",
  ].join(" ")
};
export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: "token",
    redirect_uri: spotifyConfig.redirectUri,
    scope: spotifyConfig.scopes,
    show_dialog: "true"
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};
export const getTopTracks = async (accessToken, timeRange = "long_term") => {
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
  const data = await response.json();
  
  // Lista de todos os nomes relacionados ao SEVENTEEN (grupo, units e membros individuais)
  const seventeenArtists = [
    "SEVENTEEN", "SEVENTEEN (세븐틴)",
    "BSS (SEVENTEEN)", "BOOSEOKSOON", "BSS",
    "JxW", "JeonghanxWonwoo", "JEONGHAN X WONWOO",
    // solos
    "WOOZI", "우지", "HOSHI", "호시", "MINGYU", "민규",
    "VERNON", "버논", "SEUNGKWAN", "승관", "DINO", "디노",
    "S.COUPS", "에스.쿱스", "JEONGHAN", "정한", "JOSHUA", "조슈아",
    "JUN", "준", "THE 8", "디에잇", "DK", "도겸", "WONWOO", "원우"
  ];
  
  const seventeenTracks = data.items.filter((track) => 
    track.artists.some((artist) => 
      seventeenArtists.some(name => 
        artist.name.toUpperCase().includes(name.toUpperCase()) ||
        name.toUpperCase().includes(artist.name.toUpperCase())
      )
    )
  );
  
  // Return in the order Spotify already provided (most listened first)
  return seventeenTracks;
};
export const getTopArtists = async (accessToken) => {
  const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (!response.ok) return { seventeen: null, allArtists: [] };
  const data = await response.json();
  const seventeen = data.items.find((artist) => artist.name === "SEVENTEEN");
  return { seventeen, allArtists: data.items };
};
export const getRecentlyPlayed = async (accessToken) => {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (!response.ok) return [];
  const data = await response.json();
  
  const seventeenArtists = [
    "SEVENTEEN", "SEVENTEEN (세븐틴)",
    "BSS (SEVENTEEN)", "BOOSEOKSOON", "BSS",
    "JxW", "JeonghanxWonwoo", "JEONGHAN X WONWOO",
    "WOOZI", "우지", "HOSHI", "호시", "MINGYU", "민규",
    "VERNON", "버논", "SEUNGKWAN", "승관", "DINO", "디노",
    "S.COUPS", "에스.쿱스", "JEONGHAN", "정한", "JOSHUA", "조슈아",
    "JUN", "준", "THE 8", "디에잇", "DK", "도겸", "WONWOO", "원우"
  ];
  
  const seventeenTracks = data.items.filter((item) => 
    item.track.artists.some((artist) => 
      seventeenArtists.some(name => 
        artist.name.toUpperCase().includes(name.toUpperCase()) ||
        name.toUpperCase().includes(artist.name.toUpperCase())
      )
    )
  );
  return seventeenTracks;
};
export const getTopAlbums = async (accessToken) => {
  const topTracks = await getTopTracks(accessToken, "long_term");
  const albumCounts = {};
  topTracks.forEach(track => {
    const albumName = track.album.name;
    const durationMs = track.duration_ms;
    if (!albumCounts[albumName]) {
      albumCounts[albumName] = { name: albumName, image: track.album.images[0]?.url, count: 0, tracks: [], totalDurationMs: 0, totalMinutes: 0 };
    }
    albumCounts[albumName].count += 1;
    albumCounts[albumName].tracks.push(track.name);
    albumCounts[albumName].totalDurationMs += durationMs;
  });
  const topAlbums = Object.values(albumCounts)
    .map(album => ({ ...album, totalMinutes: Math.round(album.totalDurationMs / 60000) }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 10);
  return topAlbums;
};
export const analyzeSeventeenUnits = async (accessToken) => {
  const topTracks = await getTopTracks(accessToken, "long_term");
  const unitCounts = { 
    "BSS": { count: 0, tracks: [], totalMinutes: 0 }, 
    "JxW": { count: 0, tracks: [], totalMinutes: 0 },
    "HxW": { count: 0, tracks: [], totalMinutes: 0 },
    "CxM": { count: 0, tracks: [], totalMinutes: 0 }
  };
  topTracks.forEach(track => {
    const durationMinutes = track.duration_ms / 60000;
    track.artists.forEach(artist => {
      const artistName = artist.name.toUpperCase();
      if (artistName.includes("BSS") || artistName.includes("BOOSEOKSOON")) {
        unitCounts["BSS"].count += 1;
        unitCounts["BSS"].tracks.push(track.name);
        unitCounts["BSS"].totalMinutes += durationMinutes;
      } else if (artistName.includes("JXW") || (artistName.includes("JEONGHAN") && artistName.includes("WONWOO"))) {
        unitCounts["JxW"].count += 1;
        unitCounts["JxW"].tracks.push(track.name);
        unitCounts["JxW"].totalMinutes += durationMinutes;
      } else if ((artistName.includes("HOSHI") && artistName.includes("WOOZI")) || artistName.includes("HXW")) {
        unitCounts["HxW"].count += 1;
        unitCounts["HxW"].tracks.push(track.name);
        unitCounts["HxW"].totalMinutes += durationMinutes;
      } else if ((artistName.includes("S.COUPS") && artistName.includes("MINGYU")) || (artistName.includes("SCOUPS") && artistName.includes("MINGYU")) || artistName.includes("CXM")) {
        unitCounts["CxM"].count += 1;
        unitCounts["CxM"].tracks.push(track.name);
        unitCounts["CxM"].totalMinutes += durationMinutes;
      }
    });
  });
  Object.keys(unitCounts).forEach(unit => { unitCounts[unit].totalMinutes = Math.round(unitCounts[unit].totalMinutes); });
  const unitsArray = Object.entries(unitCounts).map(([name, data]) => ({ name, ...data })).filter(unit => unit.count > 0).sort((a, b) => b.totalMinutes - a.totalMinutes);
  return { topUnit: unitsArray[0] || null, allUnits: unitCounts, unitsList: unitsArray };
};
export const getFirstSeventeenListen = async (accessToken) => {
  const topTracks = await getTopTracks(accessToken, "long_term");
  if (topTracks.length > 40) return new Date(new Date().setFullYear(new Date().getFullYear() - 4));
  if (topTracks.length > 30) return new Date(new Date().setFullYear(new Date().getFullYear() - 3));
  if (topTracks.length > 20) return new Date(new Date().setFullYear(new Date().getFullYear() - 2));
  return new Date(new Date().setFullYear(new Date().getFullYear() - 1));
};
export const getTimeSince = (date) => {
  const now = new Date();
  const diff = now - date;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  if (years > 0) {
    if (months > 0) return `${years} ${years === 1 ? "year" : "years"} and ${months} ${months === 1 ? "month" : "months"}`;
    return `${years} ${years === 1 ? "year" : "years"}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return "less than a month";
};
export const calculateCaratLevel = (minutes) => {
  if (minutes < 50) return "Baby Carat";
  if (minutes < 500) return "Going seventeen Carat";
  if (minutes < 1000) return "Carat carat type carat";
  if (minutes < 3000) return "Diamond VIP Carat";
  return "Are-You-A-Robot Carat";
};
