import fs from 'fs';
import path from 'path';

const themePath = 'node_modules/.pnpm/@catppuccin+vscode@3.18.1/node_modules/@catppuccin/vscode/themes/mocha.json';
const content = fs.readFileSync(themePath, 'utf8');
const json = JSON.parse(content);

console.log('Keys:', Object.keys(json));
if (json.tokenColors) {
    console.log('First tokenColor:', JSON.stringify(json.tokenColors[0], null, 2));
    console.log('Type of scope:', typeof json.tokenColors[0].scope);
} else {
    console.log('tokenColors not found!');
}
