README.md

```markdown
# 🎵 GJ Radio Online

## 🌟 Descripción

GJ Radio Online es un reproductor de radio web moderno, seguro y de código abierto que te permite acceder a miles de estaciones de radio de todo el mundo directamente desde tu navegador. Con una interfaz intuitiva y funciones avanzadas, disfruta de tu música favorita sin límites.

## 🚀 Características

### ✨ Interfaz Moderna
- Diseño Responsive - Adaptable a cualquier dispositivo
- Modo Claro/Oscuro - Cambio automático según preferencias del sistema
- UX Mejorada - Navegación fluida y elementos visuales atractivos
- Animaciones Suaves - Transiciones y efectos visuales elegantes

### 🎵 Funcionalidades de Audio
- Reproductor Avanzado - Controles intuitivos y visualizador de audio
- Búsqueda Inteligente - Filtrado por nombre, país y género musical
- Sistema de Favoritos - Guarda tus estaciones preferidas localmente
- Indicador Visual - Muestra qué estación se está reproduciendo actualmente

### 🔒 Seguridad
- Protección XSS - Sanitización de datos y URLs
- Filtrado de Enlaces - Verificación de seguridad en streams de audio
- Privacidad - Sin recolección de datos personales

### 🌍 Compatibilidad
- Navegadores Modernos - Chrome, Firefox, Safari, Edge
- Dispositivos Móviles - Optimizado para smartphones y tablets
- API Radio Browser - Acceso a miles de estaciones internacionales

## 🎯 Demo

Puedes probar la aplicación en vivo aquí:  
[🔗 Demo en Vivo](deploy em andamento)

## 🛠️ Instalación

### Prerrequisitos
- Navegador web moderno
- Conexión a Internet

### Instalación Local
1. Clona el repositorio:
```bash
git clone https://github.com/Julioheyner
cd gj-radio-online
```

1. Abre el archivo HTML:

```bash
# Opción 1: Servidor local simple
python -m http.server 8000
# Luego visita: http://localhost:8000

# Opción 2: Abrir directamente
open index.html  # En macOS
start index.html # En Windows
xdg-open index.html # En Linux
```

1. ¡Listo! La aplicación se cargará en tu navegador.

📖 Uso

Navegación Básica

1. Buscar Estaciones: Usa la barra de búsqueda para encontrar estaciones por nombre
2. Filtrar por País: Selecciona un país específico en el dropdown
3. Filtrar por Género: Elige entre diferentes géneros musicales
4. Limitar Resultados: Controla cuántas estaciones mostrar

Gestión de Favoritos

· Agregar: Haz clic en el corazón ♥ en cualquier estación
· Reproducir: Haz clic en cualquier estación favorita
· Eliminar: Usa el botón de eliminar en la sección de favoritos

Controles del Reproductor

· Play/Pause: Control principal de reproducción
· Silenciar: Activa/desactiva el sonido
· Visualizador: Barras animadas que muestran el audio

🎨 Personalización

Temas Disponibles

· Modo Oscuro (por defecto)
· Modo Claro

Configuración Local

La aplicación guarda automáticamente:

· Estaciones favoritas
· Preferencia de tema
· Última estación reproducida

🔧 Tecnologías Utilizadas

· Frontend: HTML5, CSS3, JavaScript ES6+
· API: Radio Browser API
· Iconos: Font Awesome 6.4.0
· Fuentes: Poppins (Google Fonts)
· Almacenamiento: LocalStorage

📁 Estructura del Proyecto

```
gj-radio-online/
│
├── index.html                                     # Archivo principal
├── script.js                                      # Archivo de lógica de la Web App
├── schema.js
├── analytics.js
├── styles.cs                                      #Estilo de la Web App
├── img/                                           # Recursos de imagen
│   ├── vista-frontal-concentrado-dj-feminino.jpg  # Imagen hero
│   ├── favicon-32x32.png                          # Favicon
│   └── apple-touch-icon.png                       # Icono iOS
├── README.md                                      # Este archivo
└── DOCUMENTACION.md                               # Documentación técnica
```

🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (git checkout -b feature/AmazingFeature)
3. Commit tus cambios (git commit -m 'Add some AmazingFeature')
4. Push a la rama (git push origin feature/AmazingFeature)
5. Abre un Pull Request

📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para detalles.

🐛 Reportar Problemas

Si encuentras algún bug o tienes sugerencias:

· Abre un issue
· Describe el problema detalladamente
· Incluye pasos para reproducir el error

👨‍💻 Autor

Julio Gonzales

· GitHub: Julioheyner
· LinkedIn: Julio Gonzales
· Email: juliogonzales.dev@proton.me

🙏 Agradecimientos

· Radio Browser por la API gratuita
· Freepik por la imágen
· Font Awesome por los iconos
· Google Fonts por la tipografía Poppins

---

¿Te gusta el proyecto educativo? ¡Dale una ⭐ en GitHub!

```
