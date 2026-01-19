import React, { useState, useEffect } from 'react';
import { generateRoomId } from '../utils';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';
import { Play, ArrowRight, ScanLine } from 'lucide-react';

export default function LandingScreen({ onHost, onJoin, joinToken }) {
  const [name, setName] = useState("");
  const [detectedRoom, setDetectedRoom] = useState(null);

  useEffect(() => {
    if (joinToken) {
      try {
        const data = JSON.parse(atob(joinToken));
        if (data.r) setDetectedRoom(data.r);
      } catch (e) { console.error("Invalid QR"); }
    }
  }, [joinToken]);

  const handleCreateGame = async () => {
    const newCode = generateRoomId();
    await set(ref(db, `rooms/${newCode}`), {
      gameState: "LOBBY",
      createdAt: Date.now(),
      players: {},
      config: { mafia: 1, doctor: 1, detective: 1, peacefulFirstNight: false }
    });
    onHost(newCode);
  };

  // SCREEN 1: JOINING VIA QR
  if (detectedRoom) {
    return (
      <div className="center-container">
        <div className="game-card pop-in">
          <div className="text-center">
            <div className="inline-block bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Joining Room
            </div>
            <div className="text-5xl font-mono font-black text-white mb-8 tracking-widest">
                {detectedRoom}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="text-left w-full">
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block uppercase tracking-wider">Nickname</label>
                <input 
                  className="input-field"
                  placeholder="ENTER NAME"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  maxLength={12}
                />
            </div>
            
            <button 
              onClick={() => onJoin(detectedRoom, name)}
              disabled={!name}
              className="btn-primary flex items-center justify-center gap-2"
            >
              Enter Game <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: MAIN MENU
  return (
    <div className="center-container relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center mb-16 pop-in relative z-10">
        <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-2xl mb-2 text-glow">
          MAFIA
        </h1>
        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/10 px-6 py-1.5 rounded-full">
          <span className="text-xs font-bold tracking-[0.4em] text-blue-200 uppercase">Pocket Edition</span>
        </div>
      </div>

      <div className="game-card pop-in z-10">
        <button onClick={handleCreateGame} className="btn-primary btn-red py-6 text-xl flex items-center justify-center gap-3 shadow-red-900/50">
          <Play fill="currentColor" size={24} /> Host New Game
        </button>
        
        <div className="relative w-full text-center py-4">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
             <span className="relative bg-[#131b2e] px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
        </div>

        <div className="text-center">
            <div className="flex justify-center mb-4 text-slate-500">
                <ScanLine size={48} strokeWidth={1} />
            </div>
            <p className="text-slate-400 text-sm font-medium px-4">
              To join a game, simply scan the Host's QR code with your camera app.
            </p>
        </div>
      </div>
    </div>
  );
}