/**
 * Seed script: creates many test users in Firestore for the swipe deck.
 * Run: node scripts/seedTestUsers.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

// Load .env manually for Node
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}
loadEnv();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Drew', 'Blake', 'Cameron', 'Skyler', 'Parker', 'Reese',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Sebastian',
  'Emily', 'Jack', 'Elizabeth', 'Aiden', 'Sofia', 'Owen', 'Avery',
  'Daniel', 'Ella', 'Matthew', 'Scarlett', 'Joseph', 'Grace', 'David',
  'Chloe', 'Carter', 'Victoria', 'Wyatt', 'Riley', 'John', 'Aria',
  'Dylan', 'Lily', 'Luke', 'Aurora', 'Grayson', 'Zoey', 'Isaac',
  'Penelope', 'Jayden', 'Layla', 'Theodore', 'Nora', 'Gabriel', 'Camila',
  'Anthony', 'Hannah', 'Derek', 'Lillian', 'Leo', 'Addison', 'Lincoln',
  'Eleanor', 'Jaxon', 'Natalie', 'Asher', 'Luna', 'Christopher', 'Savannah',
  'Josiah', 'Audrey', 'Andrew', 'Claire', 'Theo', 'Stella', 'Joshua',
  'Maya', 'Ezra', 'Hazel', 'Levi', 'Violet', 'Samuel', 'Aaliyah', 'Oscar',
];

const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Biomedical Engineering', 'Data Science',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology',
  'Economics', 'Business Administration', 'Finance', 'Accounting',
  'Marketing', 'Political Science', 'History', 'English', 'Philosophy',
  'Neuroscience', 'Environmental Science', 'Statistics', 'Architecture',
  'Art & Design', 'Communications', 'Sociology', 'Nursing', 'Pre-Med',
  'Aerospace Engineering', 'Chemical Engineering', 'Industrial Engineering',
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const COURSES_POOL = [
  'CS 101', 'CS 201', 'CS 301', 'MATH 241', 'MATH 341', 'PHYS 101', 'CHEM 101',
  'ECON 101', 'PSYC 101', 'ENGL 101', 'HIST 101', 'BIO 101', 'STAT 400',
  'ECE 211', 'ME 200', 'CEE 201', 'BME 301', 'DATA 301', 'MATH 415',
  'CS 225', 'CS 374', 'PHIL 101', 'SOC 100', 'ART 101', 'MUS 101',
];
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#9B59B6'];
const EMOJIS = ['👤', '👩', '👨', '🧑', '👩‍💻', '👨‍🔬', '👩‍🎓', '👨‍🎓', '🧑‍💻', '🧑‍🔬', '👩‍🔬', '👨‍💼', '👩‍💼', '🧑‍🎨', '👩‍🚀', '👨‍🚀'];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed(count = 80) {
  console.log(`Seeding ${count} test users...`);
  for (let i = 0; i < count; i++) {
    const id = `test-user-${String(i + 1).padStart(3, '0')}`;
    const nameIdx = i % NAMES.length;
    const name = NAMES[nameIdx];
    const suffix = i >= NAMES.length ? ` ${(i % 20) + 1}` : '';
    const major = MAJORS[i % MAJORS.length];
    const year = YEARS[i % YEARS.length];
    const courses = pickRandom(COURSES_POOL, 4 + (i % 3));
    const color = COLORS[i % COLORS.length];
    const emoji = EMOJIS[i % EMOJIS.length];
    await setDoc(doc(db, 'users', id), {
      id,
      name: `${name}${suffix}`.trim(),
      major,
      year,
      courses,
      emoji: emoji,
      avatarUrl: `https://picsum.photos/seed/${id}/400/500`,
      points: Math.floor(Math.random() * 500),
      streak: Math.floor(Math.random() * 14),
      swipesRemaining: 5,
      matches: [],
      liked: [],
      isPremium: Math.random() > 0.9,
      createdAt: new Date().toISOString(),
    });
    if ((i + 1) % 20 === 0) console.log(`  Created ${i + 1}/${count}`);
  }
  console.log('Done!');
  process.exit(0);
}

seed(80).catch((err) => {
  console.error(err);
  process.exit(1);
});
