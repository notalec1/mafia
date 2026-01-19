import React, { useState, useEffect } from 'react';
import {Hg} from 'lucide-react'; // Removing Hg error, importing used icons below
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { db } from '../firebase';
import { Skull, Shield, Sword, Search, CheckCircle, Moon, Sun } from 'lucide-react';

export default function PlayerScreen({ roomCode, playerName }) {
  const [me, setMe] = useState(null);
  const [game, setGame] = useState(null);
  const [investigation, setInvestigation] = useState(null);

  useEffect(() => {
    const storageKey = `mafia_id_${roomCode}`;
    let myId = sessionStorage.getItem(storageKey);
    if (!myId) { myId = playerName.replace(/[^a-zA-Z0-9]/g, '') + "_" + Date.now(); sessionStorage.setItem(storageKey, myId); }
    const myRef = ref(db, `rooms/${roomCode}/players/${myId}`);
    onValue(myRef, (snapshot) => { 
        if (!snapshot.exists()) set(myRef, { id: myId, name: playerName, isAlive: true, role: "UNKNOWN", isOnline: true }); 
        else setMe(snapshot.val()); 
    });
    onDisconnect(myRef).update({ isOnline: false });
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => { 
        const d = snapshot.val(); 
        if(d) { setGame(d); if (d.gameState !== "NIGHT") setInvestigation(null); } 
    });
    return () => unsub();
  }, []);

  if (!me || !game) return <div className="center-container"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>;

  const handleAction = (targetId, type) => {
      if (type === "KILL" && game.turnCount === 1 && game.config?.peacefulFirstNight) return;
      if (type === "INVESTIGATE") {
          const t = Object.values(game.players).find(p => p.id === targetId);
          setInvestigation({ name: t.name, role: t.role === "MAFIA" ? "MAFIA" : "INNOCENT" });
      } else {
          set(ref(db, `rooms/${roomCode}/nightActions/${me.id}`), { type, targetId });
      }
  };
  const handleVote = (tid) => set(ref(db, `rooms/${roomCode}/players/${me.id}/voteTarget`), tid);

  const isDead = game.gameState !== "LOBBY" && me.isAlive === false;
  
  // ROLE STYLES
  const getRoleColor = (r) => {
    switch(r) {
        case 'MAFIA': return 'text-red-500 bg-red-950/30 border-red-500/20';
        case 'DOCTOR': return 'text-green-500 bg-green-950/30 border-green-500/20';
        case 'DETECTIVE': return 'text-blue-500 bg-blue-950/30 border-blue-500/20';
        default: return 'text-slate-400 bg-slate-800/50 border-slate-700';
    }
  }

  // --- DEAD VIEW ---
  if (isDead) return (
      <div className="center-container bg-[#2a0a0a]">
          <div className="bg-red-500/10 p-12 rounded-full border-4 border-red-500/20 mb-8 animate-pulse">
            <Skull size={80} className="text-red-500" />
          </div>
          <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-red-500">Eliminated</h1>
          <p className="text-red-200/60 font-medium">You have been removed from the game.</p>
      </div>
  );

  // --- MAIN PLAYER VIEW ---
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 overflow-hidden">
        
        {/* TOP BAR: IDENTITY */}
        <div className="w-full bg-slate-900 border-b border-white/10 p-4 pt-safe flex items-center justify-between z-20 shadow-xl">
            <div className="font-bold text-xl tracking-tight text-white">{playerName}</div>
            {me.role !== "UNKNOWN" && (
                <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getRoleColor(me.role)}`}>
                    {me.role}
                </div>
            )}
        </div>

        {/* LOBBY STATE */}
        {game.gameState === "LOBBY" && (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-blue-600 rounded-2xl rotate-3 flex items-center justify-center shadow-2xl shadow-blue-900/50">
                    <span className="text-4xl text-white font-black">?</span>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">You are in!</h2>
                    <p className="text-slate-400 font-medium text-sm">Watch the TV for instructions.</p>
                </div>
            </div>
        )}

        {/* ACTION PHASE */}
        {(game.gameState === "NIGHT" || game.gameState === "VOTING") && (
            <div className="flex flex-col h-full">
                
                {/* PHASE HEADER */}
                <div className="p-6 text-center bg-gradient-to-b from-slate-900 to-transparent">
                    <div className="flex justify-center mb-2">
                        {game.gameState === "NIGHT" ? <Moon size={32} className="text-indigo-400" /> : <Sun size={32} className="text-amber-400" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase text-white tracking-tight leading-none mb-1">
                        {game.gameState === "NIGHT" ? "Night Phase" : "Voting Phase"}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                        {game.gameState === "NIGHT" ? (me.role === "VILLAGER" ? "Stay Quiet" : "Select Target") : "Cast Your Vote"}
                    </p>
                </div>

                {investigation && (
                    <div className="mx-6 mb-4 p-4 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 flex items-center gap-4 animate-bounce">
                        <Search size={24} className="text-indigo-200" />
                        <div>
                            <div className="text-xs font-bold opacity-75 uppercase">Investigation Result</div>
                            <div className="text-lg font-black">{investigation.name} is <span className={investigation.role === 'MAFIA' ? 'text-red-300 decoration-red-300 underline' : 'text-white'}>{investigation.role}</span></div>
                        </div>
                    </div>
                )}

                {/* SCROLLABLE LIST */}
                <div className="flex-grow overflow-y-auto px-4 pb-32 space-y-3">
                    {!(game.gameState==="NIGHT" && me.role==="VILLAGER") ? (
                        Object.values(game.players).filter(p => p.isAlive && p.id !== me.id).map(p => {
                             const disabled = (me.role === "MAFIA" && game.turnCount === 1 && game.config?.peacefulFirstNight);
                             const isSelected = me.voteTarget === p.id;
                             return (
                                <button 
                                    key={p.id}
                                    disabled={disabled}
                                    onClick={() => game.gameState === "NIGHT" 
                                        ? handleAction(p.id, me.role === "MAFIA" ? "KILL" : me.role === "DOCTOR" ? "SAVE" : "INVESTIGATE") 
                                        : handleVote(p.id)
                                    }
                                    className={`w-full relative group p-5 rounded-2xl font-bold text-lg text-left transition-all border-2 ${
                                        isSelected 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-[1.02]' 
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                    } ${disabled ? 'opacity-40 grayscale' : ''}`}
                                >
                                    <span className="relative z-10">{p.name}</span>
                                    {isSelected && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white"><CheckCircle fill="white" className="text-blue-600" size={24} /></div>}
                                    
                                    {/* Context Icon */}
                                    {game.gameState === "NIGHT" && !isSelected && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                                            {me.role === "MAFIA" ? <Sword size={20} className="text-red-500"/> : me.role === "DOCTOR" ? <Shield size={20} className="text-green-500"/> : <Search size={20} className="text-blue-500"/>}
                                        </div>
                                    )}
                                </button>
                             )
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                            <Moon size={64} className="opacity-20 animate-pulse" />
                            <p className="font-bold uppercase tracking-widest text-sm">You are sleeping...</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* DAY PHASE (PASSIVE) */}
        {game.gameState === "DAY" && (
            <div className="flex-grow flex items-center justify-center flex-col text-center p-8 m-4">
                <div className="w-full max-w-xs bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm">
                    <div className="text-6xl mb-6 animate-bounce">📺</div>
                    <h2 className="text-2xl font-black text-white mb-2">Morning Briefing</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Look at the main screen</p>
                </div>
            </div>
        )}
    </div>
  );
}