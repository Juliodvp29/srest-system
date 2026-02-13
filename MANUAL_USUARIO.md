# Manual de Usuario - Sistema SREST (Restaurante)

Bienvenido al manual de usuario del sistema **SREST**. Este documento está diseñado para ayudarte a comprender y utilizar todas las funciones del sistema, desde la toma de pedidos hasta la gestión de inventarios y reportes.

---

## Indice
1. [Acceso al Sistema](#1-acceso-al-sistema)
2. [Punto de Venta (POS)](#2-punto-de-venta-pos)
   - [Vista de Mesas](#vista-de-mesas)
   - [Tomar un Pedido](#tomar-un-pedido)
   - [Dividir Cuenta](#dividir-cuenta)
   - [Proceso de Pago](#proceso-de-pago)
3. [Gestión de Cocina](#3-gestión-de-cocina)
4. [Reservaciones](#4-reservaciones)
5. [Inventario y Stock](#5-inventario-y-stock)
6. [Administración](#6-administración)
   - [Productos y Categorías](#productos-y-categorías)
   - [Empleados y Mesas](#empleados-y-mesas)
7. [Reportes](#7-reportes)

---

## 1. Acceso al Sistema

Para ingresar al sistema, utiliza tus credenciales proporcionadas por el administrador.
- **Correo Electrónico**: Tu identificador de usuario.
- **Contraseña**: Tu clave personal.

> [!IMPORTANT]
> Nunca compartas tu contraseña con otros empleados. Cada acción realizada en el sistema queda registrada con tu usuario para fines de auditoría.

---

## 2. Punto de Venta (POS)

Este es el módulo principal para el personal de servicio (meseros y cajeros).

### Vista de Mesas
Al entrar a **POS > Mesas**, verás un mapa o lista de las mesas del restaurante.
- **Verde**: Mesa Disponible.
- **Rojo/Ocupado**: Mesa con pedido activo.
- **Amarillo/Reservado**: Mesa con una reserva próxima.

### Tomar un Pedido
1. Haz clic en una mesa disponible.
2. Selecciona los productos de las categorías (Entradas, Platos Fuertes, Bebidas, etc.).
3. Si un producto tiene **Modificadores** (ej. "Término de la carne"), selecciónalos.
4. Presiona **Enviar a Cocina** para que el pedido aparezca en la pantalla de cocina.

### Dividir Cuenta (Split Bill)
Si los clientes desean pagar por separado:
1. Dentro del detalle del pedido, selecciona **Dividir Cuenta**.
2. Arrastra los productos a las diferentes "sub-cuentas".
3. El sistema generará tickets independientes para cada cliente.

### Proceso de Pago
1. Haz clic en **Pagar**.
2. Selecciona el método de pago: **Efectivo**, **Tarjeta** o **Transferencia**.
3. Ingresa el monto recibido (el sistema calculará el cambio si es efectivo).
4. El sistema cerrará la mesa y la pondrá como disponible nuevamente.

---

## 3. Gestión de Cocina

Este módulo es exclusivo para el personal de cocina y barra.
- Los pedidos aparecen en orden de llegada.
- Cada pedido muestra el tiempo transcurrido desde que se tomó.
- Haz clic en **Preparando** para indicar que has iniciado.
- Haz clic en **Listo** para notificar al mesero que el plato puede ser retirado.

---

## 4. Reservaciones

Permite gestionar las visitas futuras de los clientes.
- **Calendario**: Visualiza las reservas por día y hora.
- **Nueva Reserva**: Registra el nombre del cliente, número de personas, fecha, hora y mesa preferida.
- **Confirmación**: Puedes marcar una reserva como "Confirmada" o "Cancelada".

---

## 5. Inventario y Stock

Controla los insumos y productos del restaurante.
- **Artículos**: Lista de todos los insumos (ej. Harina, Tomate, Refrescos).
- **Movimientos**: Registra entradas (compras) y salidas (mermas o uso manual).
- **Bajo Stock**: El sistema te alertará automáticamente cuando un producto esté por agotarse.
- **Recetas**: Permite asociar insumos a un plato (ej. una hamburguesa descuenta 1 pan y 200g de carne).

---

## 6. Administración

Módulo para gerentes y dueños.

### Productos y Categorías
- Crea nuevos platos, dales un precio e imagen.
- Organiza los platos en categorías para que sea más fácil encontrarlos en el POS.

### Empleados y Mesas
- Gestiona el personal y sus permisos (Roles: Admin, Mesero, Chef, Cajero).
- Configura la disposición de las mesas del local.

---

## 7. Reportes

Analiza el rendimiento de tu negocio.
- **Ventas Diarias**: Resumen de ingresos por día.
- **Productos más Vendidos**: Identifica qué platos son los favoritos de tus clientes.
- **Reporte por Mesero**: Evalúa el desempeño de tu personal de servicio.

---

> [!TIP]
> Si tienes problemas con el sistema, intenta recargar la página o contacta al soporte técnico institucional.
