import { supabase, observarLatido } from './supabase.js';

/**
 * Capa de datos.
 *
 * Todo el resto del frontend pide los datos por aca y nunca hace fetch por su
 * cuenta: el plano y el panel no tienen que saber de donde salen los datos ni
 * como llegan.
 */

export const API = {
  /**
   * La URL de la API se resuelve en el navegador y no en un archivo de
   * configuracion porque este frontend no tiene build: no hay paso de
   * compilacion donde inyectar una variable de entorno.
   *
   * Servida desde localhost, la pagina pega contra la API local; servida desde
   * cualquier otro dominio, contra la hosteada. Asi el mismo archivo sirve para
   * desarrollo y para produccion sin tener que acordarse de cambiarlo antes de
   * cada push.
   *
   * Va como getter y no como constante para que los `${this.URL_BASE}/...` del
   * resto del objeto sigan funcionando sin tocarse.
   */
  get URL_BASE() {
    // Las IP privadas cuentan como local. Abriendo la pagina desde la URL de
    // red (192.168.x.x) caia a la rama hosteada y la API de produccion le
    // rechazaba el pedido por CORS, que solo admite el dominio de Netlify.
    const host = location.hostname;
    const segundoOcteto = Number(host.split('.')[1]);

    const local = host === 'localhost'
      || host === '127.0.0.1'
      || host.startsWith('192.168.')
      || host.startsWith('10.')
      || (host.startsWith('172.') && segundoOcteto >= 16 && segundoOcteto <= 31);

    return local
      ? 'http://localhost:3000/api'
      : 'https://connectalab.onrender.com/api';
  },

  /**
   * Niveles del estacionamiento, con las dimensiones del plano.
   * ancho_plano y alto_plano definen el sistema de coordenadas dentro del cual
   * se posicionan las plazas: son el viewBox del SVG.
   *
   * La API ya los devuelve ordenados por 'orden' —de la planta baja hacia
   * abajo—, que es como se listan en el selector de niveles.
   */
  async obtenerNiveles() {
    return this._pedir(`${this.URL_BASE}/niveles`);
  },

  /**
   * Todas las plazas del estacionamiento, agrupadas por nivel_id.
   *
   * Un solo pedido para todos los niveles en vez de uno por nivel: el plano y
   * el panel necesitan siempre las plazas de TODOS los niveles, y pedirlas de
   * a una era un viaje de red por piso para traer la misma tabla en partes.
   */
  async obtenerPlazasPorNivel() {
    const plazas = await this._pedir(`${this.URL_BASE}/plazas`);
    const porNivel = new Map();

    for (const plaza of plazas) {
      if (!porNivel.has(plaza.nivel_id)) porNivel.set(plaza.nivel_id, []);
      porNivel.get(plaza.nivel_id).push(plaza);
    }

    return porNivel;
  },

  /** Cambia el estado de una plaza. Requiere sesion de administrador. */
  async cambiarEstado(plazaId, estado, token) {
    return this._enviar('PATCH', `${this.URL_BASE}/plazas/${plazaId}`, token, { estado });
  },

  /**
   * Crea un piso con sus plazas.
   *
   * Viaja la intencion, no la geometria: las coordenadas las calcula la API.
   * Si este metodo mandara x e y, cualquier otro cliente tendria que saber
   * dibujar un parking.
   */
  async crearNivel({ nombre, cantidad, porFila }, token) {
    return this._enviar('POST', `${this.URL_BASE}/niveles`, token, {
      nombre,
      cantidad,
      por_fila: porFila
    });
  },

  /** Borra un piso. La API rechaza con 409 si tiene historial. */
  async borrarNivel(nivelId, token) {
    return this._enviar('DELETE', `${this.URL_BASE}/niveles/${nivelId}`, token);
  },

  /**
   * Bandeja de alertas pendientes de revision.
   *
   * Va por la API y NO por Supabase directo, aunque el panel ya tenga cliente
   * de Supabase abierto. El motivo esta en db/politicas.sql: alertas tiene RLS
   * habilitado y ninguna politica, asi que la anon key del navegador no ve una
   * sola fila. Quien las lee es Express con la service_role, despues de
   * comprobar la sesion con adminAuth.
   */
  async obtenerAlertas(token) {
    return this._enviar('GET', `${this.URL_BASE}/alertas`, token);
  },

  /** Marca una alerta como revisada. El backend registra QUIEN la reviso. */
  async marcarAlertaRevisada(alertaId, token) {
    return this._enviar('PATCH', `${this.URL_BASE}/alertas/${alertaId}`, token, {});
  },

  /**
   * Avisa cada vez que cambia una plaza en la base.
   *
   * Escuchamos la TABLA, no la API. Cualquier cosa que toque plazas dispara el
   * evento: el panel, un update a mano en el editor SQL, o el sensor. Si
   * escucharamos el endpoint, un cambio que no pasara por Express seria
   * invisible.
   *
   *   alCambiar(plaza)  una plaza cambio: llega la fila entera, ya actualizada
   *   alReconectar()    el canal volvio despues de una caida: hay que releer todo
   *   alEstado(estado)  para mostrar el indicador de conexion
   *
   * Devuelve una funcion para cortar la suscripcion.
   */
  suscribirsePlazas({ alCambiar, alReconectar, alEstado = () => {} }) {
    // El primer SUBSCRIBED es la apertura normal del canal y no hay nada que
    // resincronizar: el plano acaba de cargar los datos. Del segundo en
    // adelante es una REconexion, y ahi si.
    let abiertoAntes = false;

    const canal = supabase
      .channel('plazas-en-vivo')   // cualquier nombre menos 'realtime'
      .on(
        'postgres_changes',
        // Solo UPDATE. Una plaza nueva o borrada es un cambio de la planta
        // fisica del parking, no algo que ocurra mientras alguien mira el
        // plano: para eso alcanza con recargar la pagina.
        { event: 'UPDATE', schema: 'public', table: 'plazas' },
        (mensaje) => alCambiar(mensaje.new)
      )
      .subscribe((estado) => {
        alEstado(estado);
        if (estado !== 'SUBSCRIBED') return;

        // Realtime no guarda historial: los cambios que ocurrieron mientras el
        // socket estuvo caido NO se reenvian al reconectar. Sin esta relectura
        // el plano se queda mostrando el estado del momento del corte y no hay
        // forma de que se entere.
        if (abiertoAntes) alReconectar();
        abiertoAntes = true;
      });

    // --- deteccion de caida --------------------------------------------
    //
    // El estado del canal NO alcanza. Si la maquina se queda sin internet pero
    // la interfaz de red sigue arriba, nadie cierra el socket: no llega ningun
    // FIN, el navegador lo sigue considerando abierto y subscribe() nunca se
    // entera. El indicador queda en verde mintiendo.
    //
    // Un indicador de conexion tiene que exigir senal de vida activa, no
    // conformarse con que nadie le haya avisado lo contrario.

    // 1. El navegador avisa al instante cuando se cae la interfaz de red. Es la
    //    capa mas rapida y la menos confiable: navigator.onLine mira si hay red,
    //    no si hay internet. Con el router prendido y el proveedor caido dice
    //    que si.
    const alPerderRed = () => alEstado('SIN_RED');
    const alVolverRed = () => alEstado('CONECTANDO');

    window.addEventListener('offline', alPerderRed);
    window.addEventListener('online', alVolverRed);

    // 2. El latido es la senal de vida de verdad, y la unica que detecta el caso
    //    "hay WiFi pero no hay internet": el mensaje sale y no vuelve nunca.
    //    Se exige ademas que el canal siga unido, porque un socket vivo con el
    //    canal caido tampoco esta recibiendo cambios.
    observarLatido((latido) => {
      if (latido === 'ok' && canal.state === 'joined') alEstado('SUBSCRIBED');
      if (latido === 'timeout' || latido === 'error')  alEstado('CHANNEL_ERROR');
    });

    return () => {
      window.removeEventListener('offline', alPerderRed);
      window.removeEventListener('online', alVolverRed);
      observarLatido(() => {});
      supabase.removeChannel(canal);
    };
  },

  // --- interno ---------------------------------------------------------

  /** Peticion autenticada. La comparten todos los endpoints de administracion. */
  async _enviar(metodo, url, token, cuerpo = null) {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        // Sin cuerpo no va Content-Type: un DELETE con Content-Type y sin body
        // hace que algunos proxies y middlewares intenten parsear la nada.
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => ({}));
      throw new Error(detalle.error ?? `HTTP ${respuesta.status}`);
    }

    // 204 No Content no trae cuerpo, y pedirle .json() a una respuesta vacia
    // lanza un error de parseo que se leeria como un fallo del borrado que en
    // realidad si funciono.
    return respuesta.status === 204 ? null : respuesta.json();
  },

  async _pedir(url) {
    const respuesta = await fetch(url);

    // fetch NO lanza excepcion con un 404 o un 500: solo falla si la red se
    // cae. Hay que revisar .ok a mano o los errores del servidor pasan
    // silenciosamente como si fueran datos.
    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    return respuesta.json();
  }
};
