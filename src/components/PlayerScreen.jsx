import React, { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { db } from '../firebase';
import { Skull, Shield, Sword, Search, CheckCircle } from 'lucide-react';

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

  if (!me || !game) return <div className="center-container">Loading...</div>;

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
  if (isDead) return (
      <div className="center-container bg-red-950">
          <Skull size={64} className="text-red-400 mb-6" />
          <h1 className="text-4xl font-black mb-2 uppercase">Eliminated</h1>
          <p className="text-red-200 opacity-60">You are out of the game.</p>
      </div>
  );

  return (
    <div className="center-container justify-start p-4 bg-slate-900">
        {/* HEADER */}
        <div className="w-full max-w-md flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="font-bold text-lg">{playerName}</div>
            {me.role !== "UNKNOWN" && (
                <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    me.role==="MAFIA" ? "bg-red-500/20 text-red-400" : me.role==="DOCTOR"?"bg-green-500/20 text-green-400":"bg-blue-500/20 text-blue-400"
                }`}>
                    {me.role}
                </div>
            )}
        </div>

        {game.gameState === "LOBBY" && (
            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-80 pb-20">
                <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center text-6xl mb-6 shadow-xl border-4 border-slate-700">😎</div>
                <h2 className="text-2xl font-bold mb-2">You're In!</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Waiting for host</p>
            </div>
        )}

        {(game.gameState === "NIGHT" || game.gameState === "VOTING") && (
            <div className="w-full max-w-md flex flex-col flex-grow">
                
                {/* STATUS HEADER */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black uppercase text-white mb-1">
                        {game.gameState === "NIGHT" ? "Night Phase" : "Voting Phase"}
                    </h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        {game.gameState === "NIGHT" ? (me.role === "VILLAGER" ? "Go to Sleep" : "Choose a Target") : "Cast your Vote"}
                    </p>
                </div>

                {investigation && (
                    <div className="bg-white text-slate-900 p-4 rounded-xl text-center font-bold mb-6 shadow-xl animate-bounce">
                        🔍 {investigation.name} is {investigation.role}
                    </div>
                )}

                {/* ACTION GRID */}
                {!(game.gameState==="NIGHT" && me.role==="VILLAGER") && (
                    <div className="grid grid-cols-1 gap-3 overflow-y-auto pb-safe">
                        {Object.values(game.players).filter(p => p.isAlive && p.id !== me.id).map(p => {
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
                                    className={`w-full p-4 rounded-xl font-bold text-lg transition-all flex items-center justify-between px-6 ${
                                        isSelected 
                                        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                                    } ${disabled ? 'opacity-30' : ''}`}
                                >
                                    <span>{p.name}</span>
                                    {isSelected && <CheckCircle size={20} />}
                                    {game.gameState === "NIGHT" && !isSelected && (
                                        me.role === "MAFIA" ? <Sword size={18} className="text-red-500"/> : me.role === "DOCTOR" ? <Shield size={18} className="text-green-500"/> : <Search size={18} className="text-blue-500"/>
                                    )}
                                </button>
                             )
                        })}
                    </div>
                )}
                
                {(game.gameState==="NIGHT" && me.role==="VILLAGER") && (
                    <div className="flex-grow flex items-center justify-center opacity-30">
                        <div className="text-8xl">😴</div>
                    </div>
                )}
            </div>
        )}

        {game.gameState === "DAY" && (
            <div className="flex-grow flex items-center justify-center flex-col text-center p-8 border-4 border-slate-800 rounded-3xl m-4 opacity-50">
                <h1 className="text-6xl mb-4">📺</h1>
                <p className="font-bold uppercase tracking-widest">Look at the TV</p>
            </div>
        )}
    </div>
  );
}