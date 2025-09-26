import { App } from "../app";
import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from "dotenv";

dotenv.config();

// Create the app instance once
const appInstance = new App();

// Export a handler function that Vercel can call
export default function handler(req: VercelRequest, res: VercelResponse) {
  return appInstance.app(req, res);
}