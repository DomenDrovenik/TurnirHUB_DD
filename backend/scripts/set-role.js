// Dodeli vlogo uporabniku (do administracije v aplikaciji, glej US-14).
// Uporaba: npm run set-role -- ana@test.si ORGANIZER
const prisma = require('../src/lib/prisma');

const ROLES = ['PLAYER', 'ORGANIZER', 'ADMIN'];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role)) {
    console.error(`Uporaba: npm run set-role -- <e-pošta> <${ROLES.join('|')}>`);
    process.exit(1);
  }
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role },
    });
    console.log(`Uporabnik ${user.email} ima zdaj vlogo ${user.role}.`);
  } catch (err) {
    if (err.code === 'P2025') {
      console.error(`Uporabnik ${email} ne obstaja.`);
      process.exit(1);
    }
    throw err;
  }
}

main().finally(() => prisma.$disconnect());
