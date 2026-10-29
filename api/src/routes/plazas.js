import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { adminAuth } from '../middleware/adminAuth.js';

export const plazasRouter = Router();

const ESTADOS = ['libre', 'ocupado', 'reservado', 'sin_datos'];

// GET /api/plazas?nivel_id=1
// Publico. Plazas con su posicion en el plano y estado actual. Sin nivel_id
// devuelve las de todos los niveles, que es lo que pide el frontend.
plazasRouter.get('/', async (req, res, next) => {
  try {
    const nivelId = Number(req.query.nivel_id);
    let query = supabase
      .from('plazas')
      .select('id, nivel_id, codigo, x, y, ancho, alto, tipo, estado, autorizacion, actualizado_en');

    if (nivelId) query = query.eq('nivel_id', nivelId);

    const { data, error } = await query.order('codigo', { ascending: true });
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/plazas/:id
// Administracion. Cambio manual de estado (ej: el operador marca una plaza
// como fuera de servicio, o corrige un error del sensor a mano).
//
// El cambio de estado NO se escribe directo sobre "plazas": pasa por
// registrar_evento(), que inserta la fila en "eventos" y actualiza la plaza en
// una sola transaccion. Es la regla del README 4.4 —el backend escribe el
// evento y despues actualiza el estado— y es lo que mantiene el historial
// completo: una correccion manual del operador tiene que quedar registrada
// igual que una lectura del sensor.
plazasRouter.patch('/:id', adminAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'id tiene que ser un entero' });
    }

    // Validar contra la lista aca y no dejar que reviente el enum: sin esto un
    // estado mal escrito sale como 500 y parece un problema del servidor.
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({
        error: `estado tiene que ser uno de: ${ESTADOS.join(', ')}`,
      });
    }

    const { data, error } = await supabase.rpc('registrar_evento', {
      p_plaza_id: id,
      p_estado: estado,
      p_fuente: 'manual',
    });

    if (error) {
      // registrar_evento() levanta una excepcion propia cuando la plaza no
      // existe. Es un 404, no un 500: el pedido esta bien formado.
      if (/no existe/i.test(error.message ?? '')) {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});
