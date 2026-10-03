# Audio y revisión local

Cada pista conserva un historial de tomas. Generar o importar añade una toma; no sustituye el audio elegido. Cada toma guarda texto, proveedor, modelo, instrucciones, fecha, duración y tiempo de generación.

1. Escribe o pega el guion y revisa la vista de lectura.
2. En Audio, elige el modelo y prueba una muestra corta (hasta 260 caracteres).
3. Genera el audio completo, escucha las tomas y consulta su texto exacto.
4. **Usar en el vídeo** elige una toma completa. Las muestras sirven para revisar la voz.
5. **Descartar** conserva el archivo y permite recuperarlo con **Ver descartadas**. Recuperar no lo vuelve a elegir automáticamente.

Cambiar la toma elegida invalida el montaje asociado. Una toma cuyo texto difiere del guion actual muestra un aviso. Durante generación y montaje puedes leer o escuchar; espera a que el trabajo termine para editar.

## Qwen local

```bash
bash scripts/setup-local-qwen.sh
```

El script instala el entorno aislado Python 3.12 desde `local-voice/qwen/uv.lock` y descarga los dos modelos oficiales. AutoTube detecta el entorno y los pesos en `$XDG_DATA_HOME/autotube-models/qwen` o `~/.local/share/autotube-models/qwen`. Las rutas y el dispositivo se pueden ajustar en Conexiones. No forman parte del AppImage ni del repositorio.

- **VoiceDesign 1.7B:** diseño de voz con instrucciones de timbre, acento y ritmo. El criterio editorial se incluye en la petición. Diseñar una voz no garantiza idéntico timbre entre generaciones o fragmentos.
- **CustomVoice 0.6B:** modelo más ligero con la voz multilingüe fija Ryan. Las instrucciones de timbre no se aplican a este modelo; el guion define la forma de hablar.

La generación usa exclusivamente pesos locales: `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1` y `local_files_only=True`. CPU usa float32; CUDA usa bfloat16 y atención SDPA, sin requerir FlashAttention. Se procesan fragmentos de hasta 520 caracteres con el mismo modelo cargado, y se unen con una pausa de 220 ms. El progreso aparece sobre el panel de revisión. Cerrar el motor libera el proceso de voz en Linux.

La instalación inicial necesita conexión. Generar, revisar y montar después no necesita una cuenta ni una API comercial. [Instalación y API oficiales](https://github.com/QwenLM/Qwen3-TTS).

## Validación local

Se comprobó generación real con ambos modelos, revisión reversible de tomas y reproducción de WAV y MP4. El rendimiento y la calidad deben evaluarse en cada equipo. El código y el entorno completo del motor están en el repositorio privado; este showcase es una demo de la interfaz.

## Otros proveedores

ElevenLabs sigue siendo opcional: configura la clave en el llavero y un ID de voz. La generación puede consumir saldo; no se ha usado en esta validación. [API oficial](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

Chatterbox permanece como adaptador opcional de un entorno separado; esta versión no lo instala ni lo valida. [Repositorio oficial](https://github.com/resemble-ai/chatterbox).

## Vídeo y reproducción

La mesa de Vídeo compone localmente el mismo fotograma que verá FFmpeg: editorial, tarjeta de título o imagen completa; paleta rosa/violeta/menta; horizontal 1920×1080 o vertical 1080×1920. Permite revisar la imagen con la toma elegida, montar H.264/AAC y reproducir el MP4 terminado. Es un montaje de imagen fija, no generación de B-roll.

El escritorio sirve recursos desde el protocolo de assets limitado a su carpeta de medios, sin convertir vídeos o audios grandes a base64. El modo de navegador local usa streaming autenticado con soporte de rangos. FFmpeg y los códecs multimedia del equipo siguen siendo requisitos. No se normaliza loudness ni se alinean idiomas automáticamente.

La aprobación de muestras y el montaje se describen en [Editor local](EDITOR.md).
