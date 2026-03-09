const app = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/database");
const { ensureSuperAdmin } = require("./services/bootstrap.service");

const MAX_PORT_ATTEMPTS = 20;

const connectDatabase = async () => {
  await prisma.$connect();
  await ensureSuperAdmin();
};

const listenWithFallback = async (startPort) => {
  let port = Number(startPort) || 4000;

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, () => resolve(listener));
      listener.on("error", (error) => reject(error));
    }).catch((error) => {
      if (error?.code === "EADDRINUSE") {
        console.warn(`Port ${port} is already in use. Retrying on ${port + 1}...`);
        port += 1;
        return null;
      }
      throw error;
    });

    if (server) return { server, port };
  }

  throw new Error(`No available port found between ${startPort} and ${port}`);
};

const registerShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

const start = async () => {
  try {
    await connectDatabase();
    const { server, port } = await listenWithFallback(env.PORT);
    console.log(`TaskHive backend listening on port ${port}`);
    registerShutdown(server);
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
};

start();
