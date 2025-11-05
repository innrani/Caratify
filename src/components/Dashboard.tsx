import { useState, useEffect, useRef } from 'react';
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Music, Album, Clock, Trophy, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import imgSeventeenLogo from '../assets/e84bdcd9518a5176b49e35565aeab2227bae9fb8.png';
import imgSpotifyIconRgbGreen1 from '../assets/3f5307bc3f8e6eaf876598d93b353dba861d6964.png';
import { 
  getTopTracks, 
  getTopAlbums, 
  analyzeSeventeenUnits, 
  getFirstSeventeenListen, 
  getTimeSince, 
  calculateCaratLevel 
} from '../lib/spotify';

// Interfaces para tipagem
interface UserData {
  topTracks: any[];
  topAlbums: Array<{ name: string; image?: string; count: number; tracks: string[]; totalMinutes: number }>;
  totalMinutes: number;
  caratLevel?: string;
  topUnit?: { name?: string; count: number; tracks: string[]; totalMinutes: number } | null;
  unitsList?: Array<{ name?: string; count: number; tracks: string[]; totalMinutes: number }>;
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
  const captureRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);

  const handleDownloadImage = async () => {
    try {
      // Render export-only layout, then capture it
      setShowExport(true);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));

      if (!exportRef.current) return;

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#000000',
        pixelRatio: 2,
        width: 1080,
        height: 1350, // 4:5 (Instagram portrait)
      });

      const link = document.createElement('a');
      link.download = 'caratify-top5.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setShowExport(false);
    }
  };

  // Buscar dados do Spotify
  useEffect(() => {
    const fetchSpotifyData = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const [topTracks, topAlbums, unitAnalysis, firstListenDate] = await Promise.all([
          getTopTracks(accessToken, 'long_term'),
          getTopAlbums(accessToken),
          analyzeSeventeenUnits(accessToken),
          getFirstSeventeenListen(accessToken)
        ]);

        const totalMinutes = Math.round(
          topTracks.reduce((sum: number, t: any) => sum + (t.duration_ms || 0), 0) / 60000
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
          <p>Loading your Spotify data...</p>
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
      <div className="bg-gradient-to-b from-[#1db954] to-black pt-8 pb-8 px-6">
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
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadImage}
              className="text-[#1db954] hover:text-[#1ed760] transition-colors flex items-center gap-2 font-['Montserrat:Medium',sans-serif]"
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

      {/* Capturable Content */}
      <div ref={captureRef}>
        {/* Remove secondary gradient: keep a single header gradient only */}
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
              style={{ fontSize: '0.5rem', lineHeight: '1rem' }}
              aria-label="Learn why this info is limited by Spotify"
            >
              ℹ️ Learn why this info is limited by Spotify
            </button>
          </div>
        )}
      </div>

      {/* Export-only layout (Top 5 of each) for saving as image */}
      {showExport && (
        <div
          ref={exportRef}
          style={{
            position: 'fixed',
            top: -99999,
            left: -99999,
            width: 1080,
            height: 1350,
            backgroundColor: '#000',
          }}
          className="text-white"
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-b from-[#1db954] to-black px-10 pt-10 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-3">
                  <img src={imgSeventeenLogo} alt="SEVENTEEN" className="w-full h-full object-contain filter invert" />
                </div>
                <h1 className="text-4xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold">Caratify</h1>
              </div>
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-3">
                <img src={imgSpotifyIconRgbGreen1} alt="Spotify" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="mt-2 text-white text-opacity-80">innrani.github.io/Caratify</p>
          </div>

          {/* Body: three sections */}
          <div className="px-10 py-6 grid grid-cols-1 gap-6">
            {/* Top 5 Songs */}
            <div>
              <h2 className="text-[#1db954] text-xl font-['Montserrat:ExtraBold',sans-serif] mb-3">Top 5 Songs</h2>
              <div className="space-y-3">
                {(userData.topTracks || []).slice(0,5).map((track: any, idx: number) => (
                  <div key={track.id || idx} className="flex items-center gap-3">
                    <span className="w-6 text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif]">{idx + 1}</span>
                    <div className="w-14 h-14 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                      {track?.album?.images?.length ? (
                        <img src={track.album.images[track.album.images.length - 1].url} alt={track.album?.name || 'cover'} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-['Montserrat:SemiBold',sans-serif] truncate">{track?.name}</p>
                      <p className="text-sm text-white text-opacity-60 truncate">{(track?.artists||[]).map((a:any)=>a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Albums */}
            <div>
              <h2 className="text-[#1db954] text-xl font-['Montserrat:ExtraBold',sans-serif] mb-3">Top 5 Albums</h2>
              <div className="space-y-3">
                {(userData.topAlbums || []).slice(0,5).map((al: any, idx: number) => (
                  <div key={al.name + idx} className="flex items-center gap-3">
                    <span className="w-6 text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif]">{idx + 1}</span>
                    <div className="w-14 h-14 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                      {al?.image ? (
                        <img src={al.image} alt={al.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-['Montserrat:SemiBold',sans-serif] truncate">{al?.name}</p>
                      <p className="text-sm text-white text-opacity-60 truncate">{al?.tracks?.length || 0} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Units */}
            <div>
              <h2 className="text-[#1db954] text-xl font-['Montserrat:ExtraBold',sans-serif] mb-3">Top 5 Units</h2>
              <div className="space-y-2">
                {((userData.unitsList || []).slice().sort((a:any,b:any)=> (b?.count||0) - (a?.count||0)).slice(0,5)).map((u:any, idx:number)=>(
                  <div key={(u?.name||'unit')+idx} className="flex items-center gap-3">
                    <span className="w-6 text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif]">{idx + 1}</span>
                    <p className="truncate">
                      <span className="font-['Montserrat:SemiBold',sans-serif]">{u?.name || 'Unknown'}</span>
                      <span className="ml-2 text-sm text-white text-opacity-60">{u?.count || 0} songs</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 -mt-4 space-y-4 mb-6">
        <Card className="bg-[#181818] border-none p-6">
          <div className="flex items-center gap-4 mb-2">
            <Trophy className="text-[#1db954] w-6 h-6" />
            <h3 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
              Carat Level
            </h3>
          </div>
          <p className="text-white text-3xl font-['Montserrat:ExtraBold',sans-serif] font-extrabold">
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
                        {track.artists.map((artist: any) => artist.name).join(', ')}
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
            <h4 className="text-white text-lg font-['Montserrat:SemiBold',sans-serif] mb-4">
              💎 Your Favourite SEVENTEEN Unit
            </h4>
            {userData.topUnit ? (
              <Card className="bg-gradient-to-r from-[#1db954] to-[#1ed760] border-none p-6 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <img 
                      alt="SEVENTEEN" 
                      className="w-6 h-6 object-contain filter invert" 
                      src={imgSeventeenLogo} 
                    />
                    <span className="text-black text-xl">+</span>
                    <img 
                      alt="Spotify" 
                      className="w-6 h-6 object-contain" 
                      src={imgSpotifyIconRgbGreen1} 
                    />
                  </div>
                  <h3 className="text-black font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-xl mb-2">
                    {userData.topUnit.name}
                  </h3>
                  <p className="text-black text-opacity-80 font-['Montserrat:SemiBold',sans-serif]">
                    {userData.topUnit.count} {userData.topUnit.count === 1 ? 'track' : 'tracks'} in your top 50
                  </p>
                  <p className="text-black text-opacity-60 font-['Montserrat:Medium',sans-serif] text-sm mt-2">
                    This is your favorite unit! 🎉
                  </p>
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

            <div className="mt-6">
              <p className="text-white text-opacity-70 font-['Montserrat:Medium',sans-serif] text-sm mb-4 text-center">
                According to your top 50 tracks, these are your favorite units
              </p>
              
              {userData.unitsList && userData.unitsList.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {userData.unitsList.map((unit, index) => (
                    <Card key={unit.name} className="bg-[#181818] border-none p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-white text-opacity-60 font-['Montserrat:ExtraBold',sans-serif] font-extrabold w-6">
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-white" />
                        </div>
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
                  ))}
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

              <div className="grid grid-cols-1 gap-2 mt-6">
                <div className="text-white text-opacity-40 text-sm bg-[#181818] rounded-lg p-4">
                  <p className="mb-2 text-white text-opacity-60">💡 <strong>SEVENTEEN Units:</strong></p>
                  <p className="text-white text-opacity-70">• <strong>BSS (BOOSEOKSOON)</strong> - Hoshi, DK, Seungkwan</p>
                  <p className="text-white text-opacity-70">• <strong>JxW (JeonghanxWonwoo)</strong> - Jeonghan, Wonwoo</p>
                  <p className="text-white text-opacity-70">• <strong>HxW (HoshixWoozi)</strong> - Hoshi, Woozi</p>
                  <p className="text-white text-opacity-70">• <strong>CxM (S.Coups x Mingyu)</strong> - S.Coups, Mingyu</p>
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
      {/* End Capturable Content */}
    </div>
  );
}
