# Git Workflow para Breathy Extension

## Estructura de Ramas

### 🌟 master
- **Propósito**: Versión estable de producción
- **Contiene**: Código listo para Chrome Web Store
- **Protegida**: Solo merge desde development via Pull Request

### 🔧 development 
- **Propósito**: Integración de nuevas funcionalidades
- **Contiene**: Features completadas y probadas
- **Workflow**: Feature branches → development → master

### 🚀 feature/freemium
- **Propósito**: Implementación del modelo freemium
- **Incluye**: 
  - Sistema de licencias
  - Límites de funcionalidades gratuitas
  - Integración de pagos
  - UI de suscripciones

### 🎯 Ramas Futuras Sugeridas

```bash
feature/premium-breathing    # Patrones de respiración avanzados
feature/analytics           # Estadísticas detalladas
feature/social              # Funciones sociales/compartir
feature/ai-insights         # IA para recomendaciones personalizadas
hotfix/critical-bug         # Correcciones urgentes
release/v2.0.0              # Preparación de versiones
```

## Comandos Útiles

```bash
# Cambiar a development para nuevas features
git checkout development
git pull origin development

# Crear nueva feature branch
git checkout -b feature/nueva-funcionalidad

# Merge a development cuando esté lista
git checkout development
git merge feature/nueva-funcionalidad

# Merge a master para producción
git checkout master
git merge development
```

## Flujo Recomendado

1. **Nueva Feature**: `master` → `development` → `feature/nombre` 
2. **Development**: Completar feature → merge a `development`
3. **Testing**: Probar en `development` branch
4. **Production**: `development` → `master` cuando esté estable
5. **Hotfix**: `master` → `hotfix/nombre` → `master` + `development`

## Commits Semánticos

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato/estilo
refactor: refactorización de código
test: adición de pruebas
chore: tareas de mantenimiento
```

## Ejemplo de Commits

```bash
git commit -m "feat: add premium subscription system"
git commit -m "fix: resolve multi-window sync issue"  
git commit -m "docs: update API documentation"
git commit -m "refactor: optimize breathing pattern loader"
```