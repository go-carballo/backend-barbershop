# Notifications

Two-line summary: Notify barber and client on appointment lifecycle events (create, status change, cancellation) via both in-app inbox and email, persisted in DB so users can review later.

## Specs

S1: Every appointment event (create, confirm, cancel, complete) produces an in-app notification for every affected participant (barber + customer) with fields `type`, `title`, `body`, `read: false`, `userId`, and `appointmentId`.

S2: Each appointment event sends a parallel email to every affected participant. In dev mode emails are logged to the console instead of sent. In production, emails are sent via SMTP (nodemailer).

S3: Notifications are persisted in a new `notifications` table so users can browse an inbox (list, detail, mark as read) at any time.

S4: The frontend renders a notification bell in the sidebar with an unread count badge, shows an in-app toast on arrival (polling-based), and provides an `/app/notifications` page to browse the inbox.

S5: The `Notification` entity has these fields: `id` (UUID), `type` (varchar, indexed), `title` (varchar, 200), `body` (text), `read` (boolean, default false), `userId` (UUID, not null), `appointmentId` (UUID, nullable, indexed), `emailSent` (boolean, default false), `sentAt` (datetime, nullable), `createdAt` (datetime).

S6: The backend exposes a `GET /notifications` endpoint (paginated, list unread first, mark-as-read `PATCH /notifications/:id`), same auth guards as the rest of the API.

S7: The appointment lifecycle (create, status change) automatically triggers notifications. No separate API call is required.

S8: The email service is configurable via environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. If `SMTP_HOST` is not set, emails are silently dropped in production and logged in dev.

S9: Reminder emails are not implemented in this scope (would require a scheduled worker/queue).

S10: The notification service uses an internal event emitter to decouple appointment changes from notification sending, allowing future listeners (SMS, push) to be added without modifying appointment code.

## Tasks

| ID | Specs | Route | Commit |
|----|-------|-------|--------|
| T1 | S5 | backend | ✅ e0f5146 |
| T2 | S1, S6 | backend | ✅ e0f5146 |
| T3 | S2, S8 | backend | ✅ e0f5146 |
| T4 | S7, S10 | backend | ✅ e0f5146 |
| T5 | S3, S4 | frontend | ⬜ |
| T6 | S4 | frontend | ⬜ |
| T7 | S4 | frontend | ⬜ |
| T8 | S4 | frontend | ⬜ |

## Log

L1: Add full notification system — in-app inbox + email delivery, with appointment lifecycle integration and polling-based real-time updates. User wants all three: in-app only, all events, and persistence.

L2: Fixed 5 bugs in notification system:
- Security: derive target scope from JWT role, not query params
- markAsRead: handle all target types (user/customer/barber)
- countByCustomer: clarified API semantics
- Barber email: now sends email to barber on appointment creation
- Event emitter: decoupled notification sending via @nestjs/event-emitter (S10)