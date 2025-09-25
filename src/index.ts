import {App} from "./app";

 
const PORT = parseInt(process.env.PORT || '4000');

try {
console.log("Starting Traducteur Rapide server...");
const app = new App();

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});