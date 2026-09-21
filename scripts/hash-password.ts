import bcrypt from 'bcryptjs';

const passwordToHash = process.argv[2] || 'admin123';

const saltRounds = 10;
const hash = bcrypt.hashSync(passwordToHash, saltRounds);

console.log('========================================================');
console.log('       HARDWARE SHOP — ADMIN PASSWORD HASH GENERATOR     ');
console.log('========================================================');
console.log(`Input Password : "${passwordToHash}"`);
console.log(`Bcrypt Hash    : ${hash}`);
console.log('--------------------------------------------------------');
console.log('Copy the line below into your .env.local file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('========================================================');
