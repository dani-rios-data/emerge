# Dashboard de Datos I+D de Canarias

Este dashboard permite visualizar y comparar los datos económicos de I+D (Investigación y Desarrollo) de las Islas Canarias, en comparación con otras regiones de España y países de la Unión Europea.

## Características

- Visualización de datos de I+D de Canarias y comparación con otras regiones españolas y países europeos
- Soporte multilenguaje (español e inglés)
- Diseño responsive utilizando Tailwind CSS
- Gráficos interactivos con diversas bibliotecas (Recharts, Chart.js, Nivo)
- Selección de regiones y países para comparación personalizada

## Secciones

1. **Resumen (Overview)**: Visión general de los indicadores principales.
2. **Porcentaje del PIB**: Análisis del porcentaje del PIB invertido en I+D, desglosado en inversión pública y privada.
3. **Investigadores**: Número de investigadores por año, desglosados por sector público y privado.
4. **Patentes**: Evolución del número de patentes, también desglosadas por sector.

## Tecnologías Utilizadas

- React 18
- TypeScript
- Vite
- React Router
- i18next para internacionalización
- Tailwind CSS para estilos
- Recharts, Chart.js y Nivo para visualizaciones
- PapaParse para procesamiento de CSV

## Instalación

```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Entrar al directorio
cd dashboard-bi

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

## Estructura del Proyecto

```
dashboard-bi/
├── public/
│   ├── data/       # Archivos CSV con los datos
│   └── ...
├── src/
│   ├── components/ # Componentes reutilizables
│   ├── contexts/   # Contextos de React (ej: idioma)
│   ├── data/       # Datos estáticos
│   ├── hooks/      # Custom hooks
│   ├── i18n/       # Configuración de internacionalización
│   ├── pages/      # Páginas principales
│   ├── types/      # Definiciones de tipos
│   └── utils/      # Funciones de utilidad
├── package.json
└── README.md
```

## Despliegue

El proyecto está configurado para ser desplegado en Vercel. Para desplegar:

```bash
vercel
```

## Licencia

Este proyecto está disponible como código abierto bajo la licencia MIT.
