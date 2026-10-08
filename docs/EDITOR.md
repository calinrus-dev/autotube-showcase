# Editor local de episodios

## Distribución

La interfaz **0.4.2** organiza el episodio con una cinta: **Resumen**, **Guion**, **Voz**, **Montaje** y **Publicación**. Los estados indican qué está preparado, en cola o requiere revisión. **Solo audio** reduce el recorrido a Guion y Voz. El criterio sigue disponible desde el control del episodio.

Guardar y las acciones de cada herramienta permanecen visibles; se desplazan los documentos, las listas y los inspectores. Archivo, inventario y actividad se abren sobre el espacio de trabajo. En ventanas estrechas, Voz alterna entre **Guion y voz** y **Escuchar y guardar**. Conexiones separa Voces e IA, YouTube y MCP. El tema sigue siendo rosa oscuro.

Este documento describe también funciones de la aplicación privada. La demo pública conserva edición, revisión de medios importados y almacenamiento en navegador; no incorpora el motor, los modelos ni la conexión de publicación.

## Guion y texto local

**Escribir** edita el texto de la pista activa; **Leer** presenta el guion sin campos. El panel de IA permite crear, reescribir o preparar un esquema. Usa Ollama en `127.0.0.1:11434`, con un modelo descargado. Preparación inicial:

```bash
bash scripts/setup-local-text.sh
```

Ollama debe estar instalado. El script descarga `qwen3.5:4b` en el directorio de modelos de AutoTube si inicia el servidor. Un Ollama que ya está abierto se reutiliza y conserva su directorio. La app no descarga modelos ni llama a un proveedor de texto remoto. Lista solo modelos locales con pesos, excluye los identificados como cloud y arranca Ollama si hace falta, con `OLLAMA_NO_CLOUD=1`. La generación usa `keep_alive=0` para liberar memoria antes de la voz. El servidor iniciado por AutoTube se termina al cerrar su motor; en Linux `setpriv --pdeathsig TERM` cubre un cierre abrupto cuando está disponible.

La barra de guion es indeterminada porque no se conoce el momento exacto en que terminará el texto. Indica carga/escritura y fragmentos recibidos; el límite de tokens es un máximo, no un porcentaje de avance. Se muestran las palabras a medida que llegan. **Detener** corta la recepción; el guion original se conserva. Un resultado que alcanza el límite se identifica para que lo revises.

Las propuestas terminadas aparecen en **Versiones**. Puedes leerlas, usarlas, descartarlas y recuperarlas. Usar una conserva el texto anterior como versión manual. Una propuesta nunca sustituye el guion sin elegirla. Se aplica el criterio editorial del canal y sus excepciones por episodio. Las fuentes se pasan como referencias; el modelo no las consulta ni garantiza su veracidad.

## Voz y muestras

Cada idioma conserva su historial. Los filtros muestran todas las tomas, solo muestras o solo completas. Selecciona una para reproducir su archivo y leer el texto asociado. **Esta voz sí** aprueba los ajustes de una muestra para la siguiente generación; no convierte el fragmento en una narración completa. **Usar esta toma** elige el audio completo para el montaje. Descartar es reversible. Cambiar el texto advierte que las tomas anteriores necesitan revisión.

**Guardar audio** o **Guardar muestra** conserva el archivo por separado, sin montaje ni YouTube. En escritorio se copia a la carpeta de exportaciones de AutoTube; en la demo se descarga un recurso importado. **Guardar vídeo** hace lo mismo con un vídeo existente. Reabrir Voz muestra la toma elegida.

La generación de voz indica carga del modelo, avance, muestra/toma e idioma y tiempo transcurrido. Los modelos Qwen preparados generan sin Internet. VoiceDesign interpreta instrucciones de voz; CustomVoice 0.6B usa la voz Ryan. El worker es serial para evitar competir por memoria con la generación de texto.

## Montaje

El visor central reproduce la exportación, los clips del canal o el contenido con la narración elegida. La línea de tiempo tiene tres bloques seleccionables: **Intro → Contenido → Cierre**, y una pista de voz. No es un editor de cortes libres: la duración del contenido la determina la narración.

- **Recursos:** importar foto o vídeo, seleccionar recursos existentes. El fondo es independiente de la miniatura de YouTube.
- **Diseño:** fondo de título, título + foto, foto completa o vídeo en bucle; orientación horizontal/vertical y paleta. Título/subtítulo se aplican a las composiciones de texto, no al vídeo en bucle ni a la foto completa.
- **Identidad:** intro y cierre por canal, con reproductores. Puedes desactivarlos por episodio. Cambiar los clips invalida las exportaciones del canal y se bloquea mientras sus trabajos están activos.
- **Exportar:** MP4 H.264/AAC, 25 fps, 1920×1080 o 1080×1920; reproductor del resultado e importación de vídeo terminado.

El bucle se repite hasta cubrir la voz y descarta su sonido original. Intro/cierre mantienen su audio; si no tienen pista de sonido, se añade silencio. Todos los segmentos se normalizan al mismo tamaño y códecs antes de concatenarlos. El encuadre de clips llena la orientación elegida, recortando bordes cuando hace falta. No se añaden transiciones, escenas autónomas ni subtítulos automáticos.

## Contrato de datos y MCP

`Channel.branding = {intro_id, outro_id}` referencia recursos de tipo video. `Project.video_theme` incluye `background_id`, `layout`, `format`, `palette`, `heading`, `subtitle`, `intro_enabled` y `outro_enabled`. Los proyectos anteriores conservan su miniatura como fondo compatible si todavía no tienen `background_id`.

`Project.script_drafts` conserva propuestas por idioma y estado. `Track.preferred_sample_id` identifica la muestra aprobada, separado de `audio_id`, que sigue siendo la narración completa.

MCP comparte estos contratos con el escritorio: `generate_script`, `review_script`, `local_text_status`, `save_channel`, `save_project`, `review_take` y `render_video`. La petición `generate_script` acepta `mode=create|rewrite|outline`, `prompt`, `language`, `model` y `max_tokens`. La escritura se observa en `inventory().jobs[].result`; no se expone un servidor MCP de red.

Documentación oficial: [modelos Qwen3.5](https://ollama.com/library/qwen3.5), [generación y streaming](https://docs.ollama.com/api/generate).
