# Today Task - PRD

## Problem Statement
App web gestora de tareas con autenticación, suscripción premium, alarmas y personalización.

## Architecture
- Backend: FastAPI + MongoDB (auth JWT, tasks CRUD, Stripe subscriptions)
- Frontend: React con CSS custom (Neo-Brutalist design)

## Core Requirements
- CRUD de tareas con fecha/hora y recordatorios
- 4 temas de colores, 3 tipografías
- Filtros: Todas/Activas/Completadas
- Ordenar por fecha o recientes
- Indicador visual de tareas próximas
- Autenticación email/contraseña con JWT httpOnly cookies
- Suscripción Stripe ($2.99/mes) para desbloquear premium features
- Anuncios placeholder para usuarios gratuitos
- 4 alarmas por defecto + importar audio personalizado (premium)

## What's Been Implemented (April 2026)
- Auth completo (register/login/logout/refresh/me)
- CRUD tareas con persistencia MongoDB por usuario
- DateTimePicker personalizado (Hoy/Mañana + manual)
- Filtros y ordenamiento
- 4 temas + 3 tipografías (bloqueadas para free)
- 4 alarmas por defecto (bloqueadas para free)
- Importar audio personalizado (bloqueado)
- Sistema de anuncios placeholder
- Suscripción Stripe con checkout
- Opciones de notificación: Ambas/Solo alarma/Solo notificación/Ninguna
- Brute force protection
- Admin seeding

## Backlog
- P0: Nada pendiente
- P1: Google AdSense real (requiere publisher ID)
- P2: Push notifications con Service Workers
- P2: Exportar/importar tareas
