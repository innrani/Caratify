import { useState, useEffect } from 'react';
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Music, Album, Clock, Trophy, Download } from 'lucide-react';
import imgSeventeenLogo from '../assets/e84bdcd9518a5176b49e35565aeab2227bae9fb8.png';
import imgSpotifyIconRgbGreen1 from '../assets/3f5307bc3f8e6eaf876598d93b353dba861d6964.png';
import { 
  getTopTracks,
  computeTopAlbumsFromTracks,
  analyzeSeventeenUnitsFromTracks,
  estimateFirstSeventeenListenFromTracks,
  getTimeSince,
  calculateCaratLevel,
  getAuthUrl,
} from '../lib/spotify';
import { exportStatsImage } from '../lib/exportCanvas';

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
}

interface TopAlbum {
  name: string;
  image?: string;
  count: number;
  tracks: string[];
  totalMinutes: number;
}

interface UnitStats {
  name: string;
  count: number;
  tracks: string[];
  totalMinutes: number;
}

interface UserData {
  topTracks: SpotifyTrack[];
  topAlbums: TopAlbum[];
  totalMinutes: number;
  caratLevel?: string;
  topUnit?: UnitStats | null;
  unitsList?: UnitStats[];
  firstListenDate?: Date;
  timeSinceFirstListen?: string;
}

interface DashboardProps {
  accessToken: string;
  onLogout: () => void;
  onShowAbout: () => void;
}

export function Dashboard({ accessToken, onLogout, onShowAbout }: DashboardProps) {
  const [userData, setUserData] = useState<UserData>({
    topTracks: [],
    topAlbums: [],
    totalMinutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const handleDownloadImage = async () => {
    try {
      await exportStatsImage(
        {
          caratLevel: userData.caratLevel,
          totalMinutes: userData.totalMinutes,
          topTracks: userData.topTracks,
          topAlbums: userData.topAlbums,
          unitsList: userData.unitsList,
        },
        { seventeen: imgSeventeenLogo, spotify: imgSpotifyIconRgbGreen1 },
        { filename: 'caratify-top5.png' }
      );
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  // Buscar dados do Spotify
  useEffect(() => {
    const fetchSpotifyData = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch user's SEVENTEEN top tracks ONCE, then derive other stats locally
        const topTracks = await getTopTracks(accessToken, 'long_term');
        const topAlbums = computeTopAlbumsFromTracks(topTracks);
        const unitAnalysis = analyzeSeventeenUnitsFromTracks(topTracks);
        const firstListenDate = estimateFirstSeventeenListenFromTracks(topTracks);

        const totalMinutes = Math.round(
          topTracks.reduce((sum: number, track: SpotifyTrack) => sum + track.duration_ms, 0) / 60000
        );
        const caratLevel = calculateCaratLevel(totalMinutes);
        const timeSince = firstListenDate ? getTimeSince(firstListenDate) : undefined;

        setUserData({
          topTracks,
          topAlbums,
          totalMinutes,
          caratLevel,
          topUnit: unitAnalysis.topUnit,
          unitsList: unitAnalysis.unitsList,
          firstListenDate,
          timeSinceFirstListen: timeSince
        });
      } catch (err) {
        console.error('❌ Error fetching Spotify data:', err);
        // Auto-recover on 401 token expiry
        const isAuthExpired = err instanceof Error && (
          err.message === 'AUTH_EXPIRED' ||
          ('status' in err && err.status === 401)
        );
        if (isAuthExpired) {
          try {
            setSessionMessage('Session expired. Reconnecting to Spotify…');
            // Clear token and timestamp
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_token_timestamp');
            // Redirect to Spotify auth quickly
            const authUrl = await getAuthUrl();
            window.location.href = authUrl;
            return;
          } catch (authError) {
            console.error('❌ Could not restart Spotify authentication:', authError);
            setError(authError instanceof Error
              ? authError.message
              : 'Could not restart Spotify authentication.');
            return;
          }
        }
        setError('Error loading Spotify data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpotifyData();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1db954] mx-auto mb-4"></div>
          <p>{sessionMessage || 'Loading your Spotify data...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#1db954] text-black px-4 py-2 rounded-full hover:bg-[#1ed760]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div
        className="bg-gradient-to-b from-[#16a34a] from-[60%] to-black pt-8 pb-8 px-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2">
              <img 
                alt="SEVENTEEN" 
                className="w-full h-full object-contain filter invert" 
                src={imgSeventeenLogo} 
              />
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2">
              <img 
                alt="Spotify" 
                className="w-full h-full object-contain" 
                src={imgSpotifyIconRgbGreen1} 
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownloadImage}
              className="bg-black text-white border border-white/20 hover:bg-black/80 transition-colors flex items-center gap-3 px-4 py-2 rounded-full font-['Montserrat:Medium',sans-serif]"
              title="Download stats as image"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button 
              onClick={onLogout}
              className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] hover:text-opacity-100"
            >
              Logout
            </button>
          </div>
        </div>

        <h1 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-3xl mb-2">
          Your Seventeen Stats
        </h1>
        <p className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] mb-6">
          Here's how much you love SEVENTEEN
        </p>
      </div>

      <div className="px-6">
        
        {/* First Listen Info */}
        {userData.timeSinceFirstListen && (
          <div className="mt-4 bg-black bg-opacity-40 rounded-lg p-4">
            <p className="text-white text-opacity-90 font-['Montserrat:SemiBold',sans-serif] text-center text-base">
              💎 The first time you listened to SEVENTEEN was{' '}
              <button 
                onClick={onShowAbout}
                className="text-[#1db954] font-['Montserrat:ExtraBold',sans-serif] font-extrabold underline hover:text-[#1ed760] transition-colors"
              >
                about
              </button>
              {' '}
              <span className="text-[#1db954] font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
                {userData.timeSinceFirstListen}
              </span>
              {' '}ago
            </p>
            <button
              onClick={onShowAbout}
              className="mt-2 w-full text-center text-white text-opacity-60 hover:text-opacity-80 transition-colors underline"
              style={{ fontSize: '0.8rem', lineHeight: '1rem' }}
              aria-label="Learn why this info is limited by Spotify"
            >
              ℹ️ Learn why this info is limited by Spotify
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-4 space-y-4 mb-6">
        <Card className="bg-[#181818] border-none p-6">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="text-[#1db954] w-6 h-6" />
            <h3 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
              Carat Level
            </h3>
          </div>
          <p className="text-white text-3xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold mt-0">
            {userData.caratLevel}
          </p>
          <p className="text-white text-opacity-60 font-['Montserrat:Medium',sans-serif] mt-1">
            Based on your listening time
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#181818] border-none p-4">
            <Clock className="text-[#1db954] w-5 h-5 mb-2" />
            <p className="text-white text-2xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
              {userData.totalMinutes.toLocaleString()}
            </p>
            <p className="text-white text-opacity-60 font-['Montserrat:Medium',sans-serif]">
              estimated minutes
            </p>
          </Card>

          <Card className="bg-[#181818] border-none p-4">
            <Album className="text-[#1db954] w-5 h-5 mb-2" />
            <p className="text-white text-2xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
              {userData.topTracks.length}
            </p>
            <p className="text-white text-opacity-60 font-['Montserrat:Medium',sans-serif]">
              top tracks
            </p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="w-full bg-[#181818] border-none mb-6">
            <TabsTrigger 
              value="tracks" 
              className="flex-1 data-[state=active]:bg-[#1db954] data-[state=active]:text-black text-white"
            >
              Top Songs
            </TabsTrigger>
            <TabsTrigger 
              value="albums" 
              className="flex-1 data-[state=active]:bg-[#1db954] data-[state=active]:text-black text-white"
            >
              Albums
            </TabsTrigger>
            <TabsTrigger 
              value="units" 
              className="flex-1 data-[state=active]:bg-[#1db954] data-[state=active]:text-black text-white"
            >
              Units
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="space-y-3">
            <h4 className="text-white text-lg font-['Montserrat:SemiBold',sans-serif] mb-4">
              🎵 Your SEVENTEEN Top Songs (All Time)
            </h4>
            {userData.topTracks.length > 0 ? (
              userData.topTracks.map((track, index) => (
                <Card key={track.id} className="bg-[#181818] border-none p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif] font-extrabold w-6">
                      {index + 1}
                    </span>
                    <div className="w-14 h-14 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                      {track.album.images.length > 0 ? (
                        <img 
                          src={track.album.images[track.album.images.length - 1].url} 
                          alt={track.album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-full h-full p-3 text-white text-opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold truncate">
                        {track.name}
                      </p>
                      <p className="text-white text-opacity-60 font-['Montserrat:Medium',sans-serif] text-sm truncate">
                        {track.artists.map((artist) => artist.name).join(', ')}
                      </p>
                      <p className="text-[#1db954] text-opacity-80 font-['Montserrat:Medium',sans-serif] text-xs mt-1">
                        {track.album.name}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white text-opacity-60 mb-3">No SEVENTEEN song found :(</p>
                <p className="text-white text-opacity-80 text-sm">
                  Why don't you try listening to{' '}
                  <a 
                    href="https://open.spotify.com/intl-pt/track/3AOf6YEpxQ894FmrwI9k96?si=c29db78fbf9c4287"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] underline hover:text-[#1ed760] transition-colors"
                  >
                    "Super"
                  </a>
                  ? I bet you'll love it!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums" className="space-y-3">
            <h4 className="text-white text-lg font-['Montserrat:SemiBold',sans-serif] mb-4">
              📀 Top SEVENTEEN Albums (All Time)
            </h4>
            {userData.topAlbums.length > 0 ? (
              userData.topAlbums.map((album, index) => (
                <Card key={album.name} className="bg-[#181818] border-none p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif] font-extrabold w-6">
                      {index + 1}
                    </span>
                    <div className="w-16 h-16 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                      {album.image ? (
                        <img 
                          src={album.image} 
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Album className="w-full h-full p-3 text-white text-opacity-40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold">
                        {album.name}
                      </p>
                      <p className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] text-sm mb-1">
                        {album.count} {album.count === 1 ? 'track' : 'tracks'} in your top 50
                      </p>
                      <p className="text-white text-opacity-60 font-['Montserrat:Medium',sans-serif] text-xs">
                        {album.tracks.slice(0, 2).join(', ')}{album.tracks.length > 2 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white text-opacity-60 mb-3">No SEVENTEEN album found :(</p>
                <p className="text-white text-opacity-80 text-sm">
                  Why don't you try listening to{' '}
                  <a 
                    href="https://open.spotify.com/intl-pt/track/6oeMntjclWLoguzwj5ECTo?si=2dbcdd4012ac46ec"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] underline hover:text-[#1ed760] transition-colors"
                  >
                    "Thunder"
                  </a>
                  ? I bet you'll love it!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="units" className="space-y-3">
            <h4 className="text-white text-2xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold mb-6 mt-2">
              💎 Your Favourite SEVENTEEN Unit
            </h4>
            {userData.topUnit ? (
              <Card className="bg-gradient-to-r from-[#1db954] to-[#1ed760] border-none p-6 mb-4 text-white">
                <div className="flex items-center gap-4">
                  {userData.topUnit.tracks && userData.topUnit.tracks.length > 0 && (() => {
                    const topTrack = userData.topTracks.find((track) =>
                      userData.topUnit?.tracks.includes(track.name)
                    );
                    return topTrack?.album?.images?.length ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={topTrack.album.images[0].url} 
                          alt={topTrack.album.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null;
                  })()}
                  <div className="flex-1">
                    <h3 className="font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-2xl mb-1" style={{ color: '#ffffff' }}>
                      {userData.topUnit.name}
                    </h3>
                    <p className="font-['Montserrat:Bold',sans-serif]" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {userData.topUnit.count} {userData.topUnit.count === 1 ? 'track' : 'tracks'} in your top 50
                    </p>
                    <p className="font-['Montserrat:Medium',sans-serif] text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      This is your favorite unit! 🎉
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-[#181818] border-none p-6 text-center">
                <p className="text-white text-opacity-60 mb-3">No specific unit detected 🤨​ </p>
                <p className="text-white text-opacity-80 text-sm mb-2">
                  Listen to more BSS, JxW or other units to see statistics!
                </p>
                <p className="text-white text-opacity-80 text-sm">
                  Why don't you give{' '}
                  <a 
                    href="https://open.spotify.com/intl-pt/track/4eTDkRxOmm4llv4Yr1bteq?si=094d0709597a4d1a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] underline hover:text-[#1ed760] transition-colors"
                  >
                    "Pretty Woman"
                  </a>
                  {' '}more streams?
                </p>
              </Card>
            )}

            <div className="mt-15">
              <p className="text-white text-opacity-70 font-['Montserrat:Medium',sans-serif] text-sm mb-4 text-center">
                According to your top 50 tracks, these are your favourite units
              </p>
              
              {userData.unitsList && userData.unitsList.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {userData.unitsList.map((unit, index) => {
                    const topTrack = userData.topTracks.find((track) =>
                      unit.tracks.includes(track.name)
                    );
                    const albumImage = topTrack?.album?.images?.[0]?.url;
                    
                    return (
                      <Card key={unit.name} className="bg-[#181818] border-none p-4">
                        <div className="flex items-center gap-4">
                          <span className="text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif] font-extrabold w-6">
                            {index + 1}
                          </span>
                          {albumImage ? (
                            <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src={albumImage} 
                                alt={topTrack.album.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold">
                              {unit.name}
                            </p>
                            <p className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] text-sm">
                              {unit.count} {unit.count === 1 ? 'track' : 'tracks'} in your top 50
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-[#181818] border-none p-4 mb-4">
                  <p className="text-white text-opacity-60 text-center">
                    No units detected yet
                  </p>
                  <p className="text-white text-opacity-40 text-sm text-center mt-2">
                    Listen to BSS, JxW or other units to see your statistics!
                  </p>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-2 mt-8">
                <div className="text-white text-opacity-40 text-sm bg-[#181818] rounded-lg p-4">
                  <p className="mb-4 text-white text-opacity-60">💡 <strong>SEVENTEEN Units:</strong></p>
                  <p className="text-white text-opacity-70">• <strong>BSS (BOOSEOKSOON)</strong> - Hoshi, DK, Seungkwan</p>
                  <p className="text-white text-opacity-70">• <strong>JxW </strong> - Jeonghan, Wonwoo</p>
                  <p className="text-white text-opacity-70">• <strong>HxW </strong> - Hoshi, Woozi</p>
                  <p className="text-white text-opacity-70">• <strong>CxM </strong> - S.Coups, Mingyu</p>
                  <p className="text-white text-opacity-70">• <strong>V8 </strong> - Vernon, THE8</p>
                  <p className="text-white text-opacity-70">• <strong>JxJ </strong> - Jeonghan, Joshua</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="text-center py-8 mt-8">
        <p className="text-white text-opacity-50 font-['Montserrat:Medium',sans-serif]">
          made by @damagebyhoshi on twt
        </p>
      </div>
    </div>
  );
}
