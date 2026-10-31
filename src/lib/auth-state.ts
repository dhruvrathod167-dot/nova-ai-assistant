// Simple shared state for demo authentication
// This will work within the same deployment instance

const registeredUsers = new Set<string>();

export function addUser(email: string, password: string) {
  registeredUsers.add(`${email}:${password}`);
}

export function findUser(email: string, password: string) {
  return registeredUsers.has(`${email}:${password}`);
}

export function getRegisteredUsers() {
  return Array.from(registeredUsers);
}