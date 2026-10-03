# Criterio editorial y Lo Que Te Pasa

AutoTube es general. **Lo Que Te Pasa** es un canal dentro del inventario, con un perfil que los proyectos heredan. No se incrustan reglas de psicología en el uploader ni en el diseño del producto.

## Perfil

- Propósito: entender mente, patrones sociales e introspección a través de ejemplos y evidencia.
- Audiencia: personas curiosas, sin asumir conocimientos técnicos ni patologías.
- Tono: quirúrgico, directo a ti, lenguaje de calle preciso. Sin grandilocuencia ni personaje impostado.
- Narrador: colaborador informado y original; puede exponer mecanismos con contundencia sin fingir autoridad profesional.
- Evidencia: separar lo observado, lo respaldado por estudios, la inferencia y la hipótesis.
- Límites: no diagnosticar al espectador, inventar datos ni prometer curas. Tratar la psicología oscura como análisis crítico de dinámicas, no instrucciones para dañar.

## Herencia

El canal define `purpose`, `audience`, `tone`, `evidence_policy`, `prohibited`, `narrator` y `visual_style`. El proyecto puede establecer otro valor para cada campo. Una cadena vacía hereda. El MCP devuelve `resolved_editorial` para evitar que el cliente tenga que adivinar qué prevalece.

La herencia orienta al modelo; no demuestra que lo generado respete las reglas. Las fuentes introducidas son referencias del autor, no una certificación automática del contenido.

## Estructura de episodio

Una escena cotidiana concreta → patrón observable → explicación con evidencia y límites → hipótesis alternativa → pregunta o experimento de observación → cierre.

Ejemplo original de registro:

> Sabes que esa conversación acaba igual. Y aun así vuelves. Vamos a mirar qué la dispara, qué te da en el momento y qué te cobra después. Una explicación útil no te etiqueta: te deja comprobar qué ocurre cuando cambias una pieza.

Una serie puede organizarse como curso o podcast, pero los episodios no necesitan simular docencia acreditada. El montaje, las pausas y los ejemplos se deciden para el tema y el público. No se copia una voz, identidad o guion de otros creadores.

## Revisión antes de narrar

Para cada afirmación fuerte registra fuente, qué respalda exactamente, población o contexto, limitaciones y formulación utilizada. Sustituye “esto siempre pasa” por una descripción que la fuente soporte. La contundencia debe venir de la claridad y del ejemplo, no de convertir una hipótesis en una verdad.
