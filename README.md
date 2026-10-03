# AutoTube · Showcase

Una mesa de producción para varios canales de YouTube. Proyecto de **Calin Rus**: interfaz React, app de escritorio Tauri y motor local con MCP. **Lo Que Te Pasa** es el primer espacio editorial configurado; el producto admite otros canales y criterios.

Este repositorio público contiene la demo interactiva de la interfaz y documentación seleccionada. El motor, el uploader y el empaquetado completos se mantienen en un repositorio privado. La demo no publica vídeos ni genera audio con proveedores.

![Mesa de producción](docs/images/mesa-produccion.png)

## Diseño y flujo

El editor 0.3 organiza Guion, Voz y tomas, Montaje, Publicación y Criterio. La cabecera es compacta, el inventario se despliega con búsqueda y cada herramienta muestra sus controles. Mantiene el tema rosa oscuro, con iconos y paneles que se adaptan a escritorio y móvil.

- Guion con escritura, lectura y versiones que se revisan antes de aplicar.
- Historial de audios por idioma: filtros de muestras/completas, elección y descarte reversible.
- Montaje con herramientas, visor y secuencia de intro, contenido y cierre.
- Foto o vídeo en bucle como fondo, separado de la miniatura de YouTube.
- Identidad y criterio por canal, con ajustes por episodio.
- Inventario, calendario y preparación de publicación.

La demo permite crear canales/episodios, editar y guardar, añadir idiomas e importar medios. Usa `localStorage`; la generación de texto/voz y la exportación corresponden a la aplicación privada. No importes datos sensibles ni claves en esta demo.

## Probar

```bash
npm ci
npm run dev
```

Abre http://127.0.0.1:1420.

```bash
npm run verify
```

## Implementación de escritorio

La versión privada incluye SQLite, revisiones, cola serial, OAuth por canal, subida reanudable, calendario `publishAt`, miniaturas, FFmpeg, exportación de recursos y MCP stdio. Generación de texto con Ollama; voz local con Qwen3-TTS y adaptadores opcionales de ElevenLabs/Chatterbox.

La integración de YouTube se ha probado con HTTP simulado, el render con FFmpeg real y MCP con cliente stdio real. Se han generado texto y voz locales y exportado una secuencia real con el motor empaquetado. No se han subido vídeos a una cuenta real ni realizado una comparación acústica controlada. El audio alternativo de un mismo vídeo requiere carga manual en Studio. Un proyecto de API sin auditoría puede limitar las subidas a privado.

## Documentación seleccionada

- [Editor local: guion, revisión y montaje](docs/EDITOR.md)
- [Producto y límites](docs/PRODUCTO.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Audio y alternativas locales](docs/AUDIO.md)
- [YouTube y programación](docs/YOUTUBE.md)
- [MCP y contexto editorial](docs/MCP.md)
- [Criterio de Lo Que Te Pasa](docs/EDITORIAL.md)
- [Evidencia de validación](docs/VALIDACION.md)

El showcase no incluye credenciales, estadísticas privadas de canales, guiones de producción ni el almacén del usuario. Código publicado para mostrar el trabajo; no se concede una licencia adicional de uso o redistribución.
