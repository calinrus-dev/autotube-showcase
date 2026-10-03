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
