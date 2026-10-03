# YouTube: conexión, subida y calendario

## Configuración

1. Crea un proyecto de Google Cloud y habilita YouTube Data API v3.
2. Configura la pantalla de consentimiento y usuarios de prueba si la aplicación está en testing.
3. Crea un cliente OAuth **Desktop app** y descarga su JSON.
4. En AutoTube, selecciona el canal y abre Conexiones → Conectar con archivo OAuth.
5. Elige la identidad/canal de YouTube correcta en el navegador. El motor valida el ID si ya había uno configurado.

Scopes solicitados: `youtube.upload` y `youtube.force-ssl`, necesarios para subir y consultar el contenido del canal conectado. Los refresh tokens se guardan por ID interno de canal en el llavero.

Si una app externa está en modo de prueba, el consentimiento y los tokens están sujetos a las reglas de Google. No confundas verificación del usuario, de AdSense y auditoría de la aplicación: son procedimientos distintos.

## Subidas

Siempre comienzan como privadas. Una fecha futura con zona horaria añade `status.publishAt`. La API exige que el vídeo sea privado y no haya sido publicado antes. AutoTube rechaza fechas vencidas, para evitar que una fecha pasada cause publicación inmediata.

El uploader crea una sesión reanudable, guarda su URL antes de enviar bytes y usa bloques de 8 MiB. Tras un error se puede consultar la sesión y continuar desde el rango confirmado por Google. Una sesión completada devuelve el vídeo existente; no se inicia otra automáticamente. Una sesión expirada o creación incierta necesita inspección en Studio.

Antes de crear la sesión se persiste `creation_pending`. Si el proceso falla entre la solicitud y el guardado de la URL, reintentar se bloquea: podría existir una subida remota. Después de recibir el ID se persiste el resultado antes de enviar la miniatura. Si la miniatura falla, el vídeo conserva su ID y aparece como pendiente de carga manual; no se duplica el vídeo.

Los proyectos que ya terminaron una subida no pueden volver a subir automáticamente. Duplica el proyecto para una versión nueva deliberada.

## Calendario

La subida empieza en cuanto la cola se ejecuta. YouTube, no el reloj de la aplicación, publica en la fecha fijada. Deja margen para subida y procesamiento. El ordenador puede apagarse después de que termine la subida y YouTube acepte la programación; conviene verificar en Studio tanto el procesamiento como la fecha.

La versión actual registra la solicitud y la respuesta del upload, pero todavía no realiza una comprobación posterior de procesamiento y programación efectiva. Una app no auditada puede devolver una subida privada sin permitir la publicación prevista. Comprueba Studio antes de confiar en un calendario de producción.

## Idiomas

La API carga título y descripción localizados desde las pistas con título informado. Los audios alternativos se exportan en el paquete ZIP y se añaden en Studio → Idiomas/Doblaje, si el canal dispone de esa función. Deben tener duración compatible con el vídeo original.

Montar una pista secundaria produce un MP4 separado. Para subirlo como vídeo independiente, duplica el proyecto, cambia el idioma principal, título/descripción y selecciona ese MP4 desde el almacén/exportación. No cambia automáticamente el audio del vídeo principal.

## Límites de la cuenta

La cuota depende del proyecto de Google Cloud y de las reglas vigentes; no se prometen subidas ilimitadas. La documentación de `videos.insert` señala que proyectos de API no verificados creados después del 28 de julio de 2020 quedan restringidos a privado hasta pasar auditoría.

Fuentes oficiales consultadas el 3 de octubre de 2026:

- [Inserción de vídeos](https://developers.google.com/youtube/v3/docs/videos/insert).
- [Subida reanudable](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol).
- [Recurso video y publishAt](https://developers.google.com/youtube/v3/docs/videos#status.publishAt).
- [Audio e idiomas en Studio](https://support.google.com/youtube/answer/13338784?hl=en).
