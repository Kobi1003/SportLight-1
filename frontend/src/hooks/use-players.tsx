"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useEffect } from "react";
import { Player, PlayerDocument, players as mockPlayers } from "@/lib/mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type PlayersContextType = {
  players: Player[];
  loading: boolean;
  addPlayer: (player: Omit<PlayerDocument, 'creatorEmail' | 'createdAt'>) => Promise<string>;
  deletePlayer: (playerId: string) => Promise<void>;
  updatePlayer: (playerId: string, playerData: Partial<PlayerDocument>) => Promise<void>;
  refreshPlayers: () => Promise<void>;
};

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [loading, setLoading] = useState(false);

  const refreshPlayers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/player`);
      if (res.ok) {
        const dbPlayers = await res.json();
        if (Array.isArray(dbPlayers) && dbPlayers.length > 0) {
          const formatted: Player[] = dbPlayers.map((p: any) => ({
            id: p._id || p.id,
            name: p.name || "Unnamed Player",
            sport: p.sport || "Football",
            age: p.age || 20,
            gender: p.gender || "Male",
            location: p.location || "Not specified",
            mobile: p.mobile || "",
            height: p.height || 0,
            weight: p.weight || 0,
            dreamClub: p.dreamClub || "",
            skills: p.skills || [],
            achievementsText: p.achievementsText || "",
            avatar: p.avatar || `https://picsum.photos/seed/${p._id}/200/200`,
            verified: p.profileCompleted || false,
            achievementsImage: p.achievementsImage || "",
            performanceData: p.performanceData || [],
            creatorEmail: p.email || p.creatorEmail || "player@sportlight.com",
            createdAt: p.createdAt || new Date().toISOString(),
          }));
          setPlayers(formatted);
        }
      }
    } catch {
      // Fallback silently to mock players if backend is offline
    }
  }, []);

  useEffect(() => {
    refreshPlayers();
  }, [refreshPlayers]);

  const addPlayer = useCallback(async (playerData: Omit<PlayerDocument, 'creatorEmail' | 'createdAt'>): Promise<string> => {
    let newId = (Math.random() * 1000000).toFixed(0);
    try {
      const res = await fetch(`${API_BASE}/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved._id) newId = saved._id;
      }
    } catch (e) {
      console.warn("Could not save to MongoDB backend, saving to local state:", e);
    }

    const newPlayer: Player = {
        ...playerData,
        id: newId,
        creatorEmail: 'localuser@example.com',
        createdAt: new Date().toISOString(),
    };
    setPlayers(prev => [newPlayer, ...prev]);
    return newId;
  }, []);
  
  const deletePlayer = useCallback(async (playerId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      await fetch(`${API_BASE}/player/${playerId}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
    } catch (e) {
      console.warn("Delete request error:", e);
    }
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);
  
  const updatePlayer = useCallback(async (playerId: string, playerData: Partial<PlayerDocument>) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      // Update by direct ID
      await fetch(`${API_BASE}/player/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(playerData),
      });

      // Also try update via /me if token is present
      if (token) {
        await fetch(`${API_BASE}/player/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(playerData),
        });
      }
    } catch (e) {
      console.warn("Update request error:", e);
    }
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...playerData } : p));
  }, []);

  const value = useMemo(() => ({
    players,
    loading,
    addPlayer,
    deletePlayer,
    updatePlayer,
    refreshPlayers,
  }), [players, loading, addPlayer, deletePlayer, updatePlayer, refreshPlayers]);

  return (
    <PlayersContext.Provider value={value}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (context === undefined) {
    throw new Error("usePlayers must be used within a PlayersProvider");
  }
  return context;
}
