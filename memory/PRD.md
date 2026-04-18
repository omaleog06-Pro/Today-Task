# Today Task - PRD

## Problem Statement
App web gestora de tareas con autenticación, suscripción premium, alarmas, personalización y push notifications.

## Architecture
- Backend: FastAPI + MongoDB (auth JWT, tasks CRUD, Stripe subscriptions)
- Frontend: React con CSS custom (Neo-Brutalist design)
- Service Worker: Push notifications en segundo plano

## What's Been Implemented (April 2026)
- Auth completo (register/login/logout/refresh/me)
- CRUD tareas con persistencia MongoDB por usuario
- DateTimePicker personalizado (Hoy/Mañana + manual)
- Filtros (Todas/Activas/Completadas) y ordenamiento
- 4 temas + 3 tipografías (bloqueadas para free)
- 4 alarmas por defecto + importar audio (bloqueado para free)
- Sistema de anuncios placeholder
- Suscripción Stripe con checkout ($2.99/mes)
- Opciones de notificación: Ambas/Solo alarma/Solo notificación/Ninguna
- Service Worker para push notifications en segundo plano
- Banner de permisos de notificación
- Brute force protection
- Admin seeding

## Backlog
- P1: Google AdSense real (requiere publisher ID)
- P2: Exportar/importar tareas en JSON
- P2: Sistema de racha/streak diario
- P3: Categorías de tareas (Trabajo, Personal, Compras)
