// Configuração da API do Spotify
export const spotifyConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://127.0.0.1:3000"
    : "https://innrani.github.io/Caratify/"),
  scopes: [
    "user-top-read",
    "user-read-recently-played",
    "user-library-read",
  ].join(" ")
};
const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const getAuthUrl = async () => {
  if (!spotifyConfig.clientId || spotifyConfig.clientId === "seu_client_id_aqui") {
    throw new Error("Configure VITE_SPOTIFY_CLIENT_ID no arquivo .env antes de entrar.");
  }

  const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(64)));
  const challengeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = toBase64Url(new Uint8Array(challengeBytes));
  const state = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

  localStorage.setItem("spotify_code_verifier", verifier);
  localStorage.setItem("spotify_auth_state", state);

  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: "code",
    redirect_uri: spotifyConfig.redirectUri,
    scope: spotifyConfig.scopes,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    show_dialog: "true"
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code, returnedState) => {
  const verifier = localStorage.getItem("spotify_code_verifier");
  const expectedState = localStorage.getItem("spotify_auth_state");
  localStorage.removeItem("spotify_code_verifier");
  localStorage.removeItem("spotify_auth_state");

  if (!verifier || !expectedState || returnedState !== expectedState) {
    throw new Error("A validação do login falhou. Tente entrar novamente.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: spotifyConfig.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyConfig.redirectUri,
      code_verifier: verifier
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Não foi possível concluir o login com o Spotify.");
  }

  return response.json();
};
// Small helper to make Spotify requests more resilient (retry once on 401/429/transient errors)
const spotifyFetch = async (url, accessToken, opts = {}) => {
  const { retries = 1, retryDelayMs = 600 } = opts;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) return res;
      // Retry on rate limit or auth hiccup once
      if ((res.status === 401 || res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      }
      if (res.status === 401) {
        const e = new Error('AUTH_EXPIRED');
        // @ts-ignore
        e.status = 401;
        throw e;
      }
      const e = new Error(`Spotify API error: ${res.status}`);
      // @ts-ignore
      e.status = res.status;
      throw e;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
  }
  throw lastErr || new Error('Spotify API request failed');
};

export const getTopTracks = async (accessToken, timeRange = "long_term") => {
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`,
    accessToken,
    { retries: 1 }
  );
  const data = await response.json();
  
  // Lista de todos os nomes relacionados ao SEVENTEEN (grupo, units e membros individuais)
  const seventeenArtists = [
    "SEVENTEEN", "SEVENTEEN (세븐틴)",
    "BSS (SEVENTEEN)", "BOOSEOKSOON", "BSS",
    "JxW", "JeonghanxWonwoo", "JEONGHAN X WONWOO",
    "Hip-Hop Team", "Hip Hop Team", "HipHop Team",
    "Vocal Team", "Performance Team", "SVT Leaders",
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
  const response = await spotifyFetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    accessToken,
    { retries: 1 }
  );
  if (!response.ok) return [];
  const data = await response.json();
  
  const seventeenArtists = [
    "SEVENTEEN", "SEVENTEEN (세븐틴)",
    "BSS (SEVENTEEN)", "BOOSEOKSOON", "BSS",
    "JxW", "JeonghanxWonwoo", "JEONGHAN X WONWOO",
    "Hip-Hop Team", "Hip Hop Team", "HipHop Team",
    "Vocal Team", "Performance Team", "SVT Leaders",
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
export const computeTopAlbumsFromTracks = (topTracks = []) => {
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
export const analyzeSeventeenUnitsFromTracks = (topTracks = []) => {
  const unitAliases = {
    "BSS": ["BSS", "BOOSEOKSOON", "BSS (SEVENTEEN)", "부석순"],
    "JxW": ["JxW", "JEONGHAN X WONWOO", "JEONGHANXWONWOO", "정한X원우"],
    "HxW": ["HxW", "HOSHI X WOOZI", "HOSHIxWOOZI", "호시X우지"],
    "CxM": ["CxM", "S.COUPS X MINGYU", "S.COUPSXMINGYU", "SCOUPS X MINGYU"],
    "Hip-Hop Team": ["HIP-HOP TEAM", "HIP HOP TEAM", "HIPHOP TEAM", "힙합팀"],
    "Vocal Team": ["VOCAL TEAM", "VOCAL UNIT", "보컬팀"],
    "Performance Team": ["PERFORMANCE TEAM", "PERFORMANCE UNIT", "퍼포먼스팀"],
    "Leaders": ["SVT LEADERS", "SEVENTEEN LEADERS", "LEADER LINE", "리더즈"]
  };
  const unitCounts = Object.fromEntries(
    Object.keys(unitAliases).map((name) => [name, { count: 0, tracks: [], totalMinutes: 0 }])
  );

  topTracks.forEach(track => {
    const durationMinutes = track.duration_ms / 60000;
    const artistNames = (track.artists || []).map((artist) => artist.name.toUpperCase());

    Object.entries(unitAliases).forEach(([unitName, aliases]) => {
      const isUnitTrack = artistNames.some((artistName) =>
        aliases.some((alias) => artistName.includes(alias.toUpperCase()))
      );
      if (!isUnitTrack) return;

      unitCounts[unitName].count += 1;
      unitCounts[unitName].tracks.push(track.name);
      unitCounts[unitName].totalMinutes += durationMinutes;
    });
  });
  Object.keys(unitCounts).forEach(unit => { unitCounts[unit].totalMinutes = Math.round(unitCounts[unit].totalMinutes); });
  const unitsArray = Object.entries(unitCounts).map(([name, data]) => ({ name, ...data })).filter(unit => unit.count > 0).sort((a, b) => b.totalMinutes - a.totalMinutes);
  return { topUnit: unitsArray[0] || null, allUnits: unitCounts, unitsList: unitsArray };
};
export const estimateFirstSeventeenListenFromTracks = (topTracks = []) => {
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
