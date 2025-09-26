import { App } from "../app";
import dotenv from "dotenv";

dotenv.config();

const appInstance = new App();

// Export a default function that Vercel can call
export default function handler(req: any, res: any) {
  return appInstance.app(req, res);
}
