// Shared user store for authentication
export const mockUsers = [
  {
    id: 1,
    email: 'user@novaai.com',
    password: 'user123', // In production, this would be hashed
    name: 'Demo User'
  }
];

export const createdUsers = new Map<number, any>();

export function findUserById(id: number) {
  return mockUsers.find(u => u.id === id) || createdUsers.get(id);
}

export function createUser(email: string, password: string) {
  const newUser = {
    id: Date.now(), // Use timestamp for unique ID
    email,
    password, // In production, hash this password
    name: email.split('@')[0]
  };
  
  createdUsers.set(newUser.id, newUser);
  return newUser;
}