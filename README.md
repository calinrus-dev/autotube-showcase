# AutoTube · Showcase

Una mesa de producción para varios canales de YouTube. Proyecto de **Calin Rus**: interfaz React, app de escritorio Tauri y motor local con MCP. **Lo Que Te Pasa** es el primer espacio editorial configurado; el producto admite otros canales y criterios.

Este repositorio público contiene la demo interactiva de la interfaz y documentación seleccionada. El motor, el uploader y el empaquetado completos se mantienen en un repositorio privado. La demo no publica vídeos ni genera audio con proveedores.

![Mesa de producción](docs/images/mesa-produccion.png)

## Diseño y flujo

- Inventario de episodios separado por canal.
- Guion, descripción, etiquetas, fuentes y recursos del episodio.
- Criterio heredado por canal y tono ajustable por proyecto.
- Mesa de audio con una pista, guion y metadatos por idioma.
- Calendario de inventario ordenado y conexiones de producción.
- Interfaz oscura editorial, sin simular audios que todavía no existen.

La demo permite crear canales y episodios, editar/guardar y añadir idiomas. Los datos se guardan únicamente en `localStorage` del navegador. No importes datos sensibles ni claves en esta demo.

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

La versión privada incluye SQLite, revisiones, cola serial, OAuth por canal, subida reanudable, calendario `publishAt`, miniaturas, FFmpeg, exportación de recursos y MCP stdio. Proveedores de voz preparados: ElevenLabs, Qwen3-TTS y Chatterbox.

La integración de YouTube se ha probado con HTTP simulado, el render con FFmpeg real y MCP con cliente stdio real. No se han subido vídeos a una cuenta real ni evaluado acústicamente los modelos locales en esta entrega. El audio alternativo de un mismo vídeo requiere carga manual en Studio. Un proyecto de API sin auditoría puede limitar las subidas a privado.

## Documentación seleccionada

- [Producto y límites](docs/PRODUCTO.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Audio y alternativas locales](docs/AUDIO.md)
- [YouTube y programación](docs/YOUTUBE.md)
- [MCP y contexto editorial](docs/MCP.md)
- [Criterio de Lo Que Te Pasa](docs/EDITORIAL.md)
- [Evidencia de validación](docs/VALIDACION.md)

El showcase no incluye credenciales, estadísticas privadas de canales, guiones de producción ni el almacén del usuario. Código publicado para mostrar el trabajo; no se concede una licencia adicional de uso o redistribución.
