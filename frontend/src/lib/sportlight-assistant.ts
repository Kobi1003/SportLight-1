/**
 * Database-Grounded Live Intelligence Engine for Sportlight.
 * Fetches real-time players and clubs from the MongoDB backend so responses
 * reflect EXACTLY what is currently present on the website.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface LiveData {
  players: any[];
  clubs: any[];
}

export async function fetchLiveDatabaseData(): Promise<LiveData> {
  try {
    const [playersRes, clubsRes] = await Promise.all([
      fetch(`${API_BASE}/player`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE}/club`, { cache: 'no-store' }).catch(() => null),
    ]);

    const players = playersRes && playersRes.ok ? await playersRes.json() : [];
    const clubs = clubsRes && clubsRes.ok ? await clubsRes.json() : [];

    return {
      players: Array.isArray(players) ? players : [],
      clubs: Array.isArray(clubs) ? clubs : [],
    };
  } catch (err) {
    console.error("Failed to fetch live database data:", err);
    return { players: [], clubs: [] };
  }
}

/**
 * Builds a clean prompt context containing current live database state.
 * Used when Gemini or an LLM is active.
 */
export function buildLiveDatabaseContext(data: LiveData): string {
  const clubSummaries = data.clubs.map(c => 
    `• ${c.name} | League: ${c.league || 'General'} | Location: ${c.location || c.address || 'N/A'} | Scouting Focus: ${(c.scoutingFocus || []).join(', ') || 'General Talent'} | Contact: ${c.contactEmail || 'N/A'}`
  ).join('\n');

  const playerSummaries = data.players.map(p => 
    `• ${p.name} | Sport: ${p.sport || 'N/A'} | Age: ${p.age || 'N/A'} | Skills: ${(p.skills || []).join(', ') || 'N/A'} | Dream Club: ${p.dreamClub || 'None'} | Verified: ${p.profileCompleted ? 'Yes' : 'No'}`
  ).join('\n');

  return `=== CURRENT LIVE WEBSITE DATA (from MongoDB) ===
ACTIVE CLUBS ON WEBSITE (${data.clubs.length}):
${clubSummaries || 'No clubs currently registered.'}

ACTIVE PLAYERS ON WEBSITE (${data.players.length}):
${playerSummaries || 'No players currently registered.'}
=================================================`;
}

/**
 * Directly answers user questions based on the live data from the website database.
 */
export async function generateDatabaseGroundedResponse(userQuery: string): Promise<string> {
  const query = userQuery.toLowerCase().trim();
  const data = await fetchLiveDatabaseData();

  // Deduplicate clubs by name (case-insensitive)
  const uniqueClubsMap = new Map();
  for (const c of data.clubs) {
    const cleanName = (c.name || '').trim();
    if (cleanName && !uniqueClubsMap.has(cleanName.toLowerCase())) {
      uniqueClubsMap.set(cleanName.toLowerCase(), c);
    }
  }
  const uniqueClubs = Array.from(uniqueClubsMap.values());

  // Deduplicate players by name and sport
  const uniquePlayersMap = new Map();
  for (const p of data.players) {
    const cleanName = (p.name || '').trim();
    if (cleanName && !uniquePlayersMap.has(cleanName.toLowerCase())) {
      uniquePlayersMap.set(cleanName.toLowerCase(), p);
    }
  }
  const uniquePlayers = Array.from(uniquePlayersMap.values());

  // 1. "What clubs are present on the website?" / "List clubs" / "Show clubs"
  if (
    query.includes("club") && 
    (query.includes("present") || query.includes("what are") || query.includes("which") || query.includes("list") || query.includes("available") || query.includes("currently") || query.includes("all") || query.includes("show"))
  ) {
    if (uniqueClubs.length === 0) {
      return "There are currently no clubs registered in the database on Sportlight.";
    }

    const clubList = uniqueClubs.map((c, i) => {
      const focus = c.scoutingFocus && c.scoutingFocus.length > 0 ? ` (Scouting: ${c.scoutingFocus.join(', ')})` : '';
      const league = c.league ? ` - ${c.league}` : '';
      return `${i + 1}. **${c.name}**${league}${focus}`;
    }).join('\n');

    return `Currently, there are **${uniqueClubs.length} clubs** registered on the Sportlight website:\n\n${clubList}\n\nYou can scout them or view their full details in the **Recruiter View** on the Dashboard!`;
  }

  // 2. "What players are present on the website?" / "List players" / "Who is registered"
  if (
    query.includes("player") && 
    (query.includes("present") || query.includes("what are") || query.includes("which") || query.includes("who are") || query.includes("list") || query.includes("available") || query.includes("currently") || query.includes("all") || query.includes("show"))
  ) {
    if (uniquePlayers.length === 0) {
      return "There are currently no players registered in the database on Sportlight.";
    }

    const playerList = uniquePlayers.map((p, i) => {
      const sport = p.sport ? ` [${p.sport}]` : '';
      const skills = p.skills && p.skills.length > 0 ? ` - Skills: ${p.skills.join(', ')}` : '';
      return `${i + 1}. **${p.name}**${sport}${skills}`;
    }).join('\n');

    return `Currently, there are **${uniquePlayers.length} players** registered on the Sportlight website:\n\n${playerList}\n\nYou can click on any player card on the **Dashboard** to view their benchmarks and bio!`;
  }

  // 3. Specific player query: check if user asked about a specific person in the DB
  for (const player of uniquePlayers) {
    const nameLower = (player.name || '').toLowerCase();
    if (nameLower && (query.includes(nameLower) || nameLower.split(' ').some(part => part.length > 3 && query.includes(part)))) {
      const skillsStr = (player.skills || []).join(', ') || 'General';
      const statsStr = player.performanceData && player.performanceData.length > 0
        ? player.performanceData.map((d: any) => `${d.metric}: ${d.value} ${d.unit}`).join(' | ')
        : 'No benchmark tests recorded yet';

      return `Here are the details for **${player.name}** on Sportlight:\n• **Sport**: ${player.sport || 'Not specified'}\n• **Age**: ${player.age || 'N/A'} years old\n• **Location**: ${player.location || 'Not specified'}\n• **Skills**: ${skillsStr}\n• **Dream Club**: ${player.dreamClub || 'Open to trials'}\n• **Performance Metrics**: ${statsStr}\n• **Bio / Achievements**: ${player.achievementsText || 'Profile in progress'}`;
    }
  }

  // 4. Specific club query: check if user asked about a specific club in the DB
  for (const club of uniqueClubs) {
    const nameLower = (club.name || '').toLowerCase();
    if (nameLower && (query.includes(nameLower) || nameLower.split(' ').some(part => part.length > 4 && query.includes(part)))) {
      const focusStr = (club.scoutingFocus || []).join(', ') || 'All positions';
      return `Here are the details for **${club.name}** on Sportlight:\n• **League**: ${club.league || 'Not specified'}\n• **Location / Address**: ${club.address || club.location || 'Not specified'}\n• **Scouting Focus**: ${focusStr}\n• **Contact Person**: ${club.contactPerson || 'Official Representative'}\n• **Contact Email**: ${club.contactEmail || 'N/A'}\n• **About**: ${club.description || 'Verified Club on Sportlight'}`;
    }
  }

  // 5. Sport filter query: "who plays football", "who plays cricket"
  if (query.includes("football") && (query.includes("who") || query.includes("player") || query.includes("play"))) {
    const footballPlayers = uniquePlayers.filter(p => (p.sport || '').toLowerCase() === 'football');
    if (footballPlayers.length === 0) return "Currently, there are no football players registered on the platform.";
    const names = footballPlayers.map(p => `• **${p.name}** (${(p.skills || []).join(', ') || 'Footballer'})`).join('\n');
    return `Here are the football players currently on Sportlight:\n\n${names}`;
  }

  if (query.includes("cricket") && (query.includes("who") || query.includes("player") || query.includes("play") || query.includes("batsman") || query.includes("bowler"))) {
    const cricketPlayers = uniquePlayers.filter(p => (p.sport || '').toLowerCase() === 'cricket');
    if (cricketPlayers.length === 0) return "Currently, there are no cricket players registered on the platform.";
    const names = cricketPlayers.map(p => `• **${p.name}** (${(p.skills || []).join(', ') || 'Cricketer'})`).join('\n');
    return `Here are the cricket players currently on Sportlight:\n\n${names}`;
  }

  // 6. Scouting query: "which club is looking for midfielders / defenders / strikers"
  if (query.includes("scout") || query.includes("looking for") || query.includes("need")) {
    const matches: string[] = [];
    for (const club of uniqueClubs) {
      const focusList = (club.scoutingFocus || []).map((f: string) => f.toLowerCase());
      if (focusList.some((f: string) => query.includes(f))) {
        matches.push(`• **${club.name}** is actively scouting: ${(club.scoutingFocus || []).join(', ')}`);
      }
    }
    if (matches.length > 0) {
      return `Based on live club listings on the website:\n\n${matches.join('\n')}`;
    }
  }

  // 7. Total counts
  if (query.includes("how many") && (query.includes("club") || query.includes("player"))) {
    return `According to our live database right now, Sportlight has **${uniquePlayers.length} players** and **${uniqueClubs.length} clubs** registered.`;
  }

  // 8. Greetings
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening|good afternoon)/i.test(query)) {
    const clubSample = uniqueClubs.slice(0, 3).map(c => c.name).join(', ');
    const playerSample = uniquePlayers.slice(0, 3).map(p => p.name).join(', ');
    return `Hello! I am your Sportlight AI Assistant, connected live to our database.\n\nCurrently, we have **${uniqueClubs.length} clubs** (including ${clubSample || 'top teams'}) and **${uniquePlayers.length} players** (including ${playerSample || 'rising athletes'}) active on the website.\n\nAsk me about any player, club, or fitness benchmark!`;
  }

  // 9. Benchmarks & Performance
  if (query.includes("benchmark") || query.includes("speed") || query.includes("metric") || query.includes("standard")) {
    return "Sportlight tracks standardized athletic benchmarks:\n• **Football**: Sprint Speed (avg ~30 km/h for pro wingers), Shot Accuracy (target >80%), and Distance Covered.\n• **Cricket**: Top Bowling Speed (fast bowlers aim for 130+ kph, medium 115-125 kph), and Batting Average.\n\nYou can benchmark your stats under the **Performance** tab in your Profile!";
  }

  // 10. General fallback grounded in live data
  const sampleClubs = uniqueClubs.slice(0, 3).map(c => c.name).join(', ');
  const samplePlayers = uniquePlayers.slice(0, 3).map(p => p.name).join(', ');

  return `I am connected directly to the Sportlight database. Currently on the website we have **${uniqueClubs.length} clubs** (like ${sampleClubs}) and **${uniquePlayers.length} players** (like ${samplePlayers}).\n\nYou can ask me:\n• *"What clubs are present on the website?"*\n• *"What players are present on the website?"*\n• *"Who plays football or cricket?"*\n• *"Tell me about ${samplePlayers ? samplePlayers.split(',')[0] : 'a player'}"*`;
}
