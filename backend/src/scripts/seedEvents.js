import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import User from "../models/User.js";

// Helper function to generate random coordinates around Bangalore
function randomLocation(centerLat = 12.9539456, centerLng = 77.4661253, radiusKm = 15) {
  const radiusInDegrees = radiusKm / 111; // Approximate conversion
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  const lat = centerLat + (distance * Math.cos(angle));
  const lng = centerLng + (distance * Math.sin(angle));
  
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  };
}

// Helper to generate random date/time
function randomDateTime() {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  
  // Random time between now and 30 days from now
  const hoursFromNow = Math.random() * 24 * 30; // 0 to 30 days
  const duration = 1 + Math.random() * 4; // 1-5 hours
  
  const startsAt = new Date(base.getTime() + hoursFromNow * 3600 * 1000);
  const endsAt = new Date(startsAt.getTime() + duration * 3600 * 1000);
  
  return { startsAt, endsAt };
}

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/meetmux";
  await mongoose.connect(uri);
  console.log("DB connected");

  // Get all users to use as event creators
  const users = await User.find({}).select("_id name location");
  if (!users.length) {
    throw new Error("No users found. Please seed users first with: npm run seed");
  }

  console.log(`Found ${users.length} users to create events for`);

  // Activity types and their corresponding names
  const activityTypes = {
    Sports: [
      "Morning Cricket Match", "Football Tournament", "Badminton Singles", "Tennis Practice",
      "Basketball 3v3", "Volleyball Beach", "Cycling Group Ride", "Marathon Training",
      "Yoga in the Park", "Swimming Session", "Table Tennis Tournament", "Boxing Workout",
      "Rock Climbing", "Hiking Adventure", "Running Club", "Gym Workout Session",
      "Outdoor Bootcamp", "Crossfit Training", "Zumba Dance Fitness", "Pilates Class"
    ],
    Music: [
      "Acoustic Jam Session", "DJ Night", "Karaoke Party", "Live Band Performance",
      "Music Production Workshop", "Guitar Learning Circle", "Piano Recital", "Drum Circle",
      "Electronic Music Night", "Classical Concert", "Jazz Improvisation", "Singing Workshop",
      "Music Theory Class", "Beat Making Session", "Open Mic Night", "Indie Music Fest",
      "Rock Band Rehearsal", "Hip Hop Cypher", "Folk Music Gathering", "Orchestra Practice"
    ],
    Food: [
      "Street Food Tour", "Cooking Workshop", "Wine Tasting", "Coffee Cupping Session",
      "Barbecue Party", "Potluck Dinner", "Baking Class", "Food Photography", 
      "Restaurant Hopping", "Farmers Market Visit", "Dessert Making", "Healthy Cooking",
      "International Cuisine Night", "Food Truck Festival", "Picnic in the Park", "Brunch Meetup",
      "Pizza Making Workshop", "Cocktail Mixing Class", "Vegan Cooking", "Spice Tasting Tour"
    ],
    Tech: [
      "Coding Bootcamp", "Startup Pitch Night", "AI/ML Workshop", "Blockchain Meetup",
      "Web Dev Hackathon", "Mobile App Demo", "Cloud Computing Talk", "Cybersecurity Workshop",
      "Game Development Jam", "Tech Talk Series", "Programming Contest", "Open Source Contrib",
      "Data Science Meetup", "DevOps Workshop", "UI/UX Design Session", "Tech Networking",
      "Robotics Demo", "VR/AR Experience", "API Development", "Database Design Workshop"
    ],
    Travel: [
      "City Heritage Walk", "Photography Expedition", "Weekend Getaway Planning", "Travel Stories Night",
      "Backpacking Tips Session", "Local Sightseeing Tour", "Adventure Planning Meetup", "Cultural Exchange",
      "Budget Travel Workshop", "Travel Photography", "Camping Trip Planning", "Road Trip Meetup",
      "International Travel Tips", "Solo Travel Stories", "Group Trek Planning", "Travel Blogging",
      "Language Exchange", "Destination Research", "Travel Gear Review", "Nomad Lifestyle Talk"
    ]
  };

  // Generate 100 events
  const events = [];
  const activityTypeKeys = Object.keys(activityTypes);
  
  for (let i = 0; i < 100; i++) {
    // Pick random activity type and name
    const activityType = activityTypeKeys[Math.floor(Math.random() * activityTypeKeys.length)];
    const activityNames = activityTypes[activityType];
    const activityName = activityNames[Math.floor(Math.random() * activityNames.length)];
    
    // Pick random user as creator
    const creator = users[Math.floor(Math.random() * users.length)];
    
    // Generate random location around Bangalore
    const location = randomLocation();
    
    // Generate random date/time
    const { startsAt, endsAt } = randomDateTime();
    
    // Generate random capacity (5-50 people)
    const capacity = Math.floor(Math.random() * 46) + 5;
    
    // Random number of current participants (1 to 30% of capacity)
    const maxParticipants = Math.min(Math.floor(capacity * 0.3), users.length);
    const numParticipants = Math.floor(Math.random() * maxParticipants) + 1; // At least creator
    
    // Pick random participants including creator
    const participantSet = new Set([creator._id]);
    while (participantSet.size < numParticipants && participantSet.size < users.length) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      participantSet.add(randomUser._id);
    }
    
    const event = {
      name: `${activityName} #${i + 1}`,
      description: `Join us for an exciting ${activityType.toLowerCase()} session! ${getRandomDescription(activityType)}`,
      activityType,
      location,
      locationGeo: { 
        type: "Point", 
        coordinates: [location.lng, location.lat] 
      },
      startsAt,
      endsAt,
      createdBy: creator._id,
      participants: Array.from(participantSet),
      capacity,
      visibility: "public",
      status: "active"
    };
    
    events.push(event);
  }

  // Clear existing events to avoid duplicates
  await Event.deleteMany({});
  
  // Insert all events
  await Event.insertMany(events);
  
  console.log(`✅ Successfully created ${events.length} events!`);
  
  // Log statistics
  const stats = {};
  events.forEach(event => {
    stats[event.activityType] = (stats[event.activityType] || 0) + 1;
  });
  
  console.log("📊 Events by type:");
  Object.entries(stats).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} events`);
  });
  
  console.log(`📍 Location: Centered around Bangalore (12.9539456, 77.4661253)`);
  console.log(`📅 Time range: From now to 30 days ahead`);
  console.log(`👥 Capacity range: 5-50 people per event`);

  const createdEvents = await Event.find({})
    .populate("createdBy", "name")
    .limit(5);
  console.log("📋 Sample events created:");
  createdEvents.forEach((event) => {
    console.log(
      `   - ${event.name} by ${event.createdBy.name} at [${event.location.lat}, ${event.location.lng}]`
    );
  });
  
  await mongoose.disconnect();
  console.log("🔐 Database connection closed.");
}

// Helper function to generate activity-specific descriptions
function getRandomDescription(activityType) {
  const descriptions = {
    Sports: [
      "Perfect for beginners and pros alike! Bring your energy and let's play!",
      "Great workout session with like-minded fitness enthusiasts.",
      "Competitive yet fun environment. All skill levels welcome!",
      "Stay fit, make friends, and enjoy some healthy competition.",
      "Equipment provided. Just bring your enthusiasm!"
    ],
    Music: [
      "Bring your instruments or just come to enjoy the vibes!",
      "Whether you're a beginner or expert, music brings us together.",
      "Discover new sounds and collaborate with fellow musicians.",
      "Good music, great company, unforgettable experience.",
      "Express yourself through the universal language of music."
    ],
    Food: [
      "Delicious food and great company - what more could you want?",
      "Explore flavors, share recipes, and make foodie friends!",
      "From street food to gourmet - we celebrate all cuisines.",
      "Taste, learn, and discover your next favorite dish.",
      "Good food is best enjoyed with good people!"
    ],
    Tech: [
      "Join fellow tech enthusiasts for learning and networking.",
      "Share knowledge, build connections, and grow together.",
      "From beginners to experts - everyone has something to contribute.",
      "Stay updated with the latest in technology.",
      "Code, collaborate, and create amazing things together!"
    ],
    Travel: [
      "Adventure awaits! Join fellow wanderers and explorers.",
      "Share travel stories and plan your next great adventure.",
      "Discover hidden gems and local secrets with us.",
      "Travel is the only thing you buy that makes you richer.",
      "Explore, experience, and expand your horizons!"
    ]
  };
  
  const typeDescriptions = descriptions[activityType] || ["Join us for a great time!"];
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
}

run().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});