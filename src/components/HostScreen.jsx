import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { shuffleArray } from '../utils';
import { Settings, Users, Shield, Sword, Search, Play, Zap } from 'lucide-react';

export default function HostScreen({ roomCode }) {
  const [game, setGame] = useState(null);
  const [config, setConfig] = useState({ mafia: 1, doctor: 1, detective: 1, peacefulFirstNight: false });

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snapshot) => { if (snapshot.exists()) setGame(snapshot.val()); });
  }, [roomCode]);

  useEffect(() => {
    if (game?.gameState === "LOBBY") {
      const pCount = game.players ? Object.keys(game.players).length : 0;
      setConfig(prev => ({
        ...prev,
        mafia: Math.max(1, Math.floor(pCount / 4)),
        doctor: pCount > 2 ? 1 : 0,
        detective: pCount > 4 ? 1 : 0,
        peacefulFirstNight: pCount <= 4
      }));
    }
  }, [game?.players]);

  if (!game) return <div className="center-container"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  const players = game.players ? Object.values(game.players) : [];
  const joinUrl = window.location.href.split('?')[0] + `?q=${btoa(JSON.stringify({r: roomCode}))}`;

  const startGame = () => {
    const roles = [];
    for(let i=0; i<config.mafia; i++) roles.push("MAFIA");
    for(let i=0; i<config.doctor; i++) roles.push("DOCTOR");
    for(let i=0; i<config.detective; i++) roles.push("DETECTIVE");
    while(roles.length < players.length) roles.push("VILLAGER");
    
    const shuffled = shuffleArray(roles).slice(0, players.length);
    const updates = {};
    players.forEach((p, i) => {
      updates[`rooms/${roomCode}/players/${p.id}/role`] = shuffled[i] || "VILLAGER";
      updates[`rooms/${roomCode}/players/${p.id}/isAlive`] = true;
      updates[`rooms/${roomCode}/players/${p.id}/voteTarget`] = null;
    });
    updates[`rooms/${roomCode}/config`] = config;
    updates[`rooms/${roomCode}/gameState`] = "NIGHT";
    updates[`rooms/${roomCode}/turnCount`] = 1;
    updates[`rooms/${roomCode}/publicMessage`] = "NIGHT HAS FALLEN";
    updates[`rooms/${roomCode}/nightActions`] = null;
    update(ref(db), updates);
  };

  // --- RENDER ---
  return (
    <div className="center-container justify-start pt-12 pb-12">
      
      {/* HEADER: Room Code */}
      <div className="flex flex-col items-center mb-12 pop-in">
        <div className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Room Code</div>
        <div className="text-6xl md:text-8xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {roomCode}
        </div>
      </div>

      {game.gameState === "LOBBY" ? (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 pop-in" style={{animationDelay: '0.1s'}}>
            
            {/* LEFT CARD: JOIN */}
            <div className="game-card h-full justify-between !max-w-none">
                <div className="flex flex-col items-center w-full py-8">
                    <div className="bg-white p-4 rounded-3xl mb-8 shadow-2xl">
                        <QRCodeSVG value={joinUrl} size={250} />
                    </div>
                    <h2 className="text-3xl font-black mb-2 uppercase tracking-wide">Scan to Join</h2>
                    <p className="text-slate-400 font-medium">Open your camera app</p>
                </div>
                
                <div className="w-full bg-slate-900/80 rounded-2xl p-6 border border-slate-700/50 min-h-[140px]">
                    <div className="flex items-center justify-between text-blue-400 font-black text-xs uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-2"><Users size={16} /> Lobby</span>
                        <span>{players.length} Players</span>
                    </div>
                    {players.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-slate-600 text-sm italic">
                            Waiting for players to connect...
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {players.map(p => (
                                <span key={p.id} className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm animate-pulse">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT CARD: SETTINGS */}
            <div className="game-card h-full justify-between !max-w-none">
                <div className="w-full">
                    <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-300 uppercase tracking-widest border-b border-white/10 pb-4">
                        <Settings size={20}/> Game Config
                    </h2>
                    
                    <div className="space-y-4 w-full mb-8">
                        <CounterRow 
                            label="Mafia" 
                            icon={<Sword size={20} className="text-red-500"/>} 
                            value={config.mafia} 
                            onChange={(v) => setConfig({...config, mafia: v})} 
                        />
                        <CounterRow 
                            label="Doctor" 
                            icon={<Shield size={20} className="text-green-500"/>} 
                            value={config.doctor} 
                            onChange={(v) => setConfig({...config, doctor: v})} 
                        />
                        <CounterRow 
                            label="Detective" 
                            icon={<Search size={20} className="text-blue-500"/>} 
                            value={config.detective} 
                            onChange={(v) => setConfig({...config, detective: v})} 
                        />
                        
                        <div 
                            onClick={() => setConfig({...config, peacefulFirstNight: !config.peacefulFirstNight})}
                            className={`flex justify-between items-center p-4 rounded-xl cursor-pointer border-2 transition-all active:scale-[0.98] ${config.peacefulFirstNight ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${config.peacefulFirstNight ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    <Zap size={20} fill={config.peacefulFirstNight ? "currentColor" : "none"} />
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold text-sm uppercase tracking-wide ${config.peacefulFirstNight ? 'text-emerald-400' : 'text-slate-400'}`}>Peaceful Night 1</div>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.peacefulFirstNight ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.peacefulFirstNight ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={startGame} 
                    disabled={players.length < 2}
                    className="btn-primary btn-green w-full py-5 text-xl flex items-center justify-center gap-3"
                >
                    <Play fill="currentColor" size={24} /> Start Game
                </button>
            </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-700">
             <div className="text-center mb-12">
                 <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-[0.5em] mb-4">Current Phase</h2>
                 <h1 className="text-6xl md:text-7xl font-black text-white text-glow mb-4">{game.publicMessage}</h1>
             </div>
             
             {/* Simple visualizer for game in progress */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {players.map(p => (
                    <div key={p.id} className={`p-4 rounded-xl border-2 text-center transition-all ${
                        !p.isAlive ? 'border-red-900 bg-red-900/10 opacity-50 grayscale' : 'border-slate-700 bg-slate-800/50'
                    }`}>
                        <div className="text-2xl mb-2">{!p.isAlive ? 'Rx' : 'O'}</div>
                        <div className="font-bold">{p.name}</div>
                    </div>
                ))}
             </div>
        </div>
      )}
    </div>
  );
}

function CounterRow({ label, icon, value, onChange }) {
    return (
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3 pl-2">
                {icon}
                <span className="font-bold text-sm uppercase tracking-wider text-slate-200">{label}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-bold">-</button>
                <span className="w-8 text-center font-mono font-bold">{value}</span>
                <button onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-bold">+</button>
            </div>
        </div>
    );
}