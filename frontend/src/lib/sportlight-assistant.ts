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
  const clubSummaries = data.clubs.map(c => {
    const owner = getClubOwnerName(c);
    return `• ${c.name} | Owner / Representative: ${owner} | League: ${c.league || 'General'} | Location: ${c.location || c.address || 'N/A'} | Scouting Focus: ${(c.scoutingFocus || []).join(', ') || 'General Talent'} | Contact: ${c.contactEmail || 'N/A'}`;
  }).join('\n');

  const playerSummaries = data.players.map(p => 
    `• ${p.name} | Sport: ${p.sport || 'N/A'} | Age: ${p.age || 'N/A'} | Location: ${p.location || 'N/A'} | Skills: ${(p.skills || []).join(', ') || 'N/A'} | Dream Club: ${p.dreamClub || 'None'} | Verified: ${p.profileCompleted ? 'Yes' : 'No'}`
  ).join('\n');

  return `=== CURRENT LIVE WEBSITE DATA (from MongoDB) ===
ACTIVE CLUBS ON WEBSITE (${data.clubs.length}):
${clubSummaries || 'No clubs currently registered.'}

ACTIVE PLAYERS ON WEBSITE (${data.players.length}):
${playerSummaries || 'No players currently registered.'}
=================================================`;
}

/**
 * Extracts the most accurate owner/representative name for a club
 */
export function getClubOwnerName(club: any): string {
  if (club.contactPerson && club.contactPerson.trim() && club.contactPerson.trim().toLowerCase() !== 'n/a') {
    return club.contactPerson.trim();
  }
  // If the club name has an apostrophe s like "Biswanath Kobi's Club"
  const match = club.name?.match(/^(.+?)('s|’s)\s+club$/i);
  if (match) {
    return match[1].trim();
  }
  if (club.contactEmail) {
    const emailPrefix = club.contactEmail.split('@')[0];
    return emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
  return "Registered Club Administrator";
}

/**
 * Checks if the user query is within the domain of Sportlight, sports, players, or clubs.
 */
function isDomainQuery(query: string, data: LiveData): boolean {
  const q = query.toLowerCase();

  // 1. Common greetings or platform interactions
  if (/^(hi|hello|hey|greetings|hola|help|good\s+(morning|afternoon|evening)|thank(s|\s+you)|bye|goodbye)$/i.test(q)) {
    return true;
  }

  // 2. Domain keywords
  const sportsKeywords = [
    "sport", "football", "cricket", "player", "club", "team", "scout", "recruit",
    "benchmark", "speed", "stamina", "metric", "profile", "avatar", "photo",
    "achievement", "video", "drill", "trial", "league", "owner", "who owns",
    "contact", "barcelona", "manchester", "juventus", "mumbai", "kobi", "sharma",
    "johnson", "sterling", "verma", "login", "signup", "dashboard", "tools",
    "verified", "skills", "delete", "account", "striker", "batsman", "bowler",
    "pitch", "match", "academy", "contract", "stats"
  ];

  if (sportsKeywords.some(kw => q.includes(kw))) {
    return true;
  }

  // 3. Any club name or player name currently in database
  for (const c of data.clubs) {
    const cName = (c.name || '').toLowerCase();
    if (cName && q.includes(cName)) return true;
    const parts = cName.split(/[\s'-]+/);
    if (parts.some((p: string) => p.length > 3 && q.includes(p))) return true;
  }

  for (const p of data.players) {
    const pName = (p.name || '').toLowerCase();
    if (pName && q.includes(pName)) return true;
    const parts = pName.split(/[\s'-]+/);
    if (parts.some((p: string) => p.length > 3 && q.includes(p))) return true;
  }

  return false;
}

/**
 * Directly answers user questions based on live MongoDB data with strict guardrails.
 */
export async function generateDatabaseGroundedResponse(userQuery: string): Promise<string> {
  const query = userQuery.toLowerCase().trim();
  const data = await fetchLiveDatabaseData();

  // Deduplicate clubs
  const uniqueClubsMap = new Map();
  for (const c of data.clubs) {
    const cleanName = (c.name || '').trim();
    if (cleanName && !uniqueClubsMap.has(cleanName.toLowerCase())) {
      uniqueClubsMap.set(cleanName.toLowerCase(), c);
    }
  }
  // Sort clubs by name length descending so longer/more specific names match first
  const uniqueClubs = Array.from(uniqueClubsMap.values()).sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

  // Deduplicate players
  const uniquePlayersMap = new Map();
  for (const p of data.players) {
    const cleanName = (p.name || '').trim();
    if (cleanName && !uniquePlayersMap.has(cleanName.toLowerCase())) {
      uniquePlayersMap.set(cleanName.toLowerCase(), p);
    }
  }
  const uniquePlayers = Array.from(uniquePlayersMap.values());

  // --- GUARDRAIL: OUT OF RANGE QUERIES ---
  if (!isDomainQuery(query, data)) {
    return "No, I can't answer this question. I can only assist with questions regarding the Sportlight platform, its registered players, clubs, and sports scouting features.";
  }

  // --- 1. CLUB OWNERSHIP QUERY ---
  // e.g. "who is the owner of Biswanath Kobi's Club", "who owns FC Barcelona", "who is the owner of Mumbai Indians"
  if (
    query.includes("owner") || 
    query.includes("owns") || 
    query.includes("who is the owner") || 
    query.includes("who founded") || 
    query.includes("contact person")
  ) {
    // Find matching club in database
    for (const club of uniqueClubs) {
      const cName = (club.name || '').toLowerCase();
      const parts = cName.split(/[\s'’]+/).filter((p: string) => p.length > 2 && p !== 'club' && p !== 'fc' && p !== 'the');

      const matchesFullName = cName && query.includes(cName);
      const matchesParts = parts.length > 0 && parts.every((p: string) => query.includes(p));

      if (matchesFullName || matchesParts) {
        const ownerName = getClubOwnerName(club);
        return `The owner of **${club.name}** is **${ownerName}**.`;
      }
    }

    // If they asked generally "who are the owners of the clubs"
    if (query.includes("clubs") || query.includes("all")) {
      const list = uniqueClubs.map(c => `• **${c.name}**: Owned / represented by **${getClubOwnerName(c)}**`).join('\n');
      return `Here are the owners and representatives of the clubs on Sportlight:\n\n${list}`;
    }
  }

  // --- 2. LIST ALL CLUBS ---
  if (
    query.includes("club") && 
    (query.includes("present") || query.includes("what are") || query.includes("which") || query.includes("list") || query.includes("available") || query.includes("currently") || query.includes("all") || query.includes("show"))
  ) {
    if (uniqueClubs.length === 0) {
      return "There are currently no clubs registered in the database on Sportlight.";
    }

    const clubList = uniqueClubs.map((c, i) => {
      const owner = getClubOwnerName(c);
      const league = c.league ? ` - ${c.league}` : '';
      return `${i + 1}. **${c.name}**${league} (Owner: ${owner})`;
    }).join('\n');

    return `Currently, there are **${uniqueClubs.length} clubs** registered on the Sportlight website:\n\n${clubList}\n\nYou can scout them or view their full details in the **Recruiter View** on the Dashboard!`;
  }

  // --- 3. LIST ALL PLAYERS ---
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

  // --- 4. SPECIFIC PLAYER DETAILS ---
  for (const player of uniquePlayers) {
    const nameLower = (player.name || '').toLowerCase();
    const parts = nameLower.split(/\s+/).filter((p: string) => p.length > 2);
    if (nameLower && (query.includes(nameLower) || (parts.length > 1 && parts.every((p: string) => query.includes(p))))) {
      const skillsStr = (player.skills || []).join(', ') || 'General';
      const statsStr = player.performanceData && player.performanceData.length > 0
        ? player.performanceData.map((d: any) => `${d.metric}: ${d.value} ${d.unit}`).join(' | ')
        : 'No benchmark tests recorded yet';

      return `Here are the details for **${player.name}** on Sportlight:\n• **Sport**: ${player.sport || 'Not specified'}\n• **Age**: ${player.age || 'N/A'} years old\n• **Location**: ${player.location || 'Not specified'}\n• **Skills**: ${skillsStr}\n• **Dream Club**: ${player.dreamClub || 'Open to trials'}\n• **Performance Metrics**: ${statsStr}\n• **Bio / Achievements**: ${player.achievementsText || 'Profile in progress'}`;
    }
  }

  // --- 5. SPECIFIC CLUB DETAILS ---
  for (const club of uniqueClubs) {
    const nameLower = (club.name || '').toLowerCase();
    const parts = nameLower.split(/[\s'’]+/).filter((p: string) => p.length > 3 && p !== 'club');
    if (nameLower && (query.includes(nameLower) || (parts.length > 0 && parts.every((p: string) => query.includes(p))))) {
      const focusStr = (club.scoutingFocus || []).join(', ') || 'All positions';
      const owner = getClubOwnerName(club);
      return `Here are the details for **${club.name}** on Sportlight:\n• **Owner / Representative**: ${owner}\n• **League**: ${club.league || 'Not specified'}\n• **Location / Address**: ${club.address || club.location || 'Not specified'}\n• **Scouting Focus**: ${focusStr}\n• **Contact Email**: ${club.contactEmail || 'N/A'}\n• **About**: ${club.description || 'Verified Club on Sportlight'}`;
    }
  }

  // --- 6. SPORT FILTER QUERIES ---
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

  // --- 7. SCOUTING QUERIES ---
  if (query.includes("scout") || query.includes("looking for") || query.includes("need")) {
    const matches: string[] = [];
    for (const club of uniqueClubs) {
      const focusList = (club.scoutingFocus || []).map((f: string) => f.toLowerCase());
      if (focusList.some((f: string) => query.includes(f))) {
        matches.push(`• **${club.name}** (Owner: ${getClubOwnerName(club)}) is scouting: ${(club.scoutingFocus || []).join(', ')}`);
      }
    }
    if (matches.length > 0) {
      return `Based on live club listings on the website:\n\n${matches.join('\n')}`;
    }
  }

  // --- 8. BENCHMARKS ---
  if (query.includes("benchmark") || query.includes("speed") || query.includes("metric") || query.includes("standard")) {
    return "Sportlight tracks standardized athletic benchmarks:\n• **Football**: Sprint Speed (avg ~30 km/h for pro wingers), Shot Accuracy (target >80%), and Distance Covered.\n• **Cricket**: Top Bowling Speed (fast bowlers aim for 130+ kph, medium 115-125 kph), and Batting Average.\n\nYou can benchmark your stats under the **Performance** tab in your Profile!";
  }

  // --- 9. GREETINGS ---
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening|good afternoon)/i.test(query)) {
    const sampleClubs = uniqueClubs.slice(0, 3).map(c => c.name).join(', ');
    const samplePlayers = uniquePlayers.slice(0, 3).map(p => p.name).join(', ');
    return `Hello! I am your Sportlight AI Assistant, connected live to our database.\n\nCurrently, we have **${uniqueClubs.length} clubs** (like ${sampleClubs}) and **${uniquePlayers.length} players** (like ${samplePlayers}) active on the website.\n\nAsk me about any player, club, club owner, or fitness benchmark!`;
  }

  // Default response for in-domain queries
  return "No, I can't answer this question. I can only assist with questions regarding the Sportlight platform, its registered players, clubs, and sports scouting features.";
}
