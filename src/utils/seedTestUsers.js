/**
 * Seed test users into Firestore - used by Settings "Add demo profiles" and npm run seed
 */
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Drew', 'Blake', 'Cameron', 'Skyler', 'Parker', 'Reese',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Sebastian',
  'Emily', 'Jack', 'Elizabeth', 'Aiden', 'Sofia', 'Owen', 'Daniel',
  'Ella', 'Matthew', 'Scarlett', 'Joseph', 'Grace', 'David', 'Chloe',
  'Carter', 'Victoria', 'Wyatt', 'John', 'Aria', 'Dylan', 'Lily',
  'Luke', 'Aurora', 'Grayson', 'Zoey', 'Isaac', 'Penelope', 'Jayden',
  'Layla', 'Theodore', 'Nora', 'Gabriel', 'Camila', 'Anthony', 'Hannah',
  'Derek', 'Lillian', 'Leo', 'Addison', 'Lincoln', 'Eleanor', 'Jaxon',
  'Natalie', 'Asher', 'Luna', 'Christopher', 'Savannah', 'Maya', 'Ezra',
];

const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Data Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Psychology', 'Economics', 'Business Administration', 'Finance',
  'Marketing', 'Political Science', 'History', 'English', 'Philosophy',
  'Neuroscience', 'Environmental Science', 'Statistics', 'Architecture',
  'Art & Design', 'Communications', 'Sociology', 'Nursing', 'Pre-Med',
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const COURSES_POOL = [
  'CS 101', 'CS 201', 'MATH 241', 'MATH 341', 'PHYS 101', 'CHEM 101',
  'ECON 101', 'PSYC 101', 'ENGL 101', 'HIST 101', 'BIO 101', 'STAT 400',
  'ECE 211', 'ME 200', 'DATA 301', 'MATH 415', 'CS 225', 'PHIL 101',
];
const EMOJIS = ['👤', '👩', '👨', '🧑', '👩‍💻', '👨‍🔬', '👩‍🎓', '👨‍🎓', '🧑‍💻', '🧑‍🔬'];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seedTestUsers(count = 50) {
  for (let i = 0; i < count; i++) {
    const id = `test-user-${String(i + 1).padStart(3, '0')}`;
    const name = NAMES[i % NAMES.length];
    const suffix = i >= NAMES.length ? ` ${(i % 15) + 1}` : '';
    const major = MAJORS[i % MAJORS.length];
    const year = YEARS[i % YEARS.length];
    const courses = pickRandom(COURSES_POOL, 4 + (i % 3));
    const emoji = EMOJIS[i % EMOJIS.length];
    await setDoc(doc(db, 'users', id), {
      id,
      name: `${name}${suffix}`.trim(),
      major,
      year,
      courses,
      emoji,
      avatarUrl: `https://picsum.photos/seed/${id}/400/500`,
      points: Math.floor(Math.random() * 500),
      streak: Math.floor(Math.random() * 14),
      swipesRemaining: 5,
      matches: [],
      liked: [],
      isPremium: Math.random() > 0.9,
      createdAt: new Date().toISOString(),
    });
  }
}
