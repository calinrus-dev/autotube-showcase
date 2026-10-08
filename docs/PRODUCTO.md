# Producto y alcance

AutoTube organiza la producción de varios canales desde una mesa común. El espacio **Lo Que Te Pasa** reúne psicología, patrones, temas sociales e introspección; otros espacios pueden tener su propia identidad.

## Modelo de trabajo

Canal → proyecto/episodio → guion y recursos → pistas por idioma → montaje → trabajo de subida → fecha de publicación.

El nombre del canal, su audiencia, propósito, tono, evidencia y lenguaje visual no dependen del diseño de la aplicación. Un proyecto conserva sus excepciones al criterio del canal. El MCP devuelve ambos perfiles y el resultado efectivo.

El flujo vigente de guion local, revisión de muestras y montaje está descrito en [Editor local](EDITOR.md).

## Distribución de la consola

La cabecera reúne canal, navegación y estado. La interfaz 0.4.2 utiliza una cinta con Resumen, Guion, Voz, Montaje y Publicación, estados visibles y acciones fijas. El selector de episodio y un inventario desplegable con búsqueda sustituyen las columnas laterales permanentes. La ventana conserva su tamaño; documentos, listas e inspectores se desplazan dentro de sus paneles.

La mesa de audio coloca texto y toma en paralelo en escritorio; en pantallas estrechas permite alternar Guion y voz con Escuchar y guardar. Guarda con el botón o Ctrl/Cmd+S. Si cambias de canal o episodio con trabajo pendiente, un diálogo permite guardar y cambiar, descartar o continuar editando. Solo audio permite guardar una toma y terminar sin montaje ni publicación. Conexiones agrupa Voces e IA, YouTube y MCP.

## Mesa de audio

La interfaz trata cada idioma como una pista de producción, con guion, historial de tomas, motor y metadatos localizados. Se puede escuchar el archivo real importado o generado. Un audio inexistente se representa como vacío, sin ondas o reproducciones ficticias.

La generación de voz entra en una cola persistente. La revisión del texto y la toma sigue siendo parte del flujo: no hay traducción automática ni un supuesto control de calidad acústico. ElevenLabs usa el modelo multilingüe v2; otros modelos pueden solicitarse desde MCP. Qwen usa instrucciones para diseñar la voz y Chatterbox ofrece narración multilingüe.

## Lectura y vídeo

El guion tiene un editor y una vista de lectura con tiempo aproximado de narración. La mesa de audio conserva cada generación: puedes escucharla, leer el texto usado, descartarla de forma reversible y elegir una toma completa. Las muestras no sustituyen el audio del vídeo.

Vídeo permite escoger composición, paleta, título, subtítulo y orientación. Su previsualización usa la misma composición local que el montaje de FFmpeg. Cambiar tema, imagen o toma elegida invalida el render anterior. El MP4 final se reproduce dentro de la app.

## Calendario

Selecciona episodios renderizados, en orden, una fecha inicial, una hora y una zona horaria. Se suben en cuanto el worker puede ejecutarlos; el campo `publishAt` programa la publicación en YouTube. La hora local se conserva entre días y se rechazan horas ambiguas o inexistentes por cambios de horario.

## Límites explícitos

- Montaje de foto/título o vídeo en bucle con intro y cierre; no generación autónoma de escenas o B-roll.
- Recursos y jobs locales; no sincronización de inventario entre ordenadores.
- Un worker serial, no granja paralela ni servicio permanente.
- Lista remota de títulos/IDs hasta 1000 vídeos; no borrado remoto ni editor de vídeos ya publicados.
- Edición de guiones y metadatos locales antes de subir; no sustitución del archivo de un vídeo publicado.
- Audio alternativo de un mismo vídeo: exportación y carga manual en Studio. La API pública documentada no ofrece una carga equivalente en esta implementación.
- Generación de texto con Ollama y modelos locales descargados. El cliente MCP puede producir y revisar también los textos con el contexto del proyecto.
- OAuth y ElevenLabs requieren configuración. Qwen necesita preparación inicial; después genera con los pesos locales. No se incluye una cuenta o clave comercial.
- Una app de YouTube sin auditoría puede quedar limitada a subidas privadas.

## Próximas mejoras

Servicio de sistema opcional; timeline de escenas; subtítulos; normalización/loudness y alineación de doblaje; importación paginada del inventario; editor de metadatos remotos; verificación de procesamiento/fecha aceptada tras la subida; recuperación guiada de sesiones inciertas; soporte y CI nativos macOS/Windows.
