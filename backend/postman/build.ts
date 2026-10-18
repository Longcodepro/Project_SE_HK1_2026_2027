import * as fs from 'fs';
import * as path from 'path';
import { buildCollection, buildEnvironment } from './lib/collection';
import { FOLDERS } from './cases';

const out = __dirname;
fs.writeFileSync(path.join(out, 'BrewLite.postman_collection.json'), JSON.stringify(buildCollection(FOLDERS), null, 2) + '\n');
fs.writeFileSync(path.join(out, 'BrewLite.postman_environment.json'), JSON.stringify(buildEnvironment(), null, 2) + '\n');
console.log(`Đã sinh collection: ${FOLDERS.length} folder, ${FOLDERS.reduce((s, f) => s + f.cases.length, 0)} case`);
