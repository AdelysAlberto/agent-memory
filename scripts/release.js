const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const releaseType = process.argv[2] || 'patch';

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  let [major, minor, patch] = parts;

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Versión actual inválida: ${currentVersion}`);
  }

  if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else {
    // Default to patch
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function runRelease() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('❌ Error: package.json no encontrado.');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version || '1.0.0';
  const newVersion = bumpVersion(currentVersion, releaseType);
  const tag = `v${newVersion}`;

  console.log(`🚀 Iniciando release (${releaseType}): v${currentVersion} ➔ ${tag}`);

  try {
    // 1. Actualizar package.json
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`📝 Actualizada versión en package.json a ${newVersion}`);

    // 2. Commit del cambio de versión
    console.log('📌 Realizando commit de release...');
    execSync('git add package.json', { stdio: 'inherit' });
    execSync(`git commit -m "chore(release): ${tag}"`, { stdio: 'inherit' });

    // 3. Crear Tag de Git
    console.log(`🏷️ Creando tag de Git: ${tag}...`);
    execSync(`git tag -a "${tag}" -m "Release ${tag}"`, { stdio: 'inherit' });

    // 4. Push a repositorio remoto y tags
    console.log('📤 Enviando commits y tags a remoto...');
    execSync('git push origin HEAD --tags', { stdio: 'inherit' });

    console.log(`\n✅ ¡Release ${tag} completado y publicado exitosamente!`);
  } catch (error) {
    console.error(`\n❌ Error durante el release de ${tag}:`, error.message);
    process.exit(1);
  }
}

runRelease();
