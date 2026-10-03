# Producto y alcance

AutoTube organiza la producción de varios canales desde una mesa común. El espacio **Lo Que Te Pasa** reúne psicología, patrones, temas sociales e introspección; otros espacios pueden tener su propia identidad.

## Modelo de trabajo

Canal → proyecto/episodio → guion y recursos → pistas por idioma → montaje → trabajo de subida → fecha de publicación.

El nombre del canal, su audiencia, propósito, tono, evidencia y lenguaje visual no dependen del diseño de la aplicación. Un proyecto conserva sus excepciones al criterio del canal. El MCP devuelve ambos perfiles y el resultado efectivo.

## Distribución de la consola

La cabecera reúne canal, navegación y estado del motor. El selector de episodio y un inventario desplegable con búsqueda sustituyen las columnas laterales permanentes. Guion, Audio y Publicación son espacios separados: cada fase enseña las herramientas que necesita.

La mesa de audio coloca texto y toma en paralelo en escritorio, y se adapta a una columna en pantallas pequeñas. Guarda con el botón o Ctrl/Cmd+S. Si cambias de canal o episodio con trabajo pendiente, un diálogo permite guardar y cambiar, descartar o continuar editando.

## Mesa de audio

La interfaz trata cada idioma como una pista de producción, con guion, toma, motor y metadatos localizados. Se puede escuchar el archivo real importado o generado. Un audio inexistente se representa como vacío, sin ondas o reproducciones ficticias.

La generación de voz entra en una cola persistente. La revisión del texto y la toma sigue siendo parte del flujo: no hay traducción automática ni un supuesto control de calidad acústico. ElevenLabs usa el modelo multilingüe v2; otros modelos pueden solicitarse desde MCP. Qwen usa instrucciones para diseñar la voz y Chatterbox ofrece narración multilingüe.

## Calendario

Selecciona episodios renderizados, en orden, una fecha inicial, una hora y una zona horaria. Se suben en cuanto el worker puede ejecutarlos; el campo `publishAt` programa la publicación en YouTube. La hora local se conserva entre días y se rechazan horas ambiguas o inexistentes por cambios de horario.

## Límites explícitos

- Montaje inicial de imagen fija, no generación autónoma de escenas o B-roll.
- Recursos y jobs locales; no sincronización de inventario entre ordenadores.
- Un worker serial, no granja paralela ni servicio permanente.
- Lista remota de títulos/IDs hasta 1000 vídeos; no borrado remoto ni editor de vídeos ya publicados.
- Edición de guiones y metadatos locales antes de subir; no sustitución del archivo de un vídeo publicado.
- Audio alternativo de un mismo vídeo: exportación y carga manual en Studio. La API pública documentada no ofrece una carga equivalente en esta implementación.
- La aplicación no ejecuta un LLM interno. El cliente MCP produce y revisa los textos con el contexto del proyecto.
- OAuth, ElevenLabs y modelos locales requieren configuración. No se incluye una cuenta, clave ni licencia de voz.
- Una app de YouTube sin auditoría puede quedar limitada a subidas privadas.

## Próximas mejoras

Servicio de sistema opcional; timeline de escenas; subtítulos; normalización/loudness y alineación de doblaje; importación paginada del inventario; editor de metadatos remotos; verificación de procesamiento/fecha aceptada tras la subida; recuperación guiada de sesiones inciertas; soporte y CI nativos macOS/Windows.
