# Technical Architecture: Responsive Design

## Overview
To support mobile devices, the `(dashboard)` layout is refactored to switch from a flexible row (Desktop) to a column layout (Mobile).

## Components

### 1. MobileHeader (`components/MobileHeader.tsx`)
*   **Responsibility**: Provides navigation trigger on small screens.
*   **Visibility**: `display: block` on `< md`, `display: none` on `>= md`.
*   **Props**:
    *   `onMenuClick()`: Callback to open the sidebar.

### 2. Sidebar Updates (`components/Sidebar.tsx`)
*   **Props**: Added `isOpen` (boolean) and `onClose` (function) implementation instructions (or internal state readiness).
*   **CSS behavior**:
    *   **Desktop**: `static`, flex item.
    *   **Mobile**: `fixed`, `z-50`, `inset-y-0`.
*   **Backdrop**: A `div` with `fixed inset-0 bg-black/50` is rendered when sidebar is open on mobile.

### 3. Layout (`app/(dashboard)/layout.tsx`)
*   **State Management**: Needs to manage `isMobileSidebarOpen` state to coordinate between `MobileHeader` and `Sidebar`.
*   *Correction*: Since `layout.tsx` is a Server Component, state must be managed in a Client Component wrapper or passed down efficiently. 
    *   **Decision**: We will refactor the layout to use a client-side wrapper `DashboardLayoutClient` that handles the state, OR keep `Sidebar` autonomous with an internal trigger if possible.
    *   **Refined Approach**: `Sidebar` will handle its own visibility via a ref/context, or we wrap the shell in a Client Component.

## CSS Strategy
*   Use Tailwind's generic breakpoints.
*   `md` (768px) is the primary breakpoint for switching from Mobile -> Desktop layout.
