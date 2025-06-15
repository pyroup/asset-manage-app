import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules環境での__dirnameの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.NODE_ENV || 'development';

console.log(`🚀 Building configuration for ${environment} environment...`);

// 1. スキーマファイルの切り替え
const schemaFile = environment === 'production' ? 'schema.prod.prisma' : 'schema.dev.prisma';
const schemaSourcePath = path.join(__dirname, '..', 'prisma', schemaFile);
const schemaTargetPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log(`📄 Schema: ${schemaFile}`);

// スキーマファイルの存在確認
if (!fs.existsSync(schemaSourcePath)) {
  console.error(`❌ Schema file not found: ${schemaSourcePath}`);
  process.exit(1);
}

// 2. 環境変数ファイルの切り替え
const envFile = environment === 'production' ? '.env.production' : '.env.development';
const envSourcePath = path.join(__dirname, '..', envFile);
const envTargetPath = path.join(__dirname, '..', '.env');

console.log(`🔧 Environment: ${envFile}`);

// 環境変数ファイルの存在確認
if (!fs.existsSync(envSourcePath)) {
  console.error(`❌ Environment file not found: ${envSourcePath}`);
  process.exit(1);
}

try {
  // スキーマファイルをコピー
  fs.copyFileSync(schemaSourcePath, schemaTargetPath);
  console.log('✅ Schema file updated successfully!');

  // 環境変数ファイルをコピー
  fs.copyFileSync(envSourcePath, envTargetPath);
  console.log('✅ Environment variables updated successfully!');

  console.log(`🎉 Configuration updated for ${environment} environment!`);
} catch (error) {
  console.error('❌ Error updating configuration:', error.message);
  process.exit(1);
}