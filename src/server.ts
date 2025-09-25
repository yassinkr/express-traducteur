import dotenv from "dotenv";
import App from "./app";

// Load env vars
dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);

async function startServer() {
  try {
    console.log("🚀 Bootstrapping Traducteur Rapide server...");

    const app = new App();
    app.listen(PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start server
startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("⚠️ SIGINT received, shutting down gracefully...");
  process.exit(0);
});
