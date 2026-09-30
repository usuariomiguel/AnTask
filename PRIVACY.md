# Política de Privacidad de AnTrack

_Última actualización: septiembre de 2026_

---

## 1. Responsable del tratamiento

**AnTrack**
**Email de contacto:** migueangelcantos@gmail.com

---

## 2. Qué datos tratamos y por qué

AnTrack es una aplicación **local-first**: la gran mayoría de tus datos nunca salen de tu dispositivo.

### 2.1 Modo local (sin cuenta)

| Dato | Dónde se guarda | Finalidad | Base legal |
|---|---|---|---|
| Tareas, proyectos, notas, etiquetas | `localStorage` de tu navegador, en tu dispositivo | Funcionamiento de la app | Ejecución del servicio (Art. 6.1.b RGPD) |
| Preferencias de tema y notificaciones | `localStorage` de tu navegador | Personalización | Interés legítimo (Art. 6.1.f RGPD) |

En este modo tus tareas y el resto de tu contenido **no se envían a ningún servidor**. Lo único que sale es la estadística anónima de visitas descrita en el apartado 2.3, que puedes desactivar.

### 2.2 Modo sincronizado (Google Sign-In, opcional)

Si decides activar la sincronización con Google:

| Dato | Dónde se guarda | Finalidad | Base legal |
|---|---|---|---|
| Email y nombre de tu cuenta Google | Firebase Authentication (Google LLC) | Identificación y autenticación | Consentimiento (Art. 6.1.a RGPD) |
| Tareas, proyectos, notas | Firebase Firestore (Google LLC) | Sincronización entre dispositivos | Consentimiento (Art. 6.1.a RGPD) |

La sincronización es **completamente voluntaria**. Puedes revocar tu consentimiento en cualquier momento desconectando tu cuenta desde el menú de perfil → "Desconectar".

### 2.3 Estadística anónima de visitas (Vercel Web Analytics)

Para saber cuánta gente usa AnTrack y desde qué tipo de dispositivo, la app envía a Vercel Web Analytics un aviso por cada vista de página. Está **activada por defecto** y puedes desactivarla en cualquier momento.

| Qué se registra | Qué no se registra |
|---|---|
| Página vista, página de procedencia (referrer), país, tipo de dispositivo, sistema operativo y navegador | Tus tareas, notas, proyectos, hábitos, nombre o email |
| Un identificador de visitante que Vercel calcula a partir de la petición y **cambia cada día** | Tu dirección IP completa (no se guarda) |

- **Sin cookies:** no se guarda ni se lee nada en tu dispositivo para esta medición, por lo que no requiere el aviso de cookies de la LSSI. El identificador diario no permite seguirte de un día a otro ni entre sitios web.
- **Base legal:** interés legítimo (Art. 6.1.f RGPD) en conocer el uso agregado de la app para mantenerla y mejorarla, con el mínimo de datos posible.
- **Cómo desactivarla:** Ajustes → Datos → «Analítica anónima». La elección se guarda en tu dispositivo y se respeta en las siguientes visitas. Si tu navegador envía la señal **Global Privacy Control**, la analítica no se activa salvo que la actives tú.
- **Proveedor:** Vercel Inc. (EE. UU.), que actúa como encargado del tratamiento. Más información: [vercel.com/docs/analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy).

### 2.4 Datos que NO recogemos

- No usamos cookies de seguimiento ni publicitarias.
- No vendemos ni cedemos datos a terceros con fines publicitarios.
- No registramos clics, pulsaciones de teclas ni el contenido que escribes.

---

## 3. Transferencias internacionales

Firebase Authentication y Firestore son servicios de Google LLC, empresa con sede en EE.UU. Las transferencias se amparan en las **Cláusulas Contractuales Tipo** (CCT) aprobadas por la Comisión Europea. Más información: [Google Cloud Privacy](https://cloud.google.com/privacy).

Si resides en la UE y activas la sincronización, consientes esta transferencia.

Vercel Inc. (hosting y estadística anónima, apartado 2.3) también tiene sede en EE. UU.; sus transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. y en las Cláusulas Contractuales Tipo.

---

## 4. Cuánto tiempo conservamos los datos

- **Datos locales:** permanecen en tu dispositivo hasta que los eliminas manualmente o limpias el almacenamiento del navegador.
- **Estadística anónima:** Vercel solo guarda cifras agregadas; el identificador de visitante se descarta cada día.
- **Datos en Firebase (si usas sync):** se conservan mientras tengas cuenta activa. Al desconectar tu cuenta desde la app, los datos permanecen en Firestore hasta que los elimines o solicites su supresión (ver sección 5).

---

## 5. Tus derechos (RGPD y LOPDGDD)

Puedes ejercer en cualquier momento los siguientes derechos escribiendo a **migueangelcantos@gmail.com**:

- **Acceso:** obtener confirmación de si tratamos tus datos y recibir una copia.
- **Rectificación:** corregir datos inexactos.
- **Supresión ("derecho al olvido"):** solicitar la eliminación de tus datos de Firebase.
- **Portabilidad:** exportar tus datos en formato JSON desde la propia app (Perfil → Exportar workspace).
- **Oposición / Limitación:** oponerte a determinados tratamientos o solicitar su limitación. Para la estadística anónima basta con desactivarla en Ajustes → Datos.
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
| Vercel Web Analytics | Vercel Inc. | Estadística anónima de visitas, sin cookies (activada por defecto, desactivable) | [vercel.com/docs/analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy) |

Las tipografías (Inter, JetBrains Mono) y los iconos (Lucide) se sirven **self-hosted** desde nuestro propio dominio. Aparte de la estadística anónima (que puedes desactivar) y de Firebase si decides iniciar sesión, **no se realiza ninguna petición a servidores de terceros**.

---

## 8. Cambios en esta política

Cualquier cambio material será comunicado actualizando la fecha al inicio de este documento y, si disponemos de tu email, mediante notificación directa.

---

## 9. Contacto

Para cualquier consulta sobre privacidad: **migueangelcantos@gmail.com**
