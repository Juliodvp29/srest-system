# Dynamic Table Component

Componente de tabla de datos reutilizable y altamente configurable para aplicaciones Angular. Ofrece funcionalidades integradas de búsqueda, filtrado, ordenamiento, paginación y exportación a Excel.

## Características

*   **Renderizado Dinámico**: Genera columnas basadas en configuraciones.
*   **Tipos de Datos**: Soporte para texto, badges (etiquetas), imágenes, fechas y moneda.
*   **Búsqueda Global**: Filtrado en tiempo real en todas las columnas visibles.
*   **Filtros Avanzados**: Soporte para filtros tipo 'select' (y lógica preparada para rangos de fecha/número).
*   **Ordenamiento**: Ordenamiento ascendente/descendente por columna.
*   **Paginación**: Paginación automática calculada en el cliente.
*   **Acciones por Fila**: Botones de acción configurables (ej. editar, eliminar) con renderizado condicional.
*   **Exportación**: Exportación nativa a Excel (.xlsx) respetando filtros y ordenamiento actuales.
*   **Diseño Responsivo**: Estilos modernos con soporte para modo oscuro (Dark Mode).

## Instalación

Importa el componente en tu módulo o componente standalone:

```typescript
import { DynamicTable } from '@app/shared/components/dynamic-table/dynamic-table';

@Component({
  imports: [DynamicTable],
  // ...
})
export class FeatureComponent {}
```

## API

### Inputs

| Propiedad | Tipo | Por defecto | Descripción |
|-----------|------|-------------|-------------|
| `data` | `any[]` | **Requerido** | Array de objetos con los datos a mostrar. |
| `columns` | `ColumnConfig[]` | **Requerido** | Configuración de las columnas. |
| `title` | `string` | `'Dynamic Table'` | Título mostrado en la cabecera. |
| `description` | `string` | `''` | Subtítulo o descripción breve. |
| `searchPlaceholder` | `string` | `'Search...'` | Placeholder para la barra de búsqueda. |
| `filters` | `FilterConfig[]` | `[]` | Configuración de filtros laterales. |
| `actions` | `ActionButton[]` | `[]` | Botones de acción por fila. |
| `pageSize` | `number` | `10` | Cantidad de filas por página. |
| `trackBy` | `string` | `'id'` | Nombre de la propiedad única para optimización de renderizado. |
| `showAddButton` | `boolean` | `false` | Muestra un botón para agregar nuevos registros. |
| `addButtonLabel` | `string` | `'Add New'` | Texto del botón de agregar. |
| `enableExport` | `boolean` | `true` | Habilita el botón de exportar a Excel. |
| `exportFilename` | `string` | `''` | Nombre del archivo exportado (sin extensión). |
| `emptyMessage` | `string` | `'No data found'` | Mensaje mostrado cuando no hay resultados. |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `onAdd` | `void` | Se emite al hacer clic en el botón de agregar. |
| `onRowClick` | `any` | *(Definido en API pero no implementado en template actual)* |

## Configuración

### ColumnConfig

Define la estructura de cada columna.

```typescript
export interface ColumnConfig {
  key: string;        // Propiedad del objeto data a mostrar
  label: string;      // Cabecera de la columna
  type?: 'text' | 'badge' | 'image' | 'date' | 'currency'; // Tipo de visualización
  sortable?: boolean; // Habilita ordenamiento
  badgeColors?: { [key: string]: string }; // Clases CSS para valores específicos (tipo badge)
}
```

### FilterConfig

Define los filtros disponibles en la cabecera. Nota: Actualmente la UI solo renderiza filtros tipo `select`.

```typescript
export interface FilterConfig {
  type: 'select';     // Tipo de filtro
  label: string;      // Etiqueta por defecto
  key: string;        // Propiedad a filtrar
  options?: { label: string; value: any }[]; // Opciones para el select
}
```

### ActionButton

Define botones de acción en la última columna.

```typescript
export interface ActionButton {
  label: string;
  icon?: string;      // Nombre del icono de Material Symbols
  onClick: (row: any) => void; // Callback al hacer click
  class?: string;     // Clases CSS personalizadas
  condition?: (row: any) => boolean; // Mostrar botón condicionalmente
}
```

## Ejemplo de Uso

```typescript
// En tu componente.ts
columns: ColumnConfig[] = [
  { key: 'avatar', label: '', type: 'image' },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'role', label: 'Rol', type: 'badge',
    badgeColors: {
      Admin: 'bg-purple-100 text-purple-800',
      User: 'bg-blue-100 text-blue-800'
    }
  },
  { key: 'salary', label: 'Salario', type: 'currency', sortable: true },
  { key: 'joinedAt', label: 'Fecha Ingreso', type: 'date' }
];

actions: ActionButton[] = [
  {
    label: 'Editar',
    icon: 'edit',
    onClick: (row) => this.editUser(row)
  },
  {
    label: 'Borrar',
    icon: 'delete',
    class: 'text-red-500 hover:bg-red-50',
    onClick: (row) => this.deleteUser(row),
    condition: (row) => row.role !== 'Admin' // No borrar admins
  }
];

// En tu template
<app-dynamic-table
  [data]="users()"
  [columns]="columns"
  title="Usuarios"
  [actions]="actions"
  [showAddButton]="true"
  (onAdd)="createUser()"
/>
```

## Notas de Desarrollo

*   **Filtros**: El componente soporta lógica para rangos de fecha y número (`_start`, `_end`, `_min`, `_max`), aunque la interfaz de usuario actual solo expone selectores.
*   **Imágenes**: Las columnas tipo `image` muestran las iniciales del nombre si la URL de la imagen falla o no existe.
