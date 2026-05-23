import { createServer } from "http";
import { networkInterfaces } from "os";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { setupSocketHandlers } from "./src/server/socket-handlers";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket", "polling"],
  });

  setupSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
    if (hostname === "0.0.0.0") {
      for (const entries of Object.values(networkInterfaces())) {
        for (const net of entries ?? []) {
          if (net.family === "IPv4" && !net.internal) {
            console.log(`> On your phone (same Wi‑Fi): http://${net.address}:${port}/join`);
          }
        }
      }
    }
  });
});
