# Graph Report - src  (2026-10-16)

## Corpus Check
- 122 files · ~178,146 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 641 nodes · 1714 edges · 41 communities (40 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c063c8f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OrderBoard.jsx
- CustomerMenu.jsx
- CreateHotel.jsx
- ReservationBoard.jsx
- GlobalProvider.jsx
- App.jsx
- Dashboard/index.jsx
- user-layout.component.jsx
- AppSelect.jsx
- services/index.js
- masterConfigs.jsx
- permissions.js
- useAuth
- StaffPage.jsx
- baseAPI.js
- Areas.jsx
- TableDetails.jsx
- MasterPage.jsx
- MenuCategories.jsx
- AdminUsers.jsx
- ConfirmDialog.jsx
- InactiveUsers.jsx
- StaffUsers.jsx
- PopupModal.jsx
- UserAccessPage.jsx
- getApiErrorMessage
- AppErrorBoundary
- Login.jsx
- useGlobalMaster
- SettingsHome.jsx

## God Nodes (most connected - your core abstractions)
1. `useToast()` - 33 edges
2. `useGlobalMaster()` - 31 edges
3. `useAuth()` - 30 edges
4. `getApiErrorMessage()` - 28 edges
5. `usePermission()` - 24 edges
6. `ReservationBoard()` - 23 edges
7. `isStaffRole()` - 22 edges
8. `PopupModal()` - 21 edges
9. `OrderBoard()` - 21 edges
10. `CreateHotel()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `AdminUsers()` --calls--> `usePermission()`  [EXTRACTED]
  pages/Settings/AdminUsers/AdminUsers.jsx → hooks/usePermission.js
- `SettingsHome()` --calls--> `usePermission()`  [EXTRACTED]
  pages/Settings/SettingsHome.jsx → hooks/usePermission.js
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  App.jsx → hooks/useAuth.js
- `AttachmentUpload()` --calls--> `useToast()`  [EXTRACTED]
  components/common/AttachmentUpload.jsx → hooks/useToast.js
- `useInstallState()` --indirect_call--> `getInstallState()`  [INFERRED]
  components/common/InstallApp.jsx → utils/pwaInstall.js

## Import Cycles
- None detected.

## Communities (41 total, 1 thin omitted)

### Community 0 - "OrderBoard.jsx"
Cohesion: 0.06
Nodes (57): CANCEL_REASON_MAX, CancelOrderDialog(), REASONS, ItemNote(), noteToPreferences(), COLUMN_ORDER, COOK_EDITABLE, DEFAULT_COLORS (+49 more)

### Community 1 - "CustomerMenu.jsx"
Cohesion: 0.07
Nodes (43): useToast(), initialsOf(), ReservationCard(), ReservationPage(), slotOf(), CLOSED_ORDER_STATUSES, CLOSED_RESERVATION_STATUSES, CustomerMenu() (+35 more)

### Community 2 - "CreateHotel.jsx"
Cohesion: 0.06
Nodes (36): BookedTableDetails, HotelDetails, KanbanBoard(), suppressNextClick(), LogoAvatarShowLetter(), SkeletonLoading(), ToolTipPopup(), colorCodeCardName (+28 more)

### Community 3 - "ReservationBoard.jsx"
Cohesion: 0.08
Nodes (42): SelectDropDown(), CreateOrderDialog(), unwrapList(), COOKING_ORDER_STATUSES, groupDishes(), lineStageId(), progressOf(), STAGE_PROGRESS (+34 more)

### Community 4 - "GlobalProvider.jsx"
Cohesion: 0.07
Nodes (26): ThemeToggle(), ToastDialog(), root, root, reportWebVitals(), GlobalContext, GlobalProvider(), initialState (+18 more)

### Community 5 - "App.jsx"
Cohesion: 0.08
Nodes (15): BookTables, Cleaners, Cooks, CreateHotel, Dashboard, Home, NoAccess, NotFound (+7 more)

### Community 6 - "Dashboard/index.jsx"
Cohesion: 0.13
Nodes (20): BOARD_FILTER_OPTIONS, CHART_THEME, Dashboard(), greeting(), ORDER_STATUS_ROWS, percent(), rupees(), STATUS_ROWS (+12 more)

### Community 7 - "user-layout.component.jsx"
Cohesion: 0.18
Nodes (21): AppInstallsBadge(), PLATFORM_LABELS, INSTALL_STEPS, InstallAppBanner(), InstallStepsDialog(), stepsKeyFor(), useInstallState(), UserLayout() (+13 more)

### Community 8 - "AppSelect.jsx"
Cohesion: 0.17
Nodes (21): AppSelect(), getPortalHost(), onPageScroll(), portalClosed(), portalCloseRequest(), portalOpened(), remeasure(), AddMenu() (+13 more)

### Community 9 - "services/index.js"
Cohesion: 0.12
Nodes (11): createCleaner(), createCook(), createServer(), deleteCleaner(), deleteCook(), deleteServer(), getCleaners(), getServers() (+3 more)

### Community 10 - "masterConfigs.jsx"
Cohesion: 0.14
Nodes (16): effectiveColor(), isUnset(), MASTER_KEYS, ORDER_DEFAULT_COLORS, statusMaster(), titleCase(), createLocation(), createSpiceLevel() (+8 more)

### Community 11 - "permissions.js"
Cohesion: 0.33
Nodes (13): App(), usePermission(), StaffUsers(), can(), homePathFor(), isStaffMember(), isStaffRole(), isSuperAdmin() (+5 more)

### Community 12 - "useAuth"
Cohesion: 0.22
Nodes (12): ADMIN_LINKS, CUSTOMER_LINKS, readCollapsed(), SETTINGS_GROUP, SideNav(), USERS_GROUP, useAuth(), getLogin() (+4 more)

### Community 13 - "StaffPage.jsx"
Cohesion: 0.25
Nodes (12): AVATAR_COLORS, avatarColorOf(), initialsOf(), StaffAvatar(), EMPTY_PERSONAL, formatClock(), GENDERS, PERSONAL_FIELDS (+4 more)

### Community 14 - "baseAPI.js"
Cohesion: 0.17
Nodes (5): configuredApiBaseUrl, isApiBaseUrlConfigured, API, axiosBase, refreshClient

### Community 15 - "Areas.jsx"
Cohesion: 0.27
Nodes (10): Areas, ClampText(), Areas(), emptyForm, listOf(), createArea(), deleteArea(), getAllArea() (+2 more)

### Community 16 - "TableDetails.jsx"
Cohesion: 0.30
Nodes (11): SEAT_FALLBACK, TableDetails(), tableLabel(), addSeatInTable(), createReservation(), createTable(), deleteSeatInTable(), deleteTable() (+3 more)

### Community 18 - "MasterPage.jsx"
Cohesion: 0.27
Nodes (8): MasterPage, useIncrementalRows(), MASTERS, emptyFormOf(), listOf(), MasterPage(), SettingsBackLink(), MASTER_PERMISSION

### Community 19 - "MenuCategories.jsx"
Cohesion: 0.29
Nodes (10): MenuCategories, categoryId(), DEFAULT_CATEGORY_NAMES, emptyForm, isActive(), MenuCategories(), unwrapList(), createMenuCategory() (+2 more)

### Community 20 - "AdminUsers.jsx"
Cohesion: 0.20
Nodes (9): AdminUsers, ADMIN_API, ADMIN_CONFIG, AdminUsers(), createAdminUser(), getAdminUsers(), getPermissionCatalog(), removeAdminUser() (+1 more)

### Community 21 - "ConfirmDialog.jsx"
Cohesion: 0.29
Nodes (6): AttachmentUpload(), ConfirmDialog(), TONE_ICON, Spinner(), appConstants, getFileTypeClassName()

### Community 22 - "InactiveUsers.jsx"
Cohesion: 0.36
Nodes (8): InactiveUsers, formatDate(), InactiveUsers(), listOf(), previousOf(), RESTORE_LABELS, getRemovedUsers(), restoreUser()

### Community 23 - "StaffUsers.jsx"
Cohesion: 0.22
Nodes (8): StaffUsers, CATEGORY_PRESETS, STAFF_API, createStaffUser(), getStaffPermissionCatalog(), getStaffUsers(), removeStaffUser(), updateStaffUser()

### Community 24 - "PopupModal.jsx"
Cohesion: 0.39
Nodes (5): CustomDatePicker(), getDualCalendarMonths(), parseSavedRangeDefault(), PopupModal(), AssignStaffDialog()

### Community 25 - "UserAccessPage.jsx"
Cohesion: 0.32
Nodes (7): ACTION_LABELS, ACTIONS, emptyForm, jobOf(), listOf(), UserAccessPage(), PAGE_LABELS

### Community 26 - "getApiErrorMessage"
Cohesion: 0.43
Nodes (7): emptyForm, isActive(), SideDishesDialog(), createCategorySideDish(), deleteCategorySideDish(), updateCategorySideDish(), getApiErrorMessage()

### Community 28 - "Login.jsx"
Cohesion: 0.47
Nodes (5): Login, features, Login(), createUser(), getOTp()

### Community 29 - "useGlobalMaster"
Cohesion: 0.60
Nodes (5): useGlobalMaster(), getDiningStatus(), getOrderStatuses(), getPaymentStatuses(), getSeatsStatusMatsers()

### Community 30 - "SettingsHome.jsx"
Cohesion: 0.50
Nodes (3): SettingsHome, SETTINGS_SECTIONS, SettingsHome()

## Knowledge Gaps
- **94 isolated node(s):** `PLATFORM_LABELS`, `REASONS`, `CANCEL_REASON_MAX`, `TONE_ICON`, `INSTALL_STEPS` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useToast()` connect `CustomerMenu.jsx` to `OrderBoard.jsx`, `CreateHotel.jsx`, `ReservationBoard.jsx`, `GlobalProvider.jsx`, `AppSelect.jsx`, `useAuth`, `StaffPage.jsx`, `TableDetails.jsx`, `ConfirmDialog.jsx`, `Login.jsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `CustomerMenu.jsx`, `CreateHotel.jsx`, `App.jsx`, `Dashboard/index.jsx`, `user-layout.component.jsx`, `permissions.js`, `TableDetails.jsx`, `Login.jsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useGlobalMaster()` connect `useGlobalMaster` to `OrderBoard.jsx`, `CustomerMenu.jsx`, `CreateHotel.jsx`, `ReservationBoard.jsx`, `Dashboard/index.jsx`, `useAuth`, `Areas.jsx`, `TableDetails.jsx`, `MasterPage.jsx`, `getApiErrorMessage`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `PLATFORM_LABELS`, `REASONS`, `CANCEL_REASON_MAX` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OrderBoard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05827505827505827 - nodes in this community are weakly interconnected._
- **Should `CustomerMenu.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `CreateHotel.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06397306397306397 - nodes in this community are weakly interconnected._