import 'dotenv/config';
import { createApp } from './app';
import './config/db'; // establishes all 4 connections

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});