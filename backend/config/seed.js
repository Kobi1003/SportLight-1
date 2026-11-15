import Player from "../models/player.js";
import Club from "../models/club.js";

export const seedDefaultData = async () => {
  try {
    const playerCount = await Player.countDocuments();
    if (playerCount === 0) {
      console.log("[Seed] Seeding initial static player profiles into MongoDB...");
      await Player.create([
        {
          name: "Alex Johnson",
          email: "alex@sportlight.com",
          sport: "Football",
          age: 22,
          location: "London, UK",
          mobile: "+44 1234567890",
          height: 185,
          weight: 80,
          gender: "Male",
          dreamClub: "Arsenal",
          skills: ["Dribbling", "Passing", "Shooting"],
          verified: true,
          achievementsText: "Won the local league championship with 15 goals in the season. Named Young Player of the Year.",
          achievementsImage: "https://picsum.photos/seed/a1/600/400",
          avatar: "https://picsum.photos/seed/p1/200/200",
          performanceData: [
            { metric: "Sprint Speed", value: 33, unit: "km/h" },
            { metric: "Shot Accuracy", value: 85, unit: "%" },
          ],
          profileCompleted: true,
        },
        {
          name: "Priya Sharma",
          email: "priya@sportlight.com",
          sport: "Cricket",
          age: 20,
          location: "Mumbai, India",
          mobile: "+91 9876543210",
          height: 165,
          weight: 58,
          gender: "Female",
          dreamClub: "Mumbai Indians",
          skills: ["Batting", "Spin Bowling"],
          verified: true,
          achievementsText: "Scored a century in the regional U-21 tournament. Known for aggressive batting style.",
          achievementsImage: "https://picsum.photos/seed/a2/600/400",
          avatar: "https://picsum.photos/seed/p2/200/200",
          performanceData: [
            { metric: "Batting Average", value: 45.5, unit: "" },
            { metric: "Bowling Economy", value: 4.2, unit: "rpo" },
          ],
          profileCompleted: true,
        },
        {
          name: "Marcus Sterling",
          email: "marcus@sportlight.com",
          sport: "Football",
          age: 24,
          location: "Manchester, UK",
          mobile: "+44 7890123456",
          height: 178,
          weight: 74,
          gender: "Male",
          dreamClub: "Manchester City",
          skills: ["Pace", "Cross-field passes", "Defending"],
          verified: true,
          achievementsText: "Led university team to national championship. 12 assists in 18 games.",
          achievementsImage: "https://picsum.photos/seed/a3/600/400",
          avatar: "https://picsum.photos/seed/p3/200/200",
          performanceData: [
            { metric: "Top Speed", value: 34.5, unit: "km/h" },
            { metric: "Pass Completion", value: 89, unit: "%" },
          ],
          profileCompleted: true,
        },
      ]);
      console.log("[Seed] Initial players inserted successfully.");
    }

    const clubCount = await Club.countDocuments();
    if (clubCount === 0) {
      console.log("[Seed] Seeding initial static club profiles into MongoDB...");
      await Club.create([
        {
          name: "FC Barcelona",
          logo: "https://picsum.photos/seed/c1/200/200",
          league: "La Liga",
          location: "Barcelona, Spain",
          address: "C. d'Arístides Maillol, 12, 08028 Barcelona, Spain",
          foundationDate: "1899-11-29",
          description: "A professional football club based in Barcelona, Catalonia, Spain. Known for its historical success and tiki-taka style of play.",
          verified: true,
          scoutingFocus: ["Midfielder", "Forward", "Youth Talent"],
          contactPerson: "Joan Laporta",
          contactMobile: "+34 902 1899 00",
          contactEmail: "contact@fcbarcelona.cat",
          profileCompleted: true,
        },
        {
          name: "Manchester United",
          logo: "https://picsum.photos/seed/c2/200/200",
          league: "Premier League",
          location: "Manchester, England",
          address: "Sir Matt Busby Way, Old Trafford, Stretford, Manchester M16 0RA, UK",
          foundationDate: "1878-03-05",
          description: "One of the most widely supported football clubs in the world. They have won more trophies than any other club in English football.",
          verified: true,
          scoutingFocus: ["Defender", "Goalkeeper"],
          contactPerson: "Sir Jim Ratcliffe",
          contactMobile: "+44 161 676 7770",
          contactEmail: "enquiries@manutd.co.uk",
          profileCompleted: true,
        },
        {
          name: "Juventus F.C.",
          logo: "https://picsum.photos/seed/c3/200/200",
          league: "Serie A",
          location: "Turin, Italy",
          address: "Via Druento, 175, 10151 Torino TO, Italy",
          foundationDate: "1897-11-01",
          description: "An Italian professional football club based in Turin, Piedmont. Nicknamed the Old Lady.",
          verified: true,
          scoutingFocus: ["Striker", "Winger"],
          contactPerson: "Cristiano Giuntoli",
          contactMobile: "+39 011 65 631",
          contactEmail: "info@juventus.com",
          profileCompleted: true,
        },
        {
          name: "Mumbai Indians",
          logo: "https://picsum.photos/seed/c4/200/200",
          league: "Premier League",
          location: "Mumbai, India",
          address: "Wankhede Stadium, D Road, Churchgate, Mumbai 400020",
          foundationDate: "2008-01-24",
          description: "A premier franchise cricket team based in Mumbai, Maharashtra. Five-time IPL Champions.",
          verified: true,
          scoutingFocus: ["Fast Bowler", "All-Rounder", "Power Hitter"],
          contactPerson: "Akash Ambani",
          contactMobile: "+91 22 2281 1234",
          contactEmail: "contact@mumbaiindians.com",
          profileCompleted: true,
        },
      ]);
      console.log("[Seed] Initial clubs inserted successfully.");
    }
  } catch (err) {
    console.error("[Seed Error]", err);
  }
};

