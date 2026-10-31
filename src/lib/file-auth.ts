import fs from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'users.json');

// Initialize with default user
const defaultUsers = {
  'user@novaai.com': {
    id: 1,
    email: 'user@novaai.com',
    password: 'user123',
    name: 'Demo User'
  }
};

export async function findUserByEmail(email: string) {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data);
    return users[email];
  } catch (error) {
    // If file doesn't exist or is empty, return default user
    return defaultUsers[email];
  }
}

export async function createUser(email: string, password: string) {
  try {
    // Read existing users
    let users = {};
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      users = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with default users
      users = defaultUsers;
    }

    // Check if user already exists
    if (users[email]) {
      throw new Error('User already exists');
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      email,
      password,
      name: email.split('@')[0]
    };

    // Add user to users object
    users[email] = newUser;

    // Write updated users back to file
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function findUserById(id: number) {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data);
    
    for (const user of Object.values(users)) {
      if (user.id === id) return user;
    }
    return null;
  } catch (error) {
    // Check default users
    for (const user of Object.values(defaultUsers)) {
      if (user.id === id) return user;
    }
    return null;
  }
}