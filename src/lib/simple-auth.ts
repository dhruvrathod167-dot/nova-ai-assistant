// Simple in-memory user store for demo
const users = new Map<string, any>();

// Add demo user
users.set('user@novaai.com', {
  id: 1,
  email: 'user@novaai.com',
  password: 'user123',
  name: 'Demo User'
});

export function findUserByEmail(email: string) {
  return users.get(email);
}

export function createUser(email: string, password: string) {
  const user = {
    id: Date.now(),
    email,
    password,
    name: email.split('@')[0]
  };
  users.set(email, user);
  return user;
}

export function findUserById(id: number) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return null;
}