# Validación de la entrega

Entrega inicial: 4 de octubre de 2026. Showcase actualizado: 8 de octubre de 2026. La evidencia del motor privado se distingue de las comprobaciones de esta demo. Entorno de la aplicación: Linux, motor Python 3.12, React 19, Tauri 2.

## Comprobado

- Build TypeScript + Vite.
- Contrato de pistas y perfil editorial con Vitest.
- Tests Python: conflictos de revisión, herencia editorial, autenticación local, ausencia de tool de borrado, permisos del almacén, DST, lote de calendario atómico y bloqueo de edición.
- Uploader con HTTP simulado: privado por defecto, subida por rango, recuperación de sesión sin POST duplicado, creación incierta, identidad errónea y rechazo de URL ajena a Google.
- Render FFmpeg real: MP4 H.264 1920×1080 con pista AAC; inspección con ffprobe.
- Exportación de proyecto sin tokens ni credenciales.
- Cliente MCP stdio real frente al motor vivo: initialize, tools, inventory y contexto editorial.
- `cargo check` del puente Tauri/Rust y build release Linux con paquetes `.deb` y AppImage.
- Motor empaquetado con PyInstaller: arranque real, healthcheck y snapshot autenticado.
- Interacción de navegador: guardar y recargar guion, persistir segunda pista, crear canal independiente, separar su inventario y aplicar tono por episodio.
- Inspección visual de escritorio/móvil: sin errores ni desbordamiento, sin incidencias graves en el análisis automático de accesibilidad inicial.

- Rediseño 0.2: inventario desplegable y búsqueda; texto/toma en paralelo; guardado antes de cambiar de canal; importación de WAV decodificado con duración real; previsualizaciones cancelables y orden de idiomas estable.

- Versión 0.2.1: tema rosa oscuro, icono actualizado y comprobación visual en escritorio y móvil.

## Pendiente de conexión o hardware

- Consentimiento OAuth de la app y subida real a YouTube.
- Programación efectiva después de procesamiento/auditoría y restricciones de la cuenta.
- Generación facturable ElevenLabs.
- Instalación y validación de Chatterbox; comparación acústica controlada entre proveedores.
- Clientes MCP externos concretos y cualquier conexión cloud.
- Builds nativos macOS/Windows y prueba interactiva del escritorio empaquetado.

La demo utiliza contenido ficticio y almacenamiento local de navegador. Los tests no borraron ni modificaron vídeos del canal del usuario.

## Interfaz 0.3

Vista de lectura, historial de tomas, recuperación de descartadas, elección de audio y mesa de vídeo. Las fuentes están incluidas. La demo permite importar y revisar medios; la síntesis local y el montaje corresponden a la aplicación privada. No se publica el inventario del usuario ni su configuración local.

## Editor local y texto 0.3

Build/Vitest de la demo aprobados. En la implementación privada pasan 18 pruebas Python y 3 Vitest. Se han verificado streaming de Ollama, detención sin sustituir el guion, versiones recuperables, aprobación de muestras, intro/cierre por canal y un bucle real que cubre la narración. El motor empaquetado genera texto y voz y exporta MP4; la comprobación interactiva nativa sigue pendiente. No se publican datos de producción ni configuración privada.

## Demo pública 0.4.2 · 8 de octubre de 2026

- Interfaz sincronizada con la cinta de herramientas, fases y estados del episodio, Solo audio y acciones fijas de la aplicación local.
- `npm ci` y `npm run verify`: build TypeScript/Vite y **7 pruebas Vitest aprobadas**. Las pruebas comprueban, entre otros casos, que una muestra no se trate como toma completa, que un guion cambiado exija revisar el audio y que los trabajos se atribuyan al idioma correcto.
- Navegador a **1440×900** y **390×844**: sin desbordamiento horizontal ni vertical de la página en las vistas de Guion y Voz inspeccionadas. Los documentos y listas conservan su desplazamiento interno. Guardar, Pasar a voz y Generar propuesta permanecen dentro de la vista de escritorio.
- Interacción comprobada: cambiar entre Solo audio y Vídeo, editar/guardar/recargar el guion, importar un WAV sintético, elegir la toma, descartarla y alternar los paneles móviles Guion y voz / Escuchar y guardar. No se han conectado cuentas ni utilizado proveedores de generación.
- El botón Guardar audio inicia la descarga desde el recurso importado. El navegador integrado no confirmó el evento ni el archivo descargado; queda pendiente comprobar ese resultado en un navegador con descarga de archivos.
- Capturas actuales de la demo con datos ficticios: resumen de producción, guion y vista móvil. El código de la demo no activa el modo de conexión al motor local mediante una variable de entorno.

La documentación de origen de la aplicación privada 0.4.2 registra generación real de texto y voz, exportación FFmpeg, 21 pruebas Python y 4 pruebas Rust. Esos controles no se ejecutan en este repositorio: aquí no se publica el motor ni el empaquetado nativo. La subida a una cuenta real de YouTube y la inspección visual nativa siguen pendientes.
