const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const {
  COOKIE_NAME,
  TOKEN_TTL_SECONDS,
  cookieOptions,
  signToken,
} = require('../lib/token');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Za primerjavo, ko uporabnik ne obstaja (da je odzivni čas podoben).
const DUMMY_HASH = bcrypt.hashSync('neobstojece-geslo', BCRYPT_ROUNDS);

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

router.post('/register', async (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const displayName = asString(req.body?.displayName);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const fields = {};
  if (!EMAIL_RE.test(email)) {
    fields.email = 'Vnesite veljaven e-poštni naslov';
  }
  if (!displayName) {
    fields.displayName = 'Vnesite prikazno ime';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fields.password = `Geslo mora imeti vsaj ${MIN_PASSWORD_LENGTH} znakov`;
  }
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Neveljavni podatki', fields });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // Vloga je vedno PLAYER (privzeta vrednost); ADMIN/ORGANIZER dodeli administrator.
    const user = await prisma.user.create({
      data: { email, displayName, passwordHash },
    });
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'E-poštni naslov je že v uporabi',
        fields: { email: 'E-poštni naslov je že v uporabi' },
      });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Enako sporočilo za napačno e-pošto in napačno geslo (ne razkrije, kateri podatek je napačen).
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Napačna e-pošta ali geslo' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: 'Vaš račun je blokiran' });
  }

  res.cookie(COOKIE_NAME, signToken(user), {
    ...cookieOptions,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
  return res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ message: 'Odjava uspešna' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
