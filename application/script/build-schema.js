import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules環境での__dirnameの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.NODE_ENV || 'development';
const schemaFile = environment === 'production' ? 'schema.prod.prisma' : 'schema.dev.prisma';
const sourcePath = path.join(__dirname, '..', 'prisma', schemaFile);
const targetPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log(`Building schema for ${environment} environment...`);
console.log(`Source file: ${schemaFile}`);
console.log(`Source path: ${sourcePath}`);
console.log(`Target path: ${targetPath}`);

// ファイルの存在確認
if (!fs.existsSync(sourcePath)) {
  console.error(`Error: Source schema file not found: ${sourcePath}`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourcePath, targetPath);
  console.log('✅ Schema file updated successfully!');
  console.log(`✅ Using ${environment} configuration`);
} catch (error) {
  console.error('❌ Error copying schema file:', error.message);
  process.exit(1);
}