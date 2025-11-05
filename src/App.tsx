import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { About } from './components/About';
import { getAuthUrl } from './lib/spotify';
import imgSpotifyIconRgbGreen1 from './assets/3f5307bc3f8e6eaf876598d93b353dba861d6964.png';
import imgSeventeenLogo from './assets/e84bdcd9518a5176b49e35565aeab2227bae9fb8.png';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAboutPage, setShowAboutPage] = useState(false);

  // Verificar se há um token no hash da URL (Implicit Grant Flow)
  useEffect(() => {
    console.log('🔍 Checking authentication...');
    
    // Check hash for token (Implicit Grant)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const error = params.get('error');

      if (error) {
        console.error('❌ Authentication error:', error);
        alert('Spotify authentication error. Please try again.');
        setLoading(false);
        return;
      }

      if (token) {
        console.log('✅ Token recebido via Implicit Grant!');
        setAccessToken(token);
        setIsLoggedIn(true);
        
        // Salvar token e timestamp
        localStorage.setItem('spotify_access_token', token);
        localStorage.setItem('spotify_token_timestamp', Date.now().toString());
        
        // Limpar hash da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(false);
        return;
      }
    }

    // Verificar se há um token salvo no localStorage
    const savedToken = localStorage.getItem('spotify_access_token');
    const tokenTimestamp = localStorage.getItem('spotify_token_timestamp');
    
    if (savedToken && tokenTimestamp) {
      // Verificar se o token expirou (tokens do Spotify duram 1 hora = 3600000ms)
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const oneHour = 3600000;
      
      if (tokenAge < oneHour) {
        console.log('✅ Token válido encontrado no localStorage');
        setAccessToken(savedToken);
        setIsLoggedIn(true);
      } else {
        console.log('⚠️ Token expirado, removendo...');
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_timestamp');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    // Redirect to Spotify OAuth
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    setIsLoggedIn(false);
    setAccessToken(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_timestamp');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1db954] mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (showAboutPage) {
    return <About onBack={() => setShowAboutPage(false)} />;
  }

  if (isLoggedIn && accessToken) {
    return <Dashboard accessToken={accessToken} onLogout={handleLogout} onShowAbout={() => setShowAboutPage(true)} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Background Video with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <iframe
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400%] h-[400%] pointer-events-none"
          src="https://www.youtube.com/embed/zSQ48zyWZrY?autoplay=1&mute=1&loop=1&playlist=zSQ48zyWZrY&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1"
          title="God of Music Background Video"
          allow="autoplay; encrypted-media"
        />
        {/* Very Dark Overlay */}
        <div className="absolute inset-0 bg-black opacity-70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between px-6 py-8">
        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold tracking-wide text-4xl">
              Welcome to Caratify
            </h1>
          </div>

          {/* Logos Container */}
          <div className="flex items-center gap-6">
            {/* Seventeen Logo */}
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                alt="Seventeen" 
                className="w-full h-full object-contain filter invert" 
                src={imgSeventeenLogo} 
              />
            </div>
            
            {/* Plus Symbol */}
            <div className="text-white text-3xl font-bold">+</div>
            
            {/* Spotify Logo */}
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                alt="Spotify" 
                className="w-full h-full object-contain" 
                src={imgSpotifyIconRgbGreen1} 
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="text-center">
            <p className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif]">
              know your stats on seventeen songs
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={handleLogin}
              className="bg-[#1db954] hover:bg-[#1ed760] rounded-full px-8 py-3 transition-colors"
            >
              <p className="font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-black text-center">
                LOGIN WITH SPOTIFY
              </p>
            </button>
            
            <button 
              onClick={() => setShowAboutPage(true)}
              className="border-2 border-white hover:bg-white hover:bg-opacity-10 rounded-full px-8 py-3 transition-colors"
            >
              <p className="font-['Montserrat:SemiBold',sans-serif] font-semibold text-white text-center">
                About
              </p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white text-opacity-70 font-['Montserrat:Medium',sans-serif]">
            made by @damagebyhoshi on twt
          </p>
        </div>
      </div>
    </div>
  );
}
