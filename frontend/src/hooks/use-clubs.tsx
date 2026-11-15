
"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useEffect } from "react";
import { Club, ClubDocument, clubs as mockClubs, League } from "@/lib/mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ClubsContextType = {
  clubs: Club[];
  loading: boolean;
  addClub: (clubData: { name: string; league: League; location: string; description: string; scoutingFocus: string[]; creatorEmail: string;}) => Promise<string>;
  updateClub: (clubId: string, clubData: Partial<ClubDocument>) => Promise<void>;
  refreshClubs: () => Promise<void>;
};

const ClubsContext = createContext<ClubsContextType | undefined>(undefined);

export function ClubsProvider({ children }: { children: ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>(mockClubs);
  const [loading, setLoading] = useState(false);

  const refreshClubs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/club`);
      if (res.ok) {
        const dbClubs = await res.json();
        if (Array.isArray(dbClubs) && dbClubs.length > 0) {
          const formatted: Club[] = dbClubs.map((c: any) => ({
            id: c._id || c.id,
            name: c.name || "Unnamed Club",
            league: (c.league as League) || "Premier League",
            location: c.address || c.location || "Not specified",
            description: c.description || "",
            scoutingFocus: c.scoutingFocus || [],
            creatorEmail: c.contactEmail || "club@sportlight.com",
            logo: c.logo || `https://picsum.photos/seed/${c._id}/200/200`,
            verified: c.profileCompleted || false,
            createdAt: c.createdAt || new Date().toISOString(),
            address: c.address || "Not specified",
            foundationDate: c.foundationDate || new Date().toISOString().split('T')[0],
            contactPerson: c.contactPerson || "N/A",
            contactMobile: c.contactMobile || "N/A",
            contactEmail: c.contactEmail || "club@sportlight.com",
          }));
          setClubs(formatted);
        }
      }
    } catch {
      // Fallback silently
    }
  }, []);

  useEffect(() => {
    refreshClubs();
  }, [refreshClubs]);

  const addClub = useCallback(async (clubData: { name: string; league: League; location: string; description: string; scoutingFocus: string[]; creatorEmail: string;}) => {
    let newId = `club-${Date.now()}`;
    try {
      const res = await fetch(`${API_BASE}/club`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubData),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved._id) newId = saved._id;
      }
    } catch (e) {
      console.warn("Could not save club to MongoDB:", e);
    }

    const newClub: Club = {
      id: newId,
      name: clubData.name,
      league: clubData.league,
      location: clubData.location,
      description: clubData.description,
      scoutingFocus: clubData.scoutingFocus,
      creatorEmail: clubData.creatorEmail,
      logo: `https://picsum.photos/seed/${newId}/200/200`,
      verified: false,
      createdAt: new Date().toISOString(),
      address: clubData.location,
      foundationDate: new Date().toISOString().split('T')[0],
      contactPerson: 'N/A',
      contactMobile: 'N/A',
      contactEmail: clubData.creatorEmail,
    };
    setClubs(prev => [newClub, ...prev]);
    return newId;
  }, []);

  const updateClub = useCallback(async (clubId: string, clubData: Partial<ClubDocument>) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      await fetch(`${API_BASE}/club/${clubId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(clubData),
      });
      if (token) {
        await fetch(`${API_BASE}/club/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(clubData),
        });
      }
    } catch (e) {
      console.warn("Update club error:", e);
    }
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, ...clubData } : c));
  }, []);

  const value = useMemo(() => ({
    clubs,
    loading,
    addClub,
    updateClub,
    refreshClubs,
  }), [clubs, loading, addClub, updateClub, refreshClubs]);

  return (
    <ClubsContext.Provider value={value}>
      {children}
    </ClubsContext.Provider>
  );
}

export function useClubs() {
  const context = useContext(ClubsContext);
  if (context === undefined) {
    throw new Error("useClubs must be used within a ClubsProvider");
  }
  return context;
}
