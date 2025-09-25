import dotenv from "dotenv";
import App from "./app";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);

// Create App instance
const appInstance = new App();

// Export app & logger for tests
export const app = appInstance.app;
export const logger = console;

// Only start server if this file is executed directly
if (require.main === module) {
  try {
    console.log("🚀 Bootstrapping Traducteur Rapide server...");
    appInstance.listen(PORT);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("⚠️ SIGTERM received, shutting down gracefully...");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("⚠️ SIGINT received, shutting down gracefully...");
    process.exit(0);
  });
}
