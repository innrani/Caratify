import { ArrowLeft } from 'lucide-react';
import { Card } from "./ui/card";
import imgSeventeenLogo from '../assets/e84bdcd9518a5176b49e35565aeab2227bae9fb8.png';
import imgSpotifyIconRgbGreen1 from '../assets/3f5307bc3f8e6eaf876598d93b353dba861d6964.png';

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1db954] to-black pt-8 pb-16 px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white text-opacity-80 hover:text-opacity-100 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-['Montserrat:Medium',sans-serif]">Back</span>
        </button>

        <div className="flex items-center gap-4" style={{ marginBottom: '2rem' }}>
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

        <h1 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-3xl mb-2">
          About Caratify
        </h1>
        <p className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif]">
          Your SEVENTEEN listening statistics from Spotify
        </p>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-4 pb-8">
        {/* What is Caratify */}
        <Card className="bg-[#181818] border-none p-6">
          <h2 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-xl mb-4">
            What is Caratify?
          </h2>
          <p className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] leading-relaxed mb-3">
            Caratify is a web application that analyzes your Spotify listening history to show you detailed statistics about your SEVENTEEN music consumption. It displays your top tracks, albums, favorite units, and calculates your "Carat Level" based on how much you listen to SEVENTEEN.
          </p>
        </Card>

        {/* How Spotify API Works */}
        <Card className="bg-[#181818] border-none p-6">
          <h2 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-xl mb-4">
            📊 How the Spotify API Works
          </h2>
          
          <div className="space-y-4 text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] leading-relaxed">
            <div>
              <h3 className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold mb-2">
                Time Ranges
              </h3>
              <p className="mb-2">
                Spotify's API provides listening data in three time periods:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Short term:</strong> Last 4 weeks</li>
                <li><strong>Medium term:</strong> Last 6 months</li>
                <li><strong>Long term:</strong> Several years of data</li>
              </ul>
              <p className="mt-2">
                Caratify uses <strong>long term</strong> data to show your all-time SEVENTEEN statistics.
              </p>
            </div>

            <div>
              <h3 className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold mb-2">
                ⚠️ Data Accuracy & Limitations
              </h3>
              <p className="mb-2">
                It's important to understand that the statistics shown are <strong>estimates</strong>, not exact measurements:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Relative Rankings:</strong> Spotify returns your top 50 tracks/artists ranked by listening frequency, but doesn't provide exact play counts. The order shows which songs you listen to most, from #1 (most played) to #50 (least played in your top)
                </li>
                <li>
                  <strong>No Play Count Numbers:</strong> We cannot show "X times played" because Spotify's API doesn't provide this information. The ranking order itself is the only measure of listening frequency
                </li>
                <li>
                  <strong>Listening Time Estimates:</strong> Total minutes are calculated based on track durations and their position in your top tracks, which gives an approximation of your listening habits
                </li>
                <li>
                  <strong>First Listen Date:</strong> Spotify doesn't provide the actual date when you first listened to an artist. We estimate this based on the number of tracks in your top 50
                </li>
                <li>
                  <strong>Not Real-Time:</strong> Spotify's API data is updated periodically (typically daily), so very recent listening sessions might not be reflected immediately
                </li>
                <li>
                  <strong>Privacy-First:</strong> Spotify only shares aggregated data, not individual play history timestamps or complete listening logs
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-['Montserrat:SemiBold',sans-serif] font-semibold mb-2">
                🔍 What We Calculate
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Top Tracks:</strong> Your most listened-to SEVENTEEN songs based on Spotify's ranking algorithm
                </li>
                <li>
                  <strong>Top Albums:</strong> Aggregated from your top tracks to show which albums you listen to most
                </li>
                <li>
                  <strong>Units Analysis:</strong> Detection of sub-unit tracks (BSS, JxW, etc.) in your top songs
                </li>
                <li>
                  <strong>Carat Level:</strong> A fun ranking based on estimated listening time (Baby Carat → Ultimate Carat)
                </li>
              </ul>
            </div>

            <div className="bg-[#1db954] bg-opacity-10 border border-[#1db954] border-opacity-30 rounded-lg p-4">
              <p className="text-[#1db954] font-['Montserrat:SemiBold',sans-serif] mb-2">
                💡 Pro Tip
              </p>
              <p>
                Think of these statistics as a <strong>snapshot of your listening preferences</strong> rather than precise measurements. They're designed to give you fun insights into your SEVENTEEN fandom, not scientific data!
              </p>
            </div>
          </div>
        </Card>

        {/* Privacy & Security */}
        <Card className="bg-[#181818] border-none p-6">
          <h2 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-xl mb-4">
            🔒 Privacy & Security
          </h2>
          <div className="space-y-3 text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] leading-relaxed">
            <p>
              <strong>We don't store any of your data.</strong> All processing happens in your browser, and your Spotify access token is only stored locally on your device.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>No personal data is sent to external servers</li>
              <li>Your listening history stays private</li>
              <li>Access tokens expire after 1 hour for security</li>
              <li>You can revoke access anytime via your Spotify account settings</li>
            </ul>
          </div>
        </Card>

        {/* Open Source */}
        <Card className="bg-[#181818] border-none p-6">
          <h2 className="text-white font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-xl mb-4">
            💻 Technology
          </h2>
          <p className="text-white text-opacity-80 font-['Montserrat:Medium',sans-serif] leading-relaxed">
            Caratify is built with React, TypeScript, and the Spotify Web API. It uses OAuth 2.0 Implicit Grant Flow for secure authentication.
          </p>
        </Card>

        {/* Credits */}
        <Card className="bg-gradient-to-r from-[#1db954] to-[#1ed760] border-none p-6">
          <div className="text-center">
            <p className="text-black font-['Montserrat:ExtraBold',sans-serif] font-extrabold text-lg mb-2">
              Made with 💎 for CARATs
            </p>
            <p className="text-black text-opacity-80 font-['Montserrat:Medium',sans-serif]">
              made by @damagebyhoshi on twt (x), you can also find me on ig by @haruathedisco
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
