import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Helper function to generate random coordinates around Visakhapatnam
function randomLocation(
  centerLat = 17.6868,
  centerLng = 83.2185,
  radiusKm = 5
) {
  const radiusInDegrees = radiusKm / 111; // Approximate conversion
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;

  const lat = centerLat + distance * Math.cos(angle);
  const lng = centerLng + distance * Math.sin(angle);

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/meetmux";
  await mongoose.connect(uri);
  console.log("Connected to DB");

  // First names and last names for variety
  const firstNames = [
    "Arjun",
    "Priya",
    "Vikram",
    "Aisha",
    "Rohan",
    "Sneha",
    "Karthik",
    "Divya",
    "Rahul",
    "Pooja",
    "Amit",
    "Kavya",
    "Suresh",
    "Ananya",
    "Nikhil",
    "Shreya",
    "Rajesh",
    "Meera",
    "Sanjay",
    "Nisha",
    "Deepak",
    "Riya",
    "Manoj",
    "Swati",
    "Vishal",
    "Neha",
    "Ashish",
    "Kritika",
    "Varun",
    "Priyanka",
    "Rohit",
    "Tanvi",
    "Gaurav",
    "Ishita",
    "Abhishek",
    "Aarti",
    "Sandeep",
    "Ritika",
    "Akash",
    "Shweta",
    "Vivek",
    "Pallavi",
    "Siddharth",
    "Gayatri",
    "Ajay",
    "Manisha",
    "Ravi",
    "Sunita",
    "Harsh",
    "Deepika",
    "Sachin",
    "Anjali",
    "Naveen",
    "Preeti",
    "Yash",
    "Shalini",
    "Ramesh",
    "Geeta",
    "Satish",
    "Shilpa",
    "Mahesh",
    "Vandana",
    "Yogesh",
    "Rashmi",
    "Prasad",
    "Lakshmi",
    "Krishna",
    "Radha",
    "Gopal",
    "Saraswati",
    "Mohan",
    "Parvati",
    "Shyam",
    "Durga",
    "Hari",
    "Kamala",
    "Bala",
    "Sita",
    "Raman",
    "Ganga",
  ];

  const lastNames = [
    "Sharma",
    "Gupta",
    "Singh",
    "Kumar",
    "Rao",
    "Reddy",
    "Nair",
    "Iyer",
    "Patel",
    "Shah",
    "Agarwal",
    "Jain",
    "Bansal",
    "Malhotra",
    "Chopra",
    "Kapoor",
    "Verma",
    "Sinha",
    "Joshi",
    "Desai",
    "Mehta",
    "Pandey",
    "Mishra",
    "Saxena",
    "Tiwari",
    "Dubey",
    "Upadhyay",
    "Bhatt",
    "Chandra",
    "Prasad",
    "Yadav",
    "Thakur",
    "Choudhary",
    "Agrawal",
    "Goyal",
    "Mittal",
    "Jindal",
    "Singhal",
    "Goel",
    "Arora",
    "Bhatia",
    "Sethi",
    "Khanna",
    "Tandon",
    "Sabharwal",
    "Kalra",
    "Bhalla",
    "Dua",
    "Nayyar",
    "Khurana",
  ];

  const interests = ["Sports", "Music", "Food", "Tech", "Travel"];
  const statuses = ["online", "offline", "away"];
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

  // Expanded bio templates
  const bioTemplates = [
    "Tech enthusiast and runner.",
    "Foodie and travel lover.",
    "Basketball and startups.",
    "Live music and coffee.",
    "Hiking and photography.",
    "Gaming and anime fan.",
    "Yoga instructor and vegan.",
    "Photographer and blogger.",
    "Musician and coffee addict.",
    "Cyclist and nature lover.",
    "Chef and food blogger.",
    "Dancer and fitness freak.",
    "Reader and book reviewer.",
    "Artist and creative soul.",
    "Developer and open source contributor.",
    "Traveler and adventure seeker.",
    "Swimmer and beach lover.",
    "Runner and marathon enthusiast.",
    "Climber and mountain lover.",
    "Surfer and ocean explorer.",
    "Biker and road trip fan.",
    "Camper and outdoor enthusiast.",
    "Gardener and plant parent.",
    "Baker and dessert lover.",
    "Wine enthusiast and socialite.",
    "Cricket fan and weekend warrior.",
    "Football lover and team player.",
    "Tennis player and sports fan.",
    "Volleyball enthusiast and beach goer.",
    "Badminton player and fitness lover.",
    "Chess player and strategy game fan.",
    "Board game enthusiast and social butterfly.",
    "Movie buff and cinema lover.",
    "Series binger and popcorn addict.",
    "Podcast listener and audio book fan.",
    "Language learner and culture explorer.",
    "History buff and museum visitor.",
    "Science geek and space enthusiast.",
    "Math lover and puzzle solver.",
    "Philosophy student and deep thinker.",
    "Psychology enthusiast and people watcher.",
    "Meditation practitioner and mindfulness advocate.",
    "Volunteer and community helper.",
    "Environmental activist and green living advocate.",
    "Animal lover and pet parent.",
    "Bird watcher and nature photographer.",
    "Star gazer and astronomy enthusiast.",
    "Weather enthusiast and cloud spotter.",
    "Geology lover and rock collector.",
    "Marine biology enthusiast and ocean protector.",
  ];

  // Generate 100 users
  const users = [];
  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const location = randomLocation();
    const userInterests = [];

    // Give each user 1-3 random interests
    const numInterests = Math.floor(Math.random() * 3) + 1;
    const shuffledInterests = [...interests].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numInterests; j++) {
      userInterests.push(shuffledInterests[j]);
    }

    const user = {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
      password: "Password123!",
      avatarUrl: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`, // Pravatar has ~70 images
      bio: bioTemplates[Math.floor(Math.random() * bioTemplates.length)],
      interests: userInterests,
      location: location,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      isOnline: Math.random() > 0.3, // 70% chance of being online
    };

    users.push(user);
  }

  // Add a few specific test users at the beginning
  const testUsers = [
    {
      name: "Arjun Rao",
      email: "arjun@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
      bio: "Tech enthusiast and runner.",
      interests: ["Tech", "Music"],
      location: { lat: 17.6868, lng: 83.2185 },
      status: "online",
      isOnline: true,
    },
    {
      name: "Priya Singh",
      email: "priya@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
      bio: "Foodie and travel lover.",
      interests: ["Food", "Travel"],
      location: { lat: 17.6882, lng: 83.219 },
      status: "online",
      isOnline: true,
    },
    {
      name: "Vikram Desai",
      email: "vikram@example.com",
      password: "Password123!",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
      bio: "Basketball and startups.",
      interests: ["Sports", "Tech"],
      location: { lat: 17.6855, lng: 83.2202 },
      status: "offline",
      isOnline: false,
    },
  ];

  // Combine test users with generated users
  const allUsers = [...testUsers, ...users];

  console.log(`Generating ${allUsers.length} users...`);

  const emails = allUsers.map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });

  const hashed = await Promise.all(
    allUsers.map(async (u) => {
      const pass = await bcrypt.hash(u.password, 10);
      const hasLatLng =
        u.location &&
        Number.isFinite(u.location.lat) &&
        Number.isFinite(u.location.lng);
      return {
        ...u,
        email: u.email.toLowerCase(),
        password: pass,
        locationGeo: hasLatLng
          ? { type: "Point", coordinates: [u.location.lng, u.location.lat] }
          : undefined,
      };
    })
  );

  await User.insertMany(hashed);
  console.log(`✅ Seeded ${allUsers.length} users successfully!`);

  // Log some statistics
  const onlineCount = allUsers.filter((u) => u.isOnline).length;
  const interestCounts = {};
  allUsers.forEach((u) => {
    u.interests.forEach((interest) => {
      interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });
  });

  console.log(`📊 Statistics:`);
  console.log(`   - Online users: ${onlineCount}/${allUsers.length}`);
  console.log(`   - Interest distribution:`, interestCounts);
  console.log(`   - Location spread: ~5km radius around Visakhapatnam`);

  await mongoose.disconnect();
  console.log("🔐 Database connection closed.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
