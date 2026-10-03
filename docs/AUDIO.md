# Audio y proveedores

AutoTube mantiene una toma por idioma. Generar no significa aprobar: escucha la toma, revisa pronunciación, ritmo y fidelidad al guion antes del montaje. Los adaptadores están implementados; las voces comerciales y los modelos locales no se han generado durante esta entrega.

## ElevenLabs

Guarda la clave en Conexiones. Selecciona ElevenLabs en la pista e introduce un ID de voz válido. La interfaz usa `eleven_multilingual_v2`; MCP acepta otro `model` compatible con tu cuenta. La API utiliza el guion de la pista, o el principal si corresponde al idioma original, y guarda un MP3 44.1 kHz/128 kbps.

El brief editorial orienta la escritura del narrador. En v2 no se envía un campo de instrucciones de estilo que la API no admite. Un modelo que use etiquetas de audio requiere adaptar el guion deliberadamente. Generar con un proveedor comercial puede consumir saldo de tu cuenta.

[API oficial de conversión](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Qwen3-TTS

La opción local elegida para probar primero es **Qwen3-TTS VoiceDesign 1.7B**, publicada en enero de 2026. Admite diez idiomas, incluido español, y diseño de voz mediante instrucciones. El proyecto se distribuye con Apache 2.0. No afirmamos que supere a ElevenLabs: eso exige una comparación auditiva en español y mediciones en este equipo.

Usa un entorno propio Python 3.12, siguiendo el repositorio oficial:

```bash
uv venv --python 3.12 .tts-qwen
uv pip install --python .tts-qwen/bin/python qwen-tts soundfile
```

Configura la ruta absoluta de ese Python en Conexiones → Python de Qwen3-TTS. La primera generación descarga pesos de Hugging Face. El adaptador usa `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign`, `float32` en CPU y `bfloat16` en CUDA. La GPU, RAM, versión de Torch y drivers condicionan el resultado; no se han medido aquí VRAM, latencia ni calidad de este modelo. CPU puede resultar lenta. MPS está expuesto como opción experimental, sin validación en macOS.

El campo de tono efectivo del proyecto se pasa como instrucción de diseño de voz. El soporte de control por instrucciones no equivale a verificar que cada matiz se siga.

[Qwen3-TTS, instalación, API y modelos](https://github.com/QwenLM/Qwen3-TTS).

## Chatterbox Multilingual

Alternativa local de Resemble AI, con más idiomas y licencia MIT para el proyecto. El adaptador usa `ChatterboxMultilingualTTS` y `language_id`. Los modelos y licencias de las dependencias deben revisarse en sus repositorios oficiales.

```bash
uv venv --python 3.11 .tts-chatterbox
uv pip install --python .tts-chatterbox/bin/python chatterbox-tts
```

Usa un entorno separado para evitar conflictos de Torch/dependencias. Configura su Python en Conexiones. El adaptador no implementa clonación de voces ni pasa una instrucción de estilo no soportada: utiliza narración multilingüe con parámetros de expresividad fijos. El guion conserva el criterio del proyecto.

[Chatterbox, instalación y ejemplos](https://github.com/resemble-ai/chatterbox).

## Método de comparación pendiente

Elige tres fragmentos originales de 30–60 segundos: explicación neutra, introspección y exposición incisiva. Genera el mismo texto con cada proveedor. Escucha sin identificar el proveedor y valora naturalidad, pronunciación española, pausas, inteligibilidad y consistencia. Registra tiempo, memoria, coste y ajustes. Ninguna recomendación acústica concluyente se publica hasta hacer esta prueba.

## Montaje

FFmpeg genera imagen fija escalada/encajada a 1920×1080, H.264, AAC y `faststart`. No normaliza loudness ni alinea traducciones automáticamente. Los montajes secundarios quedan asociados a su pista. La exportación reúne originales y renders para edición externa o doblaje en Studio.
