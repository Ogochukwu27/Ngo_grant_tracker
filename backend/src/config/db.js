// backend/src/config/db.js

// Import the PrismaClient class from the installed '@prisma/client' package.
const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient.
// In Node.js, we want to maintain a single (singleton) database connection pool.
// If we created a new PrismaClient in every controller file, our application
// would open too many database connections, eventually crashing the server.
const prisma = new PrismaClient({
  // Setting the log levels allows us to see the actual SQL queries running in the terminal.
  // This is highly educational for learning how Prisma translates JavaScript into SQL!
  log: ['query', 'info', 'warn', 'error'],
});

// Export the prisma client instance so it can be imported in our controllers.
module.exports = prisma;
