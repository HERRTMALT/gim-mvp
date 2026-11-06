import { hashPassword } from '../src/server/modules/auth/password';

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run hash-password -- "tu-contraseña"');
  process.exit(1);
}

console.log('\nCopiá esta línea en tu .env (reemplazando OWNER_PASSWORD):\n');
console.log(`OWNER_PASSWORD_HASH=${hashPassword(password)}`);
console.log('\nDespués eliminá OWNER_PASSWORD del .env y reiniciá el servidor.\n');
