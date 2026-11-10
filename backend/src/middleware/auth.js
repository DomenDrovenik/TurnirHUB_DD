const prisma = require('../lib/prisma');
const { COOKIE_NAME, verifyToken } = require('../lib/token');

// Preveri JWT iz piškotka, uporabnika naloži iz baze in zavrne blokirane račune.
async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Potrebna je prijava' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Seja je potekla ali je neveljavna' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return res.status(401).json({ error: 'Seja je potekla ali je neveljavna' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: 'Vaš račun je blokiran' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
  next();
}

// Uporabi za requireAuth: requireRole('ORGANIZER', 'ADMIN')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nimate dovoljenja za to dejanje' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
