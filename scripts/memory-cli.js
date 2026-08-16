#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { initDb, saveMemory, searchMemories, listMemories } = require('./db');

const args = process.argv.slice(2);
const command = args[0];

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

function detectProjectName() {
  const explicitProject = getArgValue('--project') || process.env.PROJECT_NAME;
  if (explicitProject) return explicitProject;

  const cwd = process.cwd();
  
  // Try package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) return pkg.name;
    } catch (e) {}
  }

  // Fallback to directory basename
  return path.basename(cwd) || 'default_project';
}

async function handleOnboard(project) {
  const cwd = process.cwd();
  let summary = '';
  
  const readmePath = path.join(cwd, 'README.md');
  const pkgPath = path.join(cwd, 'package.json');

  if (fs.existsSync(readmePath)) {
    const readmeText = fs.readFileSync(readmePath, 'utf8');
    const firstLines = readmeText.split('\n').slice(0, 25).join(' ').replace(/\s+/g, ' ');
    summary = `[README Summary] ${firstLines.substring(0, 300)}...`;
  } else if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      summary = `Proyecto Node.js: ${pkg.name || project} v${pkg.version || '1.0.0'}. Descripción: ${pkg.description || 'N/A'}`;
    } catch (e) {}
  }

  if (!summary) {
    summary = `Inicialización de proyecto en la carpeta ${project}`;
  }

  await initDb();
  const result = await saveMemory(
    project,
    `Onboarding Inicial del Proyecto: ${project}`,
    summary,
    'project-onboarding',
    'onboarding,architecture,overview'
  );
  console.log(`[agents-memory] Onboarding completado [ID: ${result.id}] para proyecto: ${project}`);
  console.log(`💾 Memoria Guardada: [${project}] "Onboarding Inicial del Proyecto" (Tags: #onboarding, #architecture, #overview)`);
}

async function main() {
  const project = detectProjectName();

  switch (command) {
    case 'init':
      try {
        const dbPath = await initDb();
        console.log(`[agents-memory] Base de datos inicializada con éxito en: ${dbPath}`);
      } catch (err) {
        console.error('[agents-memory] Error inicializando BD:', err.message);
        process.exit(1);
      }
      break;

    case 'onboard':
      try {
        await handleOnboard(project);
      } catch (err) {
        console.error('[agents-memory] Error ejecutando onboarding:', err.message);
        process.exit(1);
      }
      break;

    case 'save':
      const title = getArgValue('--title');
      const summary = getArgValue('--summary');
      const category = getArgValue('--category') || 'general';
      const tags = getArgValue('--tags') || '';

      if (!title || !summary) {
        console.error('Uso: node scripts/memory-cli.js save --title "..." --summary "..." [--project "..."] [--category "..."] [--tags "..."]');
        process.exit(1);
      }

      try {
        await initDb();
        const result = await saveMemory(project, title, summary, category, tags);
        console.log(`[agents-memory] Firma de memoria guardada [ID: ${result.id}] para proyecto: ${project}`);
        console.log(`💾 Memoria Guardada: [${project}] "${title}" (Tags: ${tags.split(',').map(t => '#' + t.trim()).join(', ')})`);
      } catch (err) {
        console.error('[agents-memory] Error guardando memoria:', err.message);
        process.exit(1);
      }
      break;

    case 'search':
      const query = getArgValue('--query') || args[1];
      if (!query) {
        console.error('Uso: node scripts/memory-cli.js search --query "..." [--project "..."]');
        process.exit(1);
      }

      try {
        await initDb();
        const results = await searchMemories(project, query);
        console.log(JSON.stringify(results, null, 2));
      } catch (err) {
        console.error('[agents-memory] Error buscando memorias:', err.message);
        process.exit(1);
      }
      break;

    case 'list':
      try {
        await initDb();
        const results = await listMemories(project);
        console.log(JSON.stringify(results, null, 2));
      } catch (err) {
        console.error('[agents-memory] Error listando memorias:', err.message);
        process.exit(1);
      }
      break;

    case 'ui':
      try {
        const { startServer } = require('./server');
        startServer(true);
      } catch (err) {
        console.error('[agent-memory] Error iniciando la interfaz de usuario:', err.message);
        process.exit(1);
      }
      break;

    case 'update':
      try {
        const { execSync } = require('child_process');
        const repoDir = path.join(__dirname, '..');
        console.log('🔄 Verificando actualizaciones en el repositorio remoto...');
        
        execSync('git fetch --tags --quiet', { cwd: repoDir, encoding: 'utf8' });
        let latestTag = '';
        try {
          latestTag = execSync('git tag -l --sort=-v:refname', { cwd: repoDir, encoding: 'utf8' }).trim().split('\n')[0];
        } catch (e) {}

        if (latestTag) {
          console.log(`📌 Actualizando a la versión estable: ${latestTag}`);
          execSync(`git checkout ${latestTag} --quiet`, { cwd: repoDir, encoding: 'utf8' });
        } else {
          console.log('🔄 Obteniendo cambios de la rama remota...');
          execSync('git pull --quiet', { cwd: repoDir, encoding: 'utf8' });
        }

        console.log('📦 Actualizando dependencias...');
        execSync('npm install --quiet', { cwd: repoDir, encoding: 'utf8' });
        
        await initDb();
        console.log('🗄️ Base de datos verificada y migrada si aplicaba.');
        
        // Re-sincronizar skill en instalados
        const installScript = path.join(repoDir, 'install.sh');
        if (fs.existsSync(installScript)) {
          console.log('🤖 Re-sincronizando skills de agentes...');
          execSync(`bash "${installScript}" --update-silent`, { cwd: repoDir, encoding: 'utf8' });
        }
        
        console.log('✅ ¡agent-memory ha sido actualizado con éxito!');
      } catch (err) {
        console.error('[agent-memory] Error durante la actualización:', err.message);
        process.exit(1);
      }
      break;

    case 'uninstall':
      try {
        const { execSync } = require('child_process');
        const repoDir = path.join(__dirname, '..');
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        const purge = args.includes('--purge');

        console.log('🗑️ Desinstalando agent-memory y removiendo skills de IA...');

        const skillPaths = [
          path.join(homeDir, '.gemini', 'config', 'skills', 'agent-memory'),
          path.join(homeDir, '.cursor', 'skills', 'agent-memory'),
          path.join(homeDir, '.config', 'opencode', 'skills', 'agent-memory'),
          path.join(homeDir, '.agents', 'skills', 'agent-memory'),
          path.join(homeDir, '.copilot', 'skills', 'agent-memory'),
          path.join(homeDir, '.hermes', 'skills', 'agent-memory')
        ];

        skillPaths.forEach(sp => {
          if (fs.existsSync(sp)) {
            fs.rmSync(sp, { recursive: true, force: true });
            console.log(`  -> Removido: ${sp}`);
          }
        });

        console.log('🔗 Desvinculando ejecutable binario npm...');
        try {
          execSync('npm unlink --quiet 2>/dev/null || npm unlink --location=global --quiet 2>/dev/null', { cwd: repoDir, stdio: 'ignore' });
        } catch (e) {}

        const globalDataDir = path.join(homeDir, '.agent-memory');
        if (fs.existsSync(globalDataDir)) {
          if (purge) {
            fs.rmSync(globalDataDir, { recursive: true, force: true });
            console.log(`🧹 Datos y base de datos SQLite eliminados (${globalDataDir}).`);
          } else {
            console.log(`ℹ️ La base de datos en ${globalDataDir} se ha conservado (usa 'agent-memory uninstall --purge' para borrarla).`);
          }
        }

        console.log('✅ ¡agent-memory ha sido desinstalado exitosamente!');
      } catch (err) {
        console.error('[agent-memory] Error durante la desinstalación:', err.message);
        process.exit(1);
      }
      break;

    default:
      console.log(`
🧠 agent-memory CLI (Proyecto Autodetectado: ${project})

Comandos Disponibles:
  agent-memory search --query "..." [--project "..."]   Buscar memorias por término o tag
  agent-memory save --title "..." --summary "..."       Guardar una firma semántica
  agent-memory onboard                                  Sintetizar onboarding del proyecto actual
  agent-memory list [--project "..."]                   Listar últimas memorias registradas
  agent-memory ui                                       Abrir Dashboard visual en navegador
  agent-memory update                                   Actualizar a la última versión desde Git
  agent-memory uninstall [--purge]                      Desinstalar habilidades y desvincular binario
  agent-memory init                                     Inicializar esquema SQLite
      `);
      break;
  }
}

main();
