/**
 * Built-in sports intelligence engine for Sportlight.
 * Provides answers for players, recruiters, platform features, fitness benchmarks, and training tips.
 */

export function generateSportlightResponse(userQuery: string): string {
  const query = userQuery.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening|good afternoon)/i.test(query)) {
    return "Hello! I am your Sportlight AI Assistant. I can help you with scouting players, updating your profile, checking fitness benchmarks, and finding the right clubs or talent. What would you like to know today?";
  }

  // 2. Scouting & Recruiting
  if (query.includes("scout") || query.includes("recruit") || query.includes("find player") || query.includes("hire") || query.includes("discover")) {
    return "To scout talent on Sportlight, head over to the **Dashboard** and select the **Player View**. You can filter players by sport (Football, Cricket), search by key skills (such as Dribbling, Pace, Spin Bowling), and view verified performance metrics to benchmark candidates against pro averages.";
  }

  // 3. Clubs & Joining
  if (query.includes("club") || query.includes("team") || query.includes("barcelona") || query.includes("manchester") || query.includes("mumbai indians")) {
    return "Sportlight connects athletes directly with top clubs across leagues like the Premier League, La Liga, Serie A, and the IPL. You can browse registered clubs in the **Recruiter View** on the Dashboard to see their active scouting focus and registered addresses.";
  }

  // 4. Benchmarks & Performance
  if (query.includes("benchmark") || query.includes("metric") || query.includes("speed") || query.includes("stat") || query.includes("performance")) {
    return "Sportlight tracks standardized athletic benchmarks:\n• **Football**: Sprint Speed (avg ~30 km/h for pro wingers), Shot Accuracy (target >80%), and Distance Covered.\n• **Cricket**: Top Bowling Speed (fast bowlers aim for 130+ kph, medium 115-125 kph), and Batting Average.\n\nYou can input your latest metrics under the **Performance** tab in your Profile to benchmark yourself against division averages!";
  }

  // 5. Profile Management & Photos
  if (query.includes("profile") || query.includes("photo") || query.includes("avatar") || query.includes("picture") || query.includes("update") || query.includes("edit")) {
    return "You can manage your athlete or club details anytime on the **Profile Management** page. Upload your profile photo, specify your sport, height, weight, preferred club, and skills. All images and updates are stored securely in the local database!";
  }

  // 6. Verification & Badges
  if (query.includes("verif") || query.includes("badge") || query.includes("star") || query.includes("elite")) {
    return "Player profiles earn dynamic achievement badges based on their performance score and completed details:\n• **Rising Star**: Solid verified match statistics.\n• **Elite Performer**: Exceptional speed, accuracy, or match-winning stats.\nTo get fully verified, make sure all your contact and performance metrics are up to date on your profile.";
  }

  // 7. Video & AI Tools
  if (query.includes("video") || query.includes("ai tool") || query.includes("camera") || query.includes("check") || query.includes("guidance")) {
    return "Explore the **AI Tools** page in the left sidebar! You can access:\n1. **AI Video Checker**: Upload game footage or drill recordings to analyze posture, skill execution, and ball contact.\n2. **Recording Guidance**: Best angles and lighting setups for scouts to evaluate your technique.\n3. **AI Achievement Visualizer**: Generate cards highlighting your stats.";
  }

  // 8. Delete / Ownership
  if (query.includes("delete") || query.includes("remove profile") || query.includes("owner")) {
    return "Only the authorized account owner (matching your login credentials and profile ID) can delete their profile. You can delete your profile by clicking your player card on the Dashboard and choosing 'Delete Profile', or by clicking 'Delete Profile' at the bottom of the Profile page.";
  }

  // 9. Training / Fitness advice
  if (query.includes("train") || query.includes("stamina") || query.includes("drill") || query.includes("diet") || query.includes("fitness") || query.includes("exercise")) {
    return "For peak performance, we recommend:\n1. **Interval Sprints**: 30-second max-effort sprints with 60-second recovery to build match agility.\n2. **Plyometrics**: Box jumps and lateral bounds to increase explosive leg power.\n3. **Sport-Specific Drills**: Daily first-touch drills for footballers, or target-line bowling for cricketers.\n4. **Recovery**: Ensure 7-8 hours of sleep and adequate hydration before scout trials.";
  }

  // 10. Platform / About Sportlight
  if (query.includes("sportlight") || query.includes("what is this") || query.includes("help") || query.includes("how to use")) {
    return "Sportlight is a modern sports talent discovery platform that bridges the gap between emerging athletes and pro recruiters. Athletes showcase their verified metrics, bio, and achievements, while recruiters scout top prospects across multiple sports disciplines.";
  }

  // General Sports Fallback
  return `Thank you for asking about "${userQuery}". On Sportlight, athletes can track their performance metrics, build a verified profile, and get scouted by premier clubs. If you need assistance with updating your profile, checking fitness standards, or discovering clubs, feel free to ask!`;
}
