# Validación de la entrega

Fecha: 3 de octubre de 2026. Entorno: Linux, motor Python 3.12, React 19, Tauri 2.

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

## Pendiente de conexión o hardware

- Consentimiento OAuth de la app y subida real a YouTube.
- Programación efectiva después de procesamiento/auditoría y restricciones de la cuenta.
- Generación facturable ElevenLabs.
- Instalación y descarga de los modelos Qwen/Chatterbox, generación y comparación auditiva.
- Clientes MCP externos concretos y cualquier conexión cloud.
- Builds nativos macOS/Windows y prueba interactiva del escritorio empaquetado.

La demo utiliza contenido ficticio y almacenamiento local de navegador. Los tests no borraron ni modificaron vídeos del canal del usuario.
