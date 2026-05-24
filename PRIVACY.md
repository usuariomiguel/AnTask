# Política de Privacidad de antask

_Última actualización: mayo de 2026_

---

## 1. Responsable del tratamiento

**Antask**
**Email de contacto:** ansonfull@gmail.com

---

## 2. Qué datos tratamos y por qué

antask es una aplicación **local-first**: la gran mayoría de tus datos nunca salen de tu dispositivo.

### 2.1 Modo local (sin cuenta)

| Dato | Dónde se guarda | Finalidad | Base legal |
|---|---|---|---|
| Tareas, proyectos, notas, etiquetas | `localStorage` de tu navegador, en tu dispositivo | Funcionamiento de la app | Ejecución del servicio (Art. 6.1.b RGPD) |
| Preferencias de tema y notificaciones | `localStorage` de tu navegador | Personalización | Interés legítimo (Art. 6.1.f RGPD) |

En este modo **no se envía ningún dato a servidores externos**.

### 2.2 Modo sincronizado (Google Sign-In, opcional)

Si decides activar la sincronización con Google:

| Dato | Dónde se guarda | Finalidad | Base legal |
|---|---|---|---|
| Email y nombre de tu cuenta Google | Firebase Authentication (Google LLC) | Identificación y autenticación | Consentimiento (Art. 6.1.a RGPD) |
| Tareas, proyectos, notas | Firebase Firestore (Google LLC) | Sincronización entre dispositivos | Consentimiento (Art. 6.1.a RGPD) |

La sincronización es **completamente voluntaria**. Puedes revocar tu consentimiento en cualquier momento desconectando tu cuenta desde el menú de perfil → "Desconectar".

### 2.3 Datos que NO recogemos

- No usamos cookies de seguimiento ni analítica de terceros.
- No vendemos ni cedemos datos a terceros con fines publicitarios.
- No recogemos datos de comportamiento, clics ni patrones de uso.

---

## 3. Transferencias internacionales

Firebase Authentication y Firestore son servicios de Google LLC, empresa con sede en EE.UU. Las transferencias se amparan en las **Cláusulas Contractuales Tipo** (CCT) aprobadas por la Comisión Europea. Más información: [Google Cloud Privacy](https://cloud.google.com/privacy).

Si resides en la UE y activas la sincronización, consientes esta transferencia.

---

## 4. Cuánto tiempo conservamos los datos

- **Datos locales:** permanecen en tu dispositivo hasta que los eliminas manualmente o limpias el almacenamiento del navegador.
- **Datos en Firebase (si usas sync):** se conservan mientras tengas cuenta activa. Al desconectar tu cuenta desde la app, los datos permanecen en Firestore hasta que los elimines o solicites su supresión (ver sección 5).

---

## 5. Tus derechos (RGPD y LOPDGDD)

Puedes ejercer en cualquier momento los siguientes derechos escribiendo a **ansonfull@gmail.com**:

- **Acceso:** obtener confirmación de si tratamos tus datos y recibir una copia.
- **Rectificación:** corregir datos inexactos.
- **Supresión ("derecho al olvido"):** solicitar la eliminación de tus datos de Firebase.
- **Portabilidad:** exportar tus datos en formato JSON desde la propia app (Perfil → Exportar workspace).
- **Oposición / Limitación:** oponerte a determinados tratamientos o solicitar su limitación.
- **Retirada del consentimiento:** desconectar la cuenta en cualquier momento sin que ello afecte al uso local de la app.

Si consideras que el tratamiento no es conforme al RGPD, tienes derecho a presentar una reclamación ante la **Agencia Española de Protección de Datos (AEPD)**: [www.aepd.es](https://www.aepd.es).

---

## 6. Seguridad

Aplicamos medidas técnicas razonables para proteger tus datos:

- Las comunicaciones con Firebase se realizan sobre HTTPS/TLS.
- Las reglas de Firestore garantizan que solo tú puedes leer y escribir tus propios datos.
- Los datos locales están protegidos por los mecanismos de sandboxing del navegador.

---

## 7. Servicios de terceros

| Servicio | Proveedor | Propósito | Política |
|---|---|---|---|
| Firebase Auth + Firestore | Google LLC | Autenticación y sync (opt-in) | [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy) |
| Google Fonts | Google LLC | Tipografía (Inter) | [policies.google.com/privacy](https://policies.google.com/privacy) |

Google Fonts carga la fuente Inter desde servidores de Google. Esto implica que tu IP puede ser registrada por Google al acceder a la app. Para evitarlo, puedes usar la app sin conexión después del primer acceso (PWA instalada).

---

## 8. Cambios en esta política

Cualquier cambio material será comunicado actualizando la fecha al inicio de este documento y, si disponemos de tu email, mediante notificación directa.

---

## 9. Contacto

Para cualquier consulta sobre privacidad: **ansonfull@gmail.com**
