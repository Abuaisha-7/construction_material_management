-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `email`(`email`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,

    INDEX `user_roles_role_id_fkey`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,

    INDEX `role_permissions_permission_id_fkey`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` CHAR(36) NOT NULL,
    `project_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NULL,
    `client_name` VARCHAR(255) NULL,
    `contractor_name` VARCHAR(255) NULL,
    `consultant_name` VARCHAR(255) NULL,
    `project_manager_id` CHAR(36) NULL,
    `start_date` DATE NULL,
    `completion_date` DATE NULL,
    `contract_value` DECIMAL(18, 2) NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `status` ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `description` TEXT NULL,
    `image_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_code`(`project_code`),
    INDEX `projects_status_idx`(`status`),
    INDEX `projects_project_manager_id_fkey`(`project_manager_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buildings` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `buildings_project_id_idx`(`project_id`),
    UNIQUE INDEX `uq_building_project_code`(`project_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zones` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `building_id` CHAR(36) NULL,
    `code` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `zones_building_id_fkey`(`building_id`),
    INDEX `zones_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `building_id` CHAR(36) NULL,
    `zone_id` CHAR(36) NULL,
    `code` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_building_id_fkey`(`building_id`),
    INDEX `activities_project_id_fkey`(`project_id`),
    INDEX `activities_zone_id_fkey`(`zone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materials` (
    `id` CHAR(36) NOT NULL,
    `material_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `unit_id` CHAR(36) NOT NULL,
    `specification` TEXT NULL,
    `standard` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `estimated_unit_price` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `current_unit_price` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `minimum_stock` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `reorder_level` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `maximum_stock` DECIMAL(18, 3) NULL,
    `requires_inspection` BOOLEAN NOT NULL DEFAULT true,
    `requires_certificate` BOOLEAN NOT NULL DEFAULT false,
    `storage_requirements` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_code`(`material_code`),
    INDEX `materials_is_active_idx`(`is_active`),
    INDEX `idx_materials_category`(`category_id`),
    INDEX `idx_materials_unit`(`unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` CHAR(36) NOT NULL,
    `supplier_code` VARCHAR(50) NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `contact_person` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `registration_number` VARCHAR(100) NULL,
    `tax_number` VARCHAR(100) NULL,
    `license_number` VARCHAR(100) NULL,
    `rating` DECIMAL(3, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `supplier_code`(`supplier_code`),
    INDEX `suppliers_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_suppliers` (
    `material_id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `preferred` BOOLEAN NOT NULL DEFAULT false,
    `supplier_unit_price` DECIMAL(18, 2) NULL,
    `lead_time_days` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_suppliers_supplier_id_fkey`(`supplier_id`),
    PRIMARY KEY (`material_id`, `supplier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NULL,
    `responsible_user_id` CHAR(36) NULL,
    `capacity_description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `warehouses_project_id_idx`(`project_id`),
    UNIQUE INDEX `uq_warehouse_project_code`(`project_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage_locations` (
    `id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location_type` VARCHAR(50) NULL,
    `capacity` DECIMAL(18, 3) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `storage_locations_warehouse_id_idx`(`warehouse_id`),
    UNIQUE INDEX `uq_storage_warehouse_code`(`warehouse_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_requests` (
    `id` CHAR(36) NOT NULL,
    `request_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NOT NULL,
    `building_id` CHAR(36) NULL,
    `zone_id` CHAR(36) NULL,
    `activity_id` CHAR(36) NULL,
    `request_date` DATE NOT NULL,
    `required_date` DATE NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `purpose` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PARTIALLY_SUPPLIED', 'FULLY_SUPPLIED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `request_number`(`request_number`),
    INDEX `idx_material_requests_date`(`request_date`),
    INDEX `idx_material_requests_project`(`project_id`),
    INDEX `idx_material_requests_status`(`status`),
    INDEX `material_requests_activity_id_fkey`(`activity_id`),
    INDEX `material_requests_building_id_fkey`(`building_id`),
    INDEX `material_requests_requested_by_fkey`(`requested_by`),
    INDEX `material_requests_zone_id_fkey`(`zone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_request_items` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `requested_quantity` DECIMAL(18, 3) NOT NULL,
    `approved_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `supplied_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `issued_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `estimated_unit_price` DECIMAL(18, 2) NULL,
    `remarks` TEXT NULL,

    INDEX `material_request_items_material_id_fkey`(`material_id`),
    INDEX `material_request_items_request_id_fkey`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_request_approvals` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `approver_id` CHAR(36) NOT NULL,
    `action` ENUM('APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'RETURNED') NOT NULL,
    `approved_quantity` DECIMAL(18, 3) NULL,
    `comments` TEXT NULL,
    `action_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_request_approvals_approver_id_fkey`(`approver_id`),
    INDEX `material_request_approvals_request_id_fkey`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `material_request_id` CHAR(36) NULL,
    `purchase_order_number` VARCHAR(50) NOT NULL,
    `order_date` DATE NOT NULL,
    `expected_delivery_date` DATE NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `subtotal` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `remarks` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `purchase_order_number`(`purchase_order_number`),
    INDEX `purchase_orders_status_idx`(`status`),
    INDEX `purchase_orders_created_by_fkey`(`created_by`),
    INDEX `purchase_orders_project_id_fkey`(`project_id`),
    INDEX `purchase_orders_supplier_id_fkey`(`supplier_id`),
    INDEX `purchase_orders_material_request_id_fkey`(`material_request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` CHAR(36) NOT NULL,
    `purchase_order_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `ordered_quantity` DECIMAL(18, 3) NOT NULL,
    `unit_price` DECIMAL(18, 2) NOT NULL,
    `received_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,

    INDEX `purchase_order_items_material_id_fkey`(`material_id`),
    INDEX `purchase_order_items_purchase_order_id_fkey`(`purchase_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_received_notes` (
    `id` CHAR(36) NOT NULL,
    `grn_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `purchase_order_id` CHAR(36) NULL,
    `delivery_date` DATE NOT NULL,
    `delivery_note_number` VARCHAR(100) NULL,
    `vehicle_number` VARCHAR(50) NULL,
    `driver_name` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'AWAITING_INSPECTION', 'PARTIALLY_ACCEPTED', 'ACCEPTED', 'REJECTED', 'POSTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `received_by` CHAR(36) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `grn_number`(`grn_number`),
    INDEX `goods_received_notes_status_idx`(`status`),
    INDEX `goods_received_notes_purchase_order_id_fkey`(`purchase_order_id`),
    INDEX `goods_received_notes_received_by_fkey`(`received_by`),
    INDEX `idx_grn_date`(`delivery_date`),
    INDEX `idx_grn_project`(`project_id`),
    INDEX `idx_grn_supplier`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grn_items` (
    `id` CHAR(36) NOT NULL,
    `grn_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `ordered_quantity` DECIMAL(18, 3) NULL,
    `delivered_quantity` DECIMAL(18, 3) NOT NULL,
    `damaged_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `rejected_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `accepted_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `unit_id` CHAR(36) NOT NULL,
    `batch_number` VARCHAR(100) NULL,
    `manufacturing_date` DATE NULL,
    `expiry_date` DATE NULL,
    `storage_location_id` CHAR(36) NULL,
    `remarks` TEXT NULL,

    INDEX `grn_items_grn_id_fkey`(`grn_id`),
    INDEX `grn_items_material_id_fkey`(`material_id`),
    INDEX `grn_items_storage_location_id_fkey`(`storage_location_id`),
    INDEX `grn_items_unit_id_fkey`(`unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_inspections` (
    `id` CHAR(36) NOT NULL,
    `inspection_number` VARCHAR(50) NOT NULL,
    `grn_id` CHAR(36) NOT NULL,
    `inspection_date` DATE NOT NULL,
    `inspector_id` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `decision` ENUM('ACCEPTED', 'CONDITIONALLY_ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'QUARANTINED') NULL,
    `remarks` TEXT NULL,
    `corrective_action` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `inspection_number`(`inspection_number`),
    INDEX `material_inspections_inspection_date_idx`(`inspection_date`),
    INDEX `material_inspections_grn_id_fkey`(`grn_id`),
    INDEX `material_inspections_inspector_id_fkey`(`inspector_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspection_items` (
    `id` CHAR(36) NOT NULL,
    `inspection_id` CHAR(36) NOT NULL,
    `grn_item_id` CHAR(36) NOT NULL,
    `quantity_inspected` DECIMAL(18, 3) NULL,
    `quantity_accepted` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `quantity_conditionally_accepted` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `quantity_quarantined` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `quantity_rejected` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `specification` TEXT NULL,
    `required_standard` VARCHAR(100) NULL,
    `certificate_number` VARCHAR(100) NULL,
    `test_required` BOOLEAN NOT NULL DEFAULT false,
    `test_result` TEXT NULL,
    `remarks` TEXT NULL,
    `materialId` CHAR(36) NULL,

    INDEX `inspection_items_grn_item_id_fkey`(`grn_item_id`),
    INDEX `inspection_items_inspection_id_fkey`(`inspection_id`),
    INDEX `inspection_items_materialId_fkey`(`materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_balances` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `storage_location_id` CHAR(36) NULL,
    `physical_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `reserved_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `average_unit_cost` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `stock_value` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_inventory_material`(`material_id`),
    INDEX `idx_inventory_project`(`project_id`),
    INDEX `inventory_balances_storage_location_id_fkey`(`storage_location_id`),
    INDEX `inventory_balances_warehouse_id_fkey`(`warehouse_id`),
    UNIQUE INDEX `uq_inventory_location`(`project_id`, `material_id`, `warehouse_id`, `storage_location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transactions` (
    `id` CHAR(36) NOT NULL,
    `transaction_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `storage_location_id` CHAR(36) NULL,
    `transaction_type` ENUM('OPENING_BALANCE', 'RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'LOSS', 'DISPOSAL', 'REVERSAL') NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `unit_cost` DECIMAL(18, 2) NULL,
    `total_value` DECIMAL(18, 2) NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` CHAR(36) NULL,
    `transaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `performed_by` CHAR(36) NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `transaction_number`(`transaction_number`),
    INDEX `inventory_transactions_transaction_type_idx`(`transaction_type`),
    INDEX `inventory_transactions_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    INDEX `idx_inventory_transactions_date`(`transaction_date`),
    INDEX `idx_inventory_transactions_material`(`material_id`),
    INDEX `idx_inventory_transactions_project`(`project_id`),
    INDEX `inventory_transactions_performed_by_fkey`(`performed_by`),
    INDEX `inventory_transactions_storage_location_id_fkey`(`storage_location_id`),
    INDEX `inventory_transactions_warehouse_id_fkey`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_issues` (
    `id` CHAR(36) NOT NULL,
    `issue_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NULL,
    `approved_by` CHAR(36) NULL,
    `receiver_id` CHAR(36) NULL,
    `activity_id` CHAR(36) NULL,
    `building_id` CHAR(36) NULL,
    `zone_id` CHAR(36) NULL,
    `issue_date` DATE NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_ISSUED', 'ISSUED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `purpose` TEXT NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `issue_number`(`issue_number`),
    INDEX `material_issues_status_idx`(`status`),
    INDEX `material_issues_issue_date_idx`(`issue_date`),
    INDEX `idx_material_issues_project`(`project_id`),
    INDEX `material_issues_activity_id_fkey`(`activity_id`),
    INDEX `material_issues_approved_by_fkey`(`approved_by`),
    INDEX `material_issues_building_id_fkey`(`building_id`),
    INDEX `material_issues_receiver_id_fkey`(`receiver_id`),
    INDEX `material_issues_requested_by_fkey`(`requested_by`),
    INDEX `material_issues_warehouse_id_fkey`(`warehouse_id`),
    INDEX `material_issues_zone_id_fkey`(`zone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_issue_items` (
    `id` CHAR(36) NOT NULL,
    `issue_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `approved_quantity` DECIMAL(18, 3) NOT NULL,
    `issued_quantity` DECIMAL(18, 3) NOT NULL,
    `unit_cost` DECIMAL(18, 2) NULL,
    `storage_location_id` CHAR(36) NULL,

    INDEX `material_issue_items_issue_id_fkey`(`issue_id`),
    INDEX `material_issue_items_material_id_fkey`(`material_id`),
    INDEX `material_issue_items_storage_location_id_fkey`(`storage_location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_returns` (
    `id` CHAR(36) NOT NULL,
    `return_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `original_issue_id` CHAR(36) NULL,
    `returned_by` CHAR(36) NULL,
    `received_by` CHAR(36) NULL,
    `return_date` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('PENDING', 'INSPECTED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `return_number`(`return_number`),
    INDEX `material_returns_return_date_idx`(`return_date`),
    INDEX `material_returns_original_issue_id_fkey`(`original_issue_id`),
    INDEX `material_returns_project_id_fkey`(`project_id`),
    INDEX `material_returns_received_by_fkey`(`received_by`),
    INDEX `material_returns_returned_by_fkey`(`returned_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_return_items` (
    `id` CHAR(36) NOT NULL,
    `return_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `issued_quantity` DECIMAL(18, 3) NULL,
    `consumed_quantity` DECIMAL(18, 3) NULL,
    `returned_quantity` DECIMAL(18, 3) NOT NULL,
    `damaged_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `accepted_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `rejected_quantity` DECIMAL(18, 3) NOT NULL DEFAULT 0.000,
    `condition_status` ENUM('GOOD', 'DAMAGED', 'UNUSABLE', 'UNKNOWN') NULL,
    `remarks` TEXT NULL,

    INDEX `material_return_items_material_id_fkey`(`material_id`),
    INDEX `material_return_items_return_id_fkey`(`return_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_counts` (
    `id` CHAR(36) NOT NULL,
    `count_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NULL,
    `count_date` DATE NOT NULL,
    `counted_by` CHAR(36) NULL,
    `verified_by` CHAR(36) NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED') NOT NULL DEFAULT 'DRAFT',
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `count_number`(`count_number`),
    INDEX `stock_counts_count_date_idx`(`count_date`),
    INDEX `stock_counts_counted_by_fkey`(`counted_by`),
    INDEX `stock_counts_project_id_fkey`(`project_id`),
    INDEX `stock_counts_verified_by_fkey`(`verified_by`),
    INDEX `stock_counts_warehouse_id_fkey`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_count_items` (
    `id` CHAR(36) NOT NULL,
    `stock_count_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `storage_location_id` CHAR(36) NULL,
    `system_quantity` DECIMAL(18, 3) NOT NULL,
    `physical_quantity` DECIMAL(18, 3) NOT NULL,
    `reason` TEXT NULL,

    INDEX `stock_count_items_material_id_fkey`(`material_id`),
    INDEX `stock_count_items_stock_count_id_fkey`(`stock_count_id`),
    INDEX `stock_count_items_storage_location_id_fkey`(`storage_location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_adjustments` (
    `id` CHAR(36) NOT NULL,
    `adjustment_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NULL,
    `approved_by` CHAR(36) NULL,
    `adjustment_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `reason` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `adjustment_number`(`adjustment_number`),
    INDEX `stock_adjustments_status_idx`(`status`),
    INDEX `stock_adjustments_approved_by_fkey`(`approved_by`),
    INDEX `stock_adjustments_project_id_fkey`(`project_id`),
    INDEX `stock_adjustments_requested_by_fkey`(`requested_by`),
    INDEX `stock_adjustments_warehouse_id_fkey`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_consumption` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `activity_id` CHAR(36) NULL,
    `building_id` CHAR(36) NULL,
    `zone_id` CHAR(36) NULL,
    `issue_id` CHAR(36) NULL,
    `consumption_date` DATE NOT NULL,
    `planned_quantity` DECIMAL(18, 3) NULL,
    `issued_quantity` DECIMAL(18, 3) NULL,
    `returned_quantity` DECIMAL(18, 3) NULL,
    `consumed_quantity` DECIMAL(18, 3) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_consumption_consumption_date_idx`(`consumption_date`),
    INDEX `idx_material_consumption_material`(`material_id`),
    INDEX `material_consumption_activity_id_fkey`(`activity_id`),
    INDEX `material_consumption_building_id_fkey`(`building_id`),
    INDEX `material_consumption_issue_id_fkey`(`issue_id`),
    INDEX `material_consumption_project_id_fkey`(`project_id`),
    INDEX `material_consumption_zone_id_fkey`(`zone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_wastage` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `activity_id` CHAR(36) NULL,
    `building_id` CHAR(36) NULL,
    `wastage_date` DATE NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `reason` TEXT NOT NULL,
    `reported_by` CHAR(36) NULL,
    `approved_by` CHAR(36) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_wastage_wastage_date_idx`(`wastage_date`),
    INDEX `idx_material_wastage_material`(`material_id`),
    INDEX `material_wastage_activity_id_fkey`(`activity_id`),
    INDEX `material_wastage_approved_by_fkey`(`approved_by`),
    INDEX `material_wastage_building_id_fkey`(`building_id`),
    INDEX `material_wastage_project_id_fkey`(`project_id`),
    INDEX `material_wastage_reported_by_fkey`(`reported_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NULL,
    `document_type` VARCHAR(50) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` TEXT NOT NULL,
    `mime_type` VARCHAR(100) NULL,
    `file_size` BIGINT NULL,
    `uploaded_by` CHAR(36) NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    INDEX `documents_project_id_fkey`(`project_id`),
    INDEX `documents_uploaded_by_fkey`(`uploaded_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `notification_type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'APPROVAL', 'INVENTORY', 'MATERIAL', 'PROCUREMENT', 'INSPECTION') NOT NULL DEFAULT 'INFO',
    `reference_type` VARCHAR(50) NULL,
    `reference_id` CHAR(36) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_created_at_idx`(`created_at`),
    INDEX `idx_notifications_user_read`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` CHAR(36) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_created_at_idx`(`created_at`),
    INDEX `idx_audit_entity`(`entity_type`, `entity_id`),
    INDEX `idx_audit_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_project_manager_id_fkey` FOREIGN KEY (`project_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buildings` ADD CONSTRAINT `buildings_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `zones` ADD CONSTRAINT `zones_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `zones` ADD CONSTRAINT `zones_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `material_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_suppliers` ADD CONSTRAINT `material_suppliers_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_suppliers` ADD CONSTRAINT `material_suppliers_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_locations` ADD CONSTRAINT `storage_locations_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_items` ADD CONSTRAINT `material_request_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_items` ADD CONSTRAINT `material_request_items_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_approvals` ADD CONSTRAINT `material_request_approvals_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_approvals` ADD CONSTRAINT `material_request_approvals_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_material_request_id_fkey` FOREIGN KEY (`material_request_id`) REFERENCES `material_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_received_by_fkey` FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grn_items` ADD CONSTRAINT `grn_items_grn_id_fkey` FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grn_items` ADD CONSTRAINT `grn_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grn_items` ADD CONSTRAINT `grn_items_storage_location_id_fkey` FOREIGN KEY (`storage_location_id`) REFERENCES `storage_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grn_items` ADD CONSTRAINT `grn_items_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_inspections` ADD CONSTRAINT `material_inspections_grn_id_fkey` FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_inspections` ADD CONSTRAINT `material_inspections_inspector_id_fkey` FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_grn_item_id_fkey` FOREIGN KEY (`grn_item_id`) REFERENCES `grn_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_inspection_id_fkey` FOREIGN KEY (`inspection_id`) REFERENCES `material_inspections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_balances` ADD CONSTRAINT `inventory_balances_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_balances` ADD CONSTRAINT `inventory_balances_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_balances` ADD CONSTRAINT `inventory_balances_storage_location_id_fkey` FOREIGN KEY (`storage_location_id`) REFERENCES `storage_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_balances` ADD CONSTRAINT `inventory_balances_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_storage_location_id_fkey` FOREIGN KEY (`storage_location_id`) REFERENCES `storage_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issues` ADD CONSTRAINT `material_issues_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issue_items` ADD CONSTRAINT `material_issue_items_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `material_issues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issue_items` ADD CONSTRAINT `material_issue_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_issue_items` ADD CONSTRAINT `material_issue_items_storage_location_id_fkey` FOREIGN KEY (`storage_location_id`) REFERENCES `storage_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_returns` ADD CONSTRAINT `material_returns_original_issue_id_fkey` FOREIGN KEY (`original_issue_id`) REFERENCES `material_issues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_returns` ADD CONSTRAINT `material_returns_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_returns` ADD CONSTRAINT `material_returns_received_by_fkey` FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_returns` ADD CONSTRAINT `material_returns_returned_by_fkey` FOREIGN KEY (`returned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_return_items` ADD CONSTRAINT `material_return_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_return_items` ADD CONSTRAINT `material_return_items_return_id_fkey` FOREIGN KEY (`return_id`) REFERENCES `material_returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_counts` ADD CONSTRAINT `stock_counts_counted_by_fkey` FOREIGN KEY (`counted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_counts` ADD CONSTRAINT `stock_counts_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_counts` ADD CONSTRAINT `stock_counts_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_counts` ADD CONSTRAINT `stock_counts_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_count_items` ADD CONSTRAINT `stock_count_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_count_items` ADD CONSTRAINT `stock_count_items_stock_count_id_fkey` FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_count_items` ADD CONSTRAINT `stock_count_items_storage_location_id_fkey` FOREIGN KEY (`storage_location_id`) REFERENCES `storage_locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `material_issues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_consumption` ADD CONSTRAINT `material_consumption_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_wastage` ADD CONSTRAINT `material_wastage_reported_by_fkey` FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
