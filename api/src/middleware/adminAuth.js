// Protege los endpoints de administracion (panel para el operador del
// parking). El frontend, despues de que el usuario inicia sesion con
// Supabase Auth, manda su JWT en:  Authorization: Bearer <access_token>
// Este middleware valida ese token contra Supabase y exige ademas que el
// correo de la cuenta este en ADMIN_EMAILS.
//
// Una sesion valida sola no alcanza: la anon key esta publicada en el
// frontend, y si el registro de Supabase queda abierto cualquiera podria
// crearse una cuenta y entrar al panel. Sin ADMIN_EMAILS no entra nadie.
import { supabase } from '../lib/supabase.js';

const ADMINS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean)
);

if (ADMINS.size === 0) {
  console.warn('ADMIN_EMAILS esta vacio: todos los endpoints de administracion van a responder 403.');
}

export async function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Falta el header Authorization: Bearer <access_token>' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Sesion invalida o vencida' });
  }

  if (!ADMINS.has(data.user.email?.toLowerCase())) {
    return res.status(403).json({ error: 'Esta cuenta no tiene permiso de administracion' });
  }

  req.user = data.user;
  next();
}
