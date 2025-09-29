# 🚀 Instrucciones para Crear Repositorio Privado en GitHub

## Método 1: Via Web (Recomendado)

### Paso 1: Crear el Repositorio
1. Ve a [GitHub.com](https://github.com)
2. Inicia sesión con tu cuenta
3. Haz clic en el botón **"New"** (verde) o el **"+"** en la esquina superior derecha
4. Selecciona **"New repository"**

### Paso 2: Configurar el Repositorio
```
Repository name: breathy-extension
Description: Chrome extension for responsible gaming with breathing exercises
Visibility: ✅ Private (Importante!)
Initialize: ❌ NO marcar ninguna opción (ya tenemos los archivos)
```

### Paso 3: Conectar tu Repositorio Local
Una vez creado, GitHub te dará comandos similares a estos:

```bash
git remote add origin https://github.com/TU-USUARIO/breathy-extension.git
git branch -M master
git push -u origin master
```

## Método 2: Comandos Preparados

Una vez que tengas la URL del repositorio, ejecuta estos comandos en tu terminal:

```bash
# Navegar al directorio del proyecto
cd "c:\Users\Angel\Desktop\extensiongamble"

# Agregar el remote origin (REEMPLAZA con tu URL real)
git remote add origin https://github.com/TU-USUARIO/breathy-extension.git

# Subir la rama master
git push -u origin master

# Subir las otras ramas
git push origin development
git push origin feature/freemium
```

## Método 3: Con GitHub CLI (Si lo instalas)

```bash
# Instalar GitHub CLI desde https://cli.github.com/
# Luego ejecutar:
cd "c:\Users\Angel\Desktop\extensiongamble"
gh auth login
gh repo create breathy-extension --private --source=. --remote=origin --push
```

## Verificar que Todo Esté Correcto

Después de subir el repositorio, deberías ver:
- ✅ Repositorio privado en GitHub
- ✅ 3 ramas: master, development, feature/freemium  
- ✅ 26 archivos incluyendo assets, módulos, estilos
- ✅ README.md actualizado
- ✅ .gitignore configurado correctamente

## Próximos Pasos

1. **Clonar en otras máquinas**:
   ```bash
   git clone https://github.com/TU-USUARIO/breathy-extension.git
   ```

2. **Trabajar en nuevas features**:
   ```bash
   git checkout development
   git checkout -b feature/nueva-funcionalidad
   # ... hacer cambios ...
   git add .
   git commit -m "feat: descripción de la funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

3. **Pull Requests**:
   - Crear PR desde feature branch → development
   - Revisar código antes de hacer merge
   - Merge development → master para releases

## Proteger la Rama Master

Una vez en GitHub, ve a Settings > Branches y configura:
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require status checks to pass before merging