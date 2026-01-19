import React, { useState, useEffect } from 'react';
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

  if (!me || !game) return <div className="container">Loading...</div>;

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
      <div className="container" style={{ background: '#2a0a0a' }}>
          <Skull size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#ef4444', textTransform: 'uppercase' }}>Eliminated</h1>
          <p>You are out of the game.</p>
      </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505' }}>
        
        {/* TOP BAR */}
        <div style={{ padding: '1rem', background: '#121212', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{playerName}</div>
            {me.role !== "UNKNOWN" && (
                <div style={{ padding: '4px 12px', borderRadius: '12px', background: '#333', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {me.role}
                </div>
            )}
        </div>

        {/* LOBBY */}
        {game.gameState === "LOBBY" && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>WAITING...</h2>
                <p style={{ color: '#888' }}>The host will start the game shortly.</p>
            </div>
        )}

        {/* ACTIVE GAME */}
        {(game.gameState === "NIGHT" || game.gameState === "VOTING") && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    {game.gameState === "NIGHT" ? <Moon size={40} color="#4f46e5"/> : <Sun size={40} color="#fbbf24"/>}
                    <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{game.gameState}</h2>
                    <p style={{ color: '#888' }}>
                         {game.gameState === "NIGHT" ? (me.role === "VILLAGER" ? "Go to sleep..." : "Choose your target") : "Cast your vote"}
                    </p>
                </div>

                {investigation && (
                    <div style={{ margin: '0 1rem 1rem', background: '#4f46e5', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        <strong>RESULT:</strong> {investigation.name} is {investigation.role}
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 2rem' }}>
                    {!(game.gameState==="NIGHT" && me.role==="VILLAGER") && (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {Object.values(game.players).filter(p => p.isAlive && p.id !== me.id).map(p => {
                                 const isSelected = me.voteTarget === p.id;
                                 return (
                                    <button 
                                        key={p.id}
                                        onClick={() => game.gameState === "NIGHT" 
                                            ? handleAction(p.id, me.role === "MAFIA" ? "KILL" : me.role === "DOCTOR" ? "SAVE" : "INVESTIGATE") 
                                            : handleVote(p.id)
                                        }
                                        style={{ 
                                            width: '100%',
                                            padding: '1.2rem',
                                            background: isSelected ? '#4f46e5' : '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '1.1rem',
                                            textAlign: 'left',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {p.name}
                                        {isSelected && <CheckCircle size={20} />}
                                    </button>
                                 )
                            })}
                        </div>
                    )}
                </div>
            </div>
        )}

        {game.gameState === "DAY" && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📺</div>
                <h2>WATCH SCREEN</h2>
                <p style={{ color: '#888' }}>Events are being revealed on the main screen.</p>
            </div>
        )}
    </div>
  );
}