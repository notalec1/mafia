import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { shuffleArray } from '../utils';
import { Settings, Users, Shield, Sword, Search } from 'lucide-react';

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

  if (!game) return <div className="center-container">Loading...</div>;

  const players = game.players ? Object.values(game.players) : [];
  const joinUrl = window.location.href.split('?')[0] + `?q=${btoa(JSON.stringify({r: roomCode}))}`;

  // ... (Keep existing Logic Functions: checkForWin, startGame, etc)
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
  
  // (Assume nextPhase, resolveNight, etc. are preserved from previous steps)
  const nextPhase = () => { /* ... Logic ... */ }; 
  const resolveNight = () => { /* ... Logic ... */ }; 
  const startVoting = () => { /* ... Logic ... */ }; 
  const resolveVoting = () => { /* ... Logic ... */ }; 

  // --- RENDER ---
  return (
    <div className="center-container">
      
      {/* HEADER: Room Code (Floating above) */}
      <div className="flex flex-col items-center mb-12">
        <div className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Room Code</div>
        <div className="text-5xl font-mono font-black text-white bg-slate-900 px-8 py-4 rounded-3xl border-2 border-slate-800 shadow-2xl tracking-widest">
            {roomCode}
        </div>
      </div>

      {game.gameState === "LOBBY" ? (
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-center justify-center">
            
            {/* LEFT CARD: JOIN */}
            <div className="game-card flex-1 h-full justify-between">
                <div className="flex flex-col items-center w-full">
                    <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl">
                        <QRCodeSVG value={joinUrl} size={220} />
                    </div>
                    <h2 className="text-3xl font-black mb-2">Scan to Join</h2>
                    <p className="text-slate-400 text-base font-bold mb-8">Open Camera App</p>
                </div>
                
                <div className="w-full bg-slate-900/50 rounded-3xl p-6 border border-slate-800 min-h-[120px]">
                    <div className="flex items-center justify-center gap-3 text-blue-400 font-black text-sm uppercase tracking-widest mb-4">
                        <Users size={18} /> {players.length} Players Ready
                    </div>
                    {players.length === 0 ? (
                        <div className="text-slate-600 text-sm py-4 italic text-center">Waiting for connections...</div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-3">
                            {players.map(p => (
                                <span key={p.id} className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl border-2 border-slate-700 shadow-sm">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT CARD: SETTINGS */}
            <div className="game-card flex-1 h-full justify-between">
                <div className="w-full">
                    <h2 className="text-2xl font-black mb-8 flex items-center justify-center gap-3 text-slate-300">
                        <Settings size={28}/> GAME SETTINGS
                    </h2>
                    
                    {/* Role Counters */}
                    <div className="space-y-6 w-full mb-10">
                        <CounterRow 
                            label="Mafia" 
                            icon={<Sword size={20} className="text-red-400"/>} 
                            value={config.mafia} 
                            onChange={(v) => setConfig({...config, mafia: v})} 
                        />
                        <CounterRow 
                            label="Doctor" 
                            icon={<Shield size={20} className="text-green-400"/>} 
                            value={config.doctor} 
                            onChange={(v) => setConfig({...config, doctor: v})} 
                        />
                        <CounterRow 
                            label="Detective" 
                            icon={<Search size={20} className="text-blue-400"/>} 
                            value={config.detective} 
                            onChange={(v) => setConfig({...config, detective: v})} 
                        />
                        
                        {/* Toggle */}
                        <div 
                            onClick={() => setConfig({...config, peacefulFirstNight: !config.peacefulFirstNight})}
                            className={`flex justify-between items-center p-5 rounded-2xl cursor-pointer border-2 transition-all active:scale-95 ${config.peacefulFirstNight ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-900 border-slate-800'}`}
                        >
                            <div className="text-left">
                                <div className={`font-bold text-base mb-1 ${config.peacefulFirstNight ? 'text-green-400' : 'text-slate-300'}`}>Peaceful Night 1</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Mafia cannot kill turn 1</div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${config.peacefulFirstNight ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                                {config.peacefulFirstNight && <div className="w-3 h-3 bg-white rounded-full" />}
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={startGame} 
                    disabled={players.length < 2}
                    className="btn-primary btn-green mt-auto"
                >
                    START GAME
                </button>
            </div>
        </div>
      ) : (
        // GAME IN PROGRESS VIEW
        <div className="w-full max-w-5xl flex flex-col items-center">
             {/* Use the existing Game Phase UI here, but it will inherit the new .center-container spacing automatically */}
             {/* Temporary Placeholder for brevity */}
             <div className="game-card">
                <h1 className="text-4xl font-black">{game.publicMessage}</h1>
                {/* ... Player Grid ... */}
             </div>
        </div>
      )}
    </div>
  );
}

// Helper Component
function CounterRow({ label, icon, value, onChange }) {
    return (
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-4 pl-2">
                {icon}
                <span className="font-black uppercase text-base tracking-widest text-slate-300">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => onChange(Math.max(0, value - 1))} className="btn-counter hover:text-red-400">-</button>
                <span className="w-8 text-center font-mono text-2xl font-black">{value}</span>
                <button onClick={() => onChange(value + 1)} className="btn-counter hover:text-green-400">+</button>
            </div>
        </div>
    );
}