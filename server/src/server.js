import app from './app.js';
import { config, prisma } from './config/index.js';

const server = app.listen(config.port, () => console.log(`Unique Designs API running on :${config.port}`));
const stop = async () => { server.close(); await prisma.$disconnect(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
