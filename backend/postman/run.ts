import { FOLDERS } from './cases';
import { runFolders } from './lib/runner';

// Dùng: npm run postman:run -- --only=auth --base=http://localhost:3001
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

runFolders(FOLDERS, { base: arg('base') ?? process.env.BASE_URL ?? 'http://localhost:3001', only: arg('only') }).then((ok) => process.exit(ok ? 0 : 1));
