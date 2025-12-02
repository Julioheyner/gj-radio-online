/**
 * Schema.org Structured Data Generator
 * Para proyectos de aprendizaje en desarrollo frontend
 */

class SchemaGenerator {
  constructor() {
    this.schemaData = null;
    this.init();
  }
  
  init() {
    this.generateSchema();
    this.injectSchema();
  }
  
  generateSchema() {
    this.schemaData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "GJ Radio Online",
      "description": this.getDescription(),
      "url": this.getCurrentUrl(),
      "applicationCategory": ["MusicApplication", "EducationalApplication"],
      "operatingSystem": "Web Browser",
      "isAccessibleForFree": true,
      "author": this.getAuthorInfo(),
      "datePublished": "2025-01-01",
      "version": "2.0.0",
      "codeRepository": "https://github.com/Julioheyner/gj-radio-online",
      "programmingLanguage": "JavaScript",
      "softwareRequirements": "HTML5 Audio API",
      "learningResourceType": "SourceCode",
      "about": {
        "@type": "Thing",
        "name": "API Consumption and Frontend Development"
      },
      "teaches": this.getSkillsLearned(),
      "featureList": this.getFeatures(),
      "keywords": this.getKeywords()
    };
  }
  
  getDescription() {
    return "Proyecto educativo de desarrollo frontend - Aplicación web que demuestra el consumo de APIs RESTful usando Radio Browser API";
  }
  
  getCurrentUrl() {
    return window.location.origin || "https://gjradioonline.com";
  }
  
  getAuthorInfo() {
    return {
      "@type": "Person",
      "name": "Julio Gonzales",
      "jobTitle": "Desarrollador en Aprendizaje",
      "url": "https://github.com/Julioheyner",
      "knowsAbout": [
        "JavaScript",
        "HTML5",
        "CSS3",
        "API Consumption",
        "Frontend Development",
        "Responsive Design",
        "LocalStorage API",
        "HTML5 Audio API"
      ]
    };
  }
  
  getSkillsLearned() {
    return [
      "Consumo de APIs RESTful",
      "Manejo de asincronía en JavaScript",
      "LocalStorage para persistencia de datos",
      "HTML5 Audio API",
      "Diseño responsive",
      "Manejo de estados en aplicaciones web",
      "Manipulación del DOM con JavaScript",
      "Event handling y delegation",
      "Sanitización de datos para seguridad XSS"
    ];
  }
  
  getFeatures() {
    return [
      "Integración con Radio Browser API",
      "Gestión de estado con JavaScript vanilla",
      "Interfaz de usuario responsive",
      "Sistema de favoritos persistente",
      "Player de audio HTML5 personalizado",
      "Filtros y búsqueda en tiempo real",
      "Sistema de temas claro/oscuro",
      "Indicadores visuales de reproducción",
      "Validación de seguridad en URLs de audio"
    ];
  }
  
  getKeywords() {
    return [
      "javascript", "api consumption", "frontend development",
      "radio browser api", "web audio api", "learning project",
      "educational", "portfolio project", "vanilla javascript",
      "html5", "css3", "responsive design"
    ];
  }
  
  injectSchema() {
    // Remover schema existente si hay
    this.removeExistingSchema();
    
    // Crear nuevo elemento script
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(this.schemaData, null, 2);
    schemaScript.id = 'schema-structured-data';
    
    // Agregar al head
    if (document.head) {
      document.head.appendChild(schemaScript);
      console.log('✅ Schema.org structured data inyectado correctamente');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(schemaScript);
        console.log('✅ Schema.org structured data inyectado después de DOMContentLoaded');
      });
    }
  }
  
  removeExistingSchema() {
    const existingSchema = document.getElementById('schema-structured-data');
    if (existingSchema) {
      existingSchema.remove();
    }
  }
  
  // Método para actualizar el schema dinámicamente
  updateSchema(updates) {
    Object.assign(this.schemaData, updates);
    this.injectSchema();
  }
  
  // Método para obtener el schema como objeto
  getSchema() {
    return this.schemaData;
  }
  
  // Método para validar el schema
  validateSchema() {
    try {
      JSON.stringify(this.schemaData);
      console.log('✅ Schema válido');
      return true;
    } catch (error) {
      console.error('❌ Error en el schema:', error);
      return false;
    }
  }
}

// Inicializar automáticamente cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
  window.appSchema = new SchemaGenerator();
  
  // Opcional: Validar el schema
  if (window.appSchema.validateSchema()) {
    console.log('🎉 Schema.org configurado correctamente para GJ Radio Online');
  }
});

// Exportar para uso en otros módulos (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SchemaGenerator;
}