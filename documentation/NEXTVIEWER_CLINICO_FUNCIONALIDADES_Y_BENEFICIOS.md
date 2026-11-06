# NextViewer Clinical: funcionalidades y beneficios

## Consulta de imágenes conectada con NextRIS

NextViewer 5.0 Clinical es un visor web de imágenes médicas DICOM integrado con NextRIS y el entorno PACS de la institución. Su uso previsto es la consulta y revisión clínica: permite abrir un estudio, recorrer sus series y utilizar herramientas de visualización desde el navegador.

La propuesta combina una interfaz adaptable a computadoras, tablets y teléfonos con accesos diferenciados para profesionales y pacientes. El personal dispone de funciones clínicas según su autorización; el paciente accede desde su portal y los destinatarios externos pueden consultar imágenes mediante enlaces compartidos con vigencia administrable.

La adaptación móvil contempla controles y navegación específicos para pantallas táctiles. La separación de accesos determina, entre otros aspectos, la disponibilidad de notas clínicas, inspección de atributos DICOM y personalización profesional.

## Funcionalidades y su aporte al servicio

### 1. Visualización DICOM y navegación por el estudio

**Qué permite hacer**

- Abrir un estudio y seleccionar sus series de imágenes.
- Recorrer imágenes y fotogramas de objetos multiframe compatibles.
- Consultar información contextual del paciente, estudio, serie e imagen, cuando está disponible.
- Visualizar modalidades compatibles, entre ellas tomografía, resonancia, radiografía, mamografía y ecografía.

**Beneficios**

Reúne las imágenes y sus datos de contexto en un entorno de consulta. La organización por series y la identificación de la imagen activa facilitan recorrer el estudio y reconocer qué contenido se está visualizando.

### 2. Herramientas de revisión y medición

**Qué permite hacer**

- Ampliar la imagen, desplazarla y ajustar su ventana de visualización.
- Invertir la presentación de la imagen o restablecer la vista.
- Utilizar herramientas de longitud, ángulo, medición bidireccional, regiones de interés y flechas, según las funciones habilitadas.
- Mantener los ajustes de ventana de cada área de visualización al recorrer su serie.

**Beneficios**

Permite adaptar la presentación a la región o característica que se desea revisar. Las mediciones y anotaciones apoyan la exploración del estudio durante la sesión y ayudan a señalar elementos de interés.

La conservación de la ventana por área evita repetir un mismo ajuste en cada imagen. Las mediciones realizadas durante la consulta se mantienen en la sesión; no se presentan como un registro clínico persistente.

### 3. Organización de series y navegación enlazada

**Qué permite hacer**

- Distribuir series en varias áreas de visualización y seleccionar el área activa.
- Cambiar la disposición de imágenes y ajustar el espacio de trabajo en escritorio.
- Enlazar la navegación de dos áreas para recorrer sus series de forma coordinada.
- Aplicar enlaces automáticos entre series de resonancia que cumplen las condiciones espaciales y de compatibilidad requeridas, o establecer enlaces manuales.

**Beneficios**

Facilita revisar distintas series dentro del espacio de trabajo y reduce la necesidad de alternar continuamente entre ellas. La navegación enlazada ayuda a seguir posiciones relacionadas entre series compatibles.

La correspondencia automática utiliza la información espacial disponible. Su disponibilidad depende de los datos de las series y no implica que todas las imágenes puedan sincronizarse de la misma manera.

### 4. Reconstrucción multiplanar

**Qué permite hacer**

- Activar reconstrucciones multiplanares en series de tomografía o resonancia compatibles.
- Revisar vistas axial, sagital y coronal.
- Seleccionar o ampliar una vista para concentrar la revisión en ese plano.

**Beneficios**

Ofrece distintas perspectivas de un mismo volumen para apoyar la revisión anatómica. La selección de vistas permite organizar la consulta según la tarea y el espacio disponible.

**Disponibilidad:** requiere la función habilitada, una serie con geometría válida y recursos suficientes en el dispositivo para cargar y procesar el volumen.

### 5. Protocolos de presentación y personalización clínica

**Qué permite hacer**

- Utilizar distribuciones de imágenes predefinidas por modalidad.
- Crear y administrar protocolos personales de presentación cuando la sesión tiene habilitada esa capacidad.
- Definir la disposición de las áreas y los criterios para ubicar las series.

**Beneficios**

Ayuda a preparar un espacio de revisión consistente y reduce la organización manual repetitiva de las series. Los protocolos personales permiten adaptar la presentación a hábitos de trabajo del profesional.

La personalización de protocolos conserva la distribución y las reglas de selección de series. Los ajustes de imagen y las mediciones de una sesión tienen un alcance diferente y no forman parte de ese protocolo.

### 6. Información clínica complementaria

**Qué permite hacer**

- Mostrar notas incluidas en los datos DICOM del estudio para personal con acceso clínico, cuando existen.
- Inspeccionar los atributos DICOM de la imagen seleccionada desde un panel de consulta.
- Buscar atributos por identificador, nombre o valor.

**Beneficios**

Acerca al profesional información adicional que acompaña a las imágenes. La inspección de atributos también facilita revisar detalles de adquisición e identificación durante tareas clínicas o técnicas.

Las notas y la inspección completa de atributos se reservan al acceso clínico identificado; permanecen ocultas para pacientes y enlaces compartidos.

### 7. Integración con NextRIS y acceso compartido

**Qué permite hacer**

- Abrir el visor sobre el estudio seleccionado desde las opciones habilitadas de NextRIS.
- Ingresar a las imágenes propias desde el portal del paciente.
- Facilitar acceso externo mediante enlaces temporales asociados a un estudio.
- Administrar el vencimiento y la revocación de enlaces desde las herramientas autorizadas de NextRIS.

**Beneficios**

Conecta la información del examen con sus imágenes y reduce pasos para llegar al estudio correspondiente. El acceso desde el portal da al paciente una vía personal de consulta, mientras que los enlaces permiten acercar las imágenes a un destinatario sin crearle una cuenta de personal.

La vigencia administrable permite establecer un período de acceso y retirarlo cuando corresponde.

## Diseño responsive y experiencia móvil

**Qué permite hacer**

NextViewer adapta su distribución a las dimensiones de la pantalla y ofrece controles específicos para dispositivos táctiles. En computadoras aprovecha el espacio para mostrar paneles y varias áreas de visualización; en tablets y teléfonos reorganiza la interfaz para priorizar las imágenes y desplegar las herramientas cuando se necesitan.

| Capacidad | Comportamiento de la interfaz | Beneficio para el usuario |
| --- | --- | --- |
| **Reorganización responsive** | Ajusta encabezado, controles y distribución del espacio en pantallas pequeñas. | Facilita consultar imágenes sin mantener una disposición pensada únicamente para escritorio. |
| **Paneles desplegables** | Presenta series e información complementaria en paneles que se pueden abrir y cerrar. | Permite recuperar espacio para la imagen durante la revisión. |
| **Menú móvil de herramientas** | Reúne acciones en un menú compacto que se despliega y se cierra al seleccionar una herramienta. | Acerca las funciones al uso táctil y reduce la ocupación permanente de pantalla. |
| **Navegador táctil de imágenes** | Ofrece un control vertical con contador para recorrer las imágenes de una serie en pantallas táctiles pequeñas. | Facilita avanzar por el estudio sin depender de una rueda de mouse. |
| **Zoom con dos dedos** | Incorpora una interacción táctil de ampliación mediante dos puntos de contacto. | Permite explorar detalles desde tablets y teléfonos. |
| **Adaptación a la orientación y al área visible** | Reajusta el área de imagen al cambiar el tamaño o la orientación y contempla los márgenes propios de pantallas móviles. | Aprovecha el espacio disponible durante el uso del dispositivo. |

**Beneficios**

La experiencia responsive amplía las posibilidades de acceso a las imágenes desde distintos dispositivos. El usuario puede consultar un estudio en escritorio y disponer de una interfaz adaptada cuando utiliza una tablet o un teléfono.

El menú móvil, los paneles desplegables y el navegador táctil son capacidades concretas que facilitan esa consulta. El rendimiento depende del navegador, el dispositivo, la conexión y el tamaño del estudio; los volúmenes de mayor tamaño y las reconstrucciones requieren más recursos.

## Acceso clínico y acceso para pacientes

NextViewer utiliza el mismo visor con capacidades diferenciadas según el tipo de sesión. El acceso desde el portal del paciente y el acceso mediante un enlace compartido tienen recorridos de entrada diferentes, y ambos conservan restricciones frente a las funciones clínicas identificadas.

| Aspecto | Personal con acceso clínico | Paciente desde su portal | Destinatario de un enlace compartido |
| --- | --- | --- | --- |
| **Ingreso** | Sesión del personal desde NextRIS o autenticación clínica directa configurada. | Sesión personal del portal y apertura de un estudio propio. | Enlace válido que autoriza el acceso al estudio compartido, sin cuenta de personal. |
| **Punto de entrada al estudio** | Examen o estudio seleccionado mediante las opciones autorizadas. | Estudio seleccionado entre los disponibles para ese paciente. | Estudio al que está asociado el enlace. |
| **Visualización y controles** | Herramientas de consulta según configuración y disponibilidad del estudio. | Consulta de imágenes y controles disponibles en su modo de acceso. | Consulta de las imágenes autorizadas y controles disponibles en ese acceso. |
| **Notas clínicas DICOM** | Visibles cuando existen y la sesión está identificada como clínica. | Ocultas. | Ocultas. |
| **Inspección completa de atributos DICOM** | Disponible desde las herramientas clínicas. | Oculta. | Oculta. |
| **Protocolos personales de presentación** | Administración disponible cuando la sesión habilita la personalización profesional. | Sin administración de protocolos personales. | Sin administración de protocolos personales. |
| **Vigencia del acceso** | Sujeta a la sesión y a las autorizaciones correspondientes. | Sujeta a su sesión y a la disponibilidad del estudio en el portal. | Sujeta al vencimiento y a la revocación del enlace. |

**Beneficios**

La diferenciación permite ofrecer herramientas clínicas al personal autorizado y una vía de consulta de imágenes para pacientes y destinatarios externos. Las diferencias se concentran en capacidades concretas, como notas, inspección de atributos y personalización; los controles generales de visualización pueden estar presentes en más de un modo de acceso.

El paciente puede consultar las imágenes disponibles sin incorporarse al circuito de usuarios del personal. La institución conserva mecanismos para organizar el acceso y administrar los enlaces compartidos.

## Disponibilidad de las capacidades

Las funciones descritas dependen de la configuración del visor, el tipo de acceso y las características del estudio. La conexión con el PACS y la disponibilidad de las imágenes son necesarias para la consulta; los protocolos personales requieren habilitación de personalización, y la reconstrucción multiplanar necesita series compatibles.

La interfaz responsive adapta la presentación a distintas pantallas. La compatibilidad efectiva y el rendimiento deben evaluarse con los navegadores, dispositivos y estudios utilizados por cada institución.

## Beneficios por audiencia

| Audiencia | Aporte de NextViewer Clinical |
| --- | --- |
| **Instituciones y responsables del servicio** | Acceso a imágenes conectado con NextRIS, una interfaz adaptable a distintos dispositivos y capacidades diferenciadas para personal, pacientes y destinatarios externos. |
| **Profesionales clínicos** | Herramientas para recorrer, organizar y revisar imágenes, consultar información complementaria y adaptar la presentación según las funciones habilitadas. |
| **Equipos técnicos** | Consulta de series y datos de adquisición, inspección de atributos DICOM con acceso clínico y apoyo a la revisión de la información del estudio. |
| **Pacientes** | Consulta de imágenes propias desde el portal, acceso desde tablets y teléfonos compatibles y opciones para compartir estudios mediante los mecanismos habilitados. |
