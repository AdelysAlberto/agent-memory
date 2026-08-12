#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const brainDir = path.join(process.env.HOME, '.gemini', 'antigravity-ide', 'brain');

function countTokensInLogs() {
  if (!fs.existsSync(brainDir)) {
    console.error('No se encontró el directorio de logs de Antigravity.');
    return;
  }

  const dirs = fs.readdirSync(brainDir);
  let latestFile = null;
  let latestMtime = 0;

  dirs.forEach(d => {
    const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logFile)) {
      const stat = fs.statSync(logFile);
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = logFile;
      }
    }
  });

  if (!latestFile) {
    console.error('No se encontraron conversaciones activas.');
    return;
  }

  const content = fs.readFileSync(latestFile, 'utf8').trim().split('\n');
  let totalChars = 0;
  let totalSteps = 0;

  content.forEach(line => {
    try {
      const data = JSON.parse(line);
      totalSteps++;
      if (data.content) {
        totalChars += typeof data.content === 'string' ? data.content.length : JSON.stringify(data.content).length;
      }
    } catch (e) {}
  });

  const estimatedTokens = Math.round(totalChars / 4);
  console.log(`\n📊 --- Muestreo de Consumo de Tokens (Antigravity Chat Activo) ---`);
  console.log(`💬 Iteraciones / Pasos en la Sesión: ${totalSteps}`);
  console.log(`🔤 Caracteres Totales Procesados:   ${totalChars.toLocaleString()} caracteres`);
  console.log(`🧠 Tokens de Contexto Acumulados:   ~${estimatedTokens.toLocaleString()} tokens`);
  console.log(`----------------------------------------------------------------\n`);
}

countTokensInLogs();
