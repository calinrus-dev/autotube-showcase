# MCP local

El motor debe estar abierto, mediante la app o `autotube-engine`. El servidor MCP stdio consulta el mismo almacén mediante la API local; no crea otra base de datos.

## Configuración del cliente

Ejemplo para un cliente que acepte configuración MCP JSON. Sustituye las rutas por las de tu checkout:

```json
{
  "mcpServers": {
    "autotube": {
      "command": "/ruta/autotube/engine/.venv/bin/autotube-mcp",
      "args": [],
      "env": {
        "AUTOTUBE_DATA_DIR": "/ruta/al/almacen/autotube"
      }
    }
  }
}
```

En Windows el ejecutable está en `.venv/Scripts/`. Si no defines `AUTOTUBE_DATA_DIR`, ambos procesos usan el almacén por defecto. Un cliente con otro formato de configuración debe registrar el mismo ejecutable stdio. El servidor no imprime mensajes propios en stdout fuera del protocolo.

En el equipo de la entrega se ha registrado `autotube` en Codex mediante el CLI, conservando el resto de servidores. Abre AutoTube o el motor antes de consultar su inventario; una nueva sesión de Codex carga la configuración. Otros clientes se configuran con el mismo ejecutable stdio.

Para registrar en otra instalación:

```bash
codex mcp add autotube -- /ruta/autotube/engine/.venv/bin/autotube-mcp
codex mcp get autotube
```

[Documentación oficial de MCP en Codex](https://developers.openai.com/codex/mcp). Los clientes cloud que no puedan ejecutar procesos locales necesitan un puente desktop compatible o un servidor remoto con autenticación y control de acceso; no basta con exponer este puerto.

## Herramientas

| Tool | Función |
| --- | --- |
| `inventory` | Canales, proyectos, recursos, jobs y ajustes sin secretos |
| `editorial_context` | Canal, proyecto, fuentes y criterio efectivo |
| `save_channel` | Crear/actualizar configuración de canal |
| `save_project` | Crear/editar documento con revisión actual |
| `import_media` | Copiar un archivo local al almacén |
| `generate_voice` | Encolar ElevenLabs, Qwen3 o Chatterbox |
| `render_video` | Montaje del audio de un idioma con la miniatura |
| `upload_video` | Privado por defecto; fecha futura programa publicación |
| `schedule_inventory` | Lote diario ordenado, hora y zona locales |
| `job_action` | Cancelar antes de empezar o reintentar un fallo revisable |
| `export_project` | Paquete de proyecto y medios sin credenciales |
| `youtube_inventory` | Consulta remota de títulos e IDs |

## Flujo recomendado para la IA

1. Consulta `inventory`, identifica el canal y proyecto por ID.
2. Lee `editorial_context` antes de escribir. Conserva campos y revisión actual.
3. Prepara un guion original con fuentes verificables y etiqueta las inferencias.
4. Guarda con `save_project`. Ante conflicto, vuelve a consultar y reconcilia; no fuerces una revisión.
5. Genera voz solo cuando el usuario lo pida y conoce el proveedor/coste.
6. Monta y exporta. La subida y el calendario producen acciones reales; respeta el alcance autorizado del cliente.

El servidor ofrece capacidad técnica; no decide por sí solo cuándo la autorización del usuario es suficiente. No incluye herramientas de borrado remoto ni lectura de credenciales.

## Revisión de tomas y modelos locales (0.3)

`local_voice_status` comprueba entorno, pesos y dispositivo sin generar. `generate_voice` admite `sample=true` y los modelos Qwen `voice_design` y `custom_voice_small`. Cada trabajo añade una toma al historial; no la selecciona.

`record_audio_take` añade un recurso importado a una pista. `review_take` acepta `use`, `discard` o `restore`, con la revisión actual del proyecto. Descarta de forma reversible; las muestras no se usan para montar. `save_project` configura `video_theme` (`layout`, `palette`, `format`, `heading`, `subtitle`). `render_video` utiliza la toma completa elegida y el tema; no necesita imagen si la composición es tipográfica.

Los clientes deben recargar el inventario tras completar un trabajo para usar la revisión más reciente. La aplicación anterior debe cerrarse antes de abrir una versión nueva del motor.

## Texto y montaje local 0.3

`generate_script` crea propuestas con Ollama; `review_script` las usa, descarta o recupera. `local_text_status` lista los modelos descargados. Los resultados parciales se leen en `inventory().jobs[].result`, sin sustituir el guion actual.

`save_channel` permite `branding.intro_id` y `branding.outro_id`. `save_project` configura `video_theme.background_id`, `layout=video` para bucle y `intro_enabled/outro_enabled`. `render_video` monta estos clips con la narración. `review_take(action="approve")` aprueba una muestra para recuperar sus ajustes; `use` sigue reservado a tomas completas. Consulta el contrato en [Editor](EDITOR.md).
