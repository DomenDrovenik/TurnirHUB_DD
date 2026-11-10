const prisma = require('../lib/prisma');
const { COOKIE_NAME, verifyToken } = require('../lib/token');

// Prebere uporabnika iz JWT piškotka. Vrne { user } ali { error: { status, message } }.
async function readUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return { error: { status: 401, message: 'Potrebna je prijava' } };
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { error: { status: 401, message: 'Seja je potekla ali je neveljavna' } };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return { error: { status: 401, message: 'Seja je potekla ali je neveljavna' } };
  }
  if (user.isBlocked) {
    return { error: { status: 403, message: 'Vaš račun je blokiran' } };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  };
}

// Preveri JWT iz piškotka, uporabnika naloži iz baze in zavrne blokirane račune.
async function requireAuth(req, res, next) {
  const { user, error } = await readUser(req);
  if (error) {
    return res.status(error.status).json({ error: error.message });
  }
  req.user = user;
  next();
}

// Kot requireAuth, a anonimnega uporabnika spusti naprej (req.user ostane nedefiniran).
async function optionalAuth(req, res, next) {
  const { user } = await readUser(req);
  if (user) {
    req.user = user;
  }
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

module.exports = { requireAuth, optionalAuth, requireRole };
