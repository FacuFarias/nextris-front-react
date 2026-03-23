# Manual de Uso Clinico - Reportes Estructurados

Fecha: 2026-03-11
Aplicacion: NextRIS
Modulo: Reportes estructurados
Perfil principal: Sysadmin (configuracion), Medico radiologo (uso clinico del resultado)

## 1. Objetivo clinico
Este modulo permite transformar variables extraidas automaticamente desde DICOM SR en texto clinico estructurado.

En terminos practicos:
- Se define una regla (criterio) sobre una variable (ej. velocidad, ratio, diametro).
- Si la regla se cumple, el sistema propone un texto final estandarizado.
- Esto mejora consistencia, trazabilidad y tiempos de redaccion.

## 2. Alcance y roles
### Sysadmin
Puede:
- Asociar parser con facilities y tipos de estudio.
- Configurar mapeo de variables.
- Crear, editar y priorizar criterios.

### Medico radiologo
Puede:
- Revisar criterios definidos por su organizacion.
- Validar que el texto generado sea coherente con el estudio.
- Integrar el resultado al informe final segun criterio medico.

Nota:
- La decision diagnostica final siempre es del medico.
- El sistema asiste; no reemplaza juicio clinico.

## 3. Flujo clinico recomendado
1. Confirmar parser correcto para el tipo de estudio.
2. Validar que las variables del parser esten mapeadas correctamente.
3. Definir criterios con umbrales clinicos institucionales.
4. Probar criterios con casos reales o casos de validacion.
5. Ajustar prioridad y texto final para evitar contradicciones.
6. Publicar y monitorear resultados durante los primeros dias.

## 4. Uso por pantalla

## 4.1 Lista de parser
Ruta:
- `/reportes-estructurados/lista-parser`

Objetivo:
- Ver parsers disponibles y estado de asociaciones.

Accion clave:
- Abrir modal de asociaciones y vincular parser con:
  - Facilities
  - Tipos de estudio

Recomendacion clinica:
- Asociar solo los parsers validados para esa modalidad/equipo.

## 4.2 Mapeo de variables
Ruta:
- `/reportes-estructurados/mapeo-variables`

Objetivo:
- Asegurar que cada variable clinica relevante quede correctamente identificada.

Pasos:
1. Seleccionar parser.
2. Seleccionar facility.
3. Revisar mapeos especificos y, si aplica, mapeos genericos (fallback).
4. Crear o editar mapeo cuando una variable no corresponda al nombre esperado.

Buenas practicas:
- Mantener nomenclatura consistente entre facilities.
- Evitar duplicar significado clinico con nombres distintos.
- Documentar cambios de mapeo cuando impacten criterios activos.

## 4.3 Conceptos y criterios
Ruta:
- `/reportes-estructurados/conceptos-criterios`

Objetivo:
- Definir reglas clinicas y texto final estandar.

Pasos de creacion:
1. Seleccionar parser.
2. Clic en `Nuevo criterio`.
3. Elegir combinador logico:
   - `AND`: todas las condiciones deben cumplirse.
   - `OR`: al menos una condicion debe cumplirse.
4. Arrastrar variable desde panel izquierdo o escribir la clave.
5. Definir operador y valor umbral.
6. Escribir texto final clinico.
7. Definir prioridad.
8. Guardar.

Operadores disponibles:
- `>` , `>=` , `<` , `<=` , `==` , `!=` , `between` , `contains`

Recomendaciones clinicas para redactar el texto final:
- Escribir en tono descriptivo y objetivo.
- Evitar conclusiones absolutas cuando requieran correlacion.
- Incluir "correlacion clinica" cuando aplique.
- Usar lenguaje institucional consensuado.

Ejemplo (carotideo):
- Regla: `ICA/CCA velocity ratio >= 4`
- Texto: "Hallazgos compatibles con estenosis severa de arteria carotida interna. Correlacion clinica y confirmacion por criterios institucionales."

## 5. Prioridad de criterios
La prioridad controla el orden de evaluacion/salida.

Sugerencia:
- 1-20: hallazgos criticos o de mayor impacto clinico.
- 21-60: hallazgos moderados/relevantes.
- 61-100: notas de apoyo o control de calidad.

Evitar:
- Criterios redundantes con mismo objetivo y distinta prioridad sin justificacion.

## 6. Validacion clinica antes de pasar a produccion
Checklist minimo:
- [ ] Parser correcto asociado a facility y estudio.
- [ ] Variables clave visibles en el builder.
- [ ] Umbrales revisados por referente clinico.
- [ ] Textos finales aprobados por liderazgo medico.
- [ ] Prueba en casos positivos, negativos y limites.
- [ ] No hay contradicciones entre criterios activos.

## 7. Calidad y seguridad
- El modulo no sustituye la lectura del estudio.
- Siempre verificar consistencia entre imagen, medicion y texto sugerido.
- Si una variable no aparece o aparece vacia, revisar:
  1. Asociacion parser/facility.
  2. Mapeo de variables.
  3. Disponibilidad del dato en SR origen.

## 8. Mantenimiento recomendado
Frecuencia sugerida:
- Semanal (fase inicial): revision de criterios disparados.
- Mensual (estable): ajuste fino de umbrales y textos.

Eventos que obligan a revisar criterios:
- Cambio de equipo o software del ecografo.
- Nuevo parser/version.
- Cambios en protocolo clinico institucional.

## 9. Errores frecuentes y resolucion rapida
1. "No se ven criterios"
- Verificar parser seleccionado.
- Recargar lista con boton `Cargar criterios`.

2. "No aparece variable en condicion"
- Confirmar que el parser tenga variables mapeadas.
- Revisar mapeo en pestaña `Mapeo de variables`.

3. "Criterio no se dispara"
- Validar nombre de variable en regla.
- Confirmar operador y tipo de valor (numero/texto).
- Revisar prioridad y estado `Activo`.

## 10. Gobernanza clinica sugerida
Para mantener calidad y seguridad, definir:
- Responsable medico de criterios por area (ej. vascular).
- Responsable tecnico (Sysadmin) para cambios en parser/mapeos.
- Bitacora de cambios con fecha, motivo y aprobador.

## 11. Resumen ejecutivo
Este modulo permite estandarizar redaccion basada en datos estructurados del SR.

Beneficios esperados:
- Mayor consistencia entre informes.
- Menor variabilidad textual.
- Mejor trazabilidad de criterios clinicos.
- Reduccion de tiempo en redaccion repetitiva.

Limite importante:
- La conclusion diagnostica final siempre depende del medico tratante.
