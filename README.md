# PitWall — F1 Fan Network

PWA comunitaria de automovilismo construida con HTML, CSS, JavaScript y Service Worker. No utiliza backend, chat remoto ni notificaciones push: el feed y las notificaciones son locales al dispositivo.

## Probar localmente

El Service Worker y la Notification API requieren un contexto seguro. Para probar la instalación y el modo offline, sirve esta carpeta con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

Después abre la URL que indique el servidor. No hace falta instalar dependencias del proyecto.

## Uso de la PWA

1. Selecciona una identidad del pitwall.
2. Pulsa «Compartir una lectura», escribe un mensaje y publícalo.
3. Los mensajes se guardan en `localStorage` y sobreviven a una recarga en el mismo navegador.
4. Usa la campana desde una interacción explícita para solicitar notificaciones locales. Si el navegador las acepta, cada nueva publicación usa `ServiceWorkerRegistration.showNotification` cuando está disponible.
5. Para comprobar offline, carga la aplicación una vez, activa el modo offline del navegador y recarga. La app shell debe continuar disponible.

## GitHub Pages

El proyecto está preparado para publicarse en una ruta como `/pitwall-pwa/`: las referencias usan rutas relativas, `start_url` y `scope` son `./`, y el Service Worker precachea la app shell relativa a su propia ubicación. Publica el contenido de esta carpeta como el contenido raíz del repositorio o de la carpeta configurada para Pages.

## Verificaciones realizadas

- Sintaxis de `app.js` comprobable con `node --check app.js`.
- Manifest, iconos, Service Worker y referencias relativas revisados estáticamente.
- No depende de un puerto local fijo para las notificaciones.
- No se ejecutaron navegadores, Playwright, Puppeteer ni pruebas visuales automatizadas.
