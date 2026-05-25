import * as fs from 'fs';
import * as path from 'path';

function getTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function generateJSDoc(name: string, kind: 'function' | 'class'): string {
  const description = kind === 'function' ? `Performs ${name} operation.` : `Represents ${name} entity.`;
  return `/**\n * ${description}\n */`;
}

function processFile(content: string): string {
  let withoutComments = content.replace(/\/\/.*$/gm, '');
  withoutComments = withoutComments.replace(/\/\*[\s\S]*?\*\//g, '');

  const lines = withoutComments.split('\n');
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(/export\s+function\s+(\w+)\s*\(/);
    const classMatch = line.match(/export\s+class\s+(\w+)/);
    if (funcMatch) {
      const name = funcMatch[1];
      result.push(generateJSDoc(name, 'function'));
    } else if (classMatch) {
      const name = classMatch[1];
      result.push(generateJSDoc(name, 'class'));
    }
    result.push(line);
  }
  return result.join('\n');
}

function main() {
  const baseDir = path.resolve(__dirname, '..');
  const dirsToScan = ['src', 'config', 'utils', 'middlewares', 'services', 'validations'];
  for (const sub of dirsToScan) {
    const fullDir = path.join(baseDir, sub);
    if (!fs.existsSync(fullDir)) continue;
    const files = getTsFiles(fullDir);
    for (const file of files) {
      const original = fs.readFileSync(file, 'utf8');
      const updated = processFile(original);
      if (updated !== original) {
        fs.writeFileSync(file, updated, 'utf8');
        console.log(`Updated comments in ${file}`);
      }
    }
  }
}

main();
