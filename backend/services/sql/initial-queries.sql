-- Create the database
CREATE DATABASE IF NOT EXISTS construction_material_management;
USE construction_material_management;


-- Create the users table
CREATE TABLE users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- Create the roles table
CREATE TABLE roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed the roles table
INSERT INTO roles (id, name, description) VALUES
(UUID(), 'ADMIN', 'Full system administrator'),
(UUID(), 'PROJECT_MANAGER', 'Project management and approval'),
(UUID(), 'SITE_ENGINEER', 'Site engineering and material requests'),
(UUID(), 'STOREKEEPER', 'Warehouse and inventory management'),
(UUID(), 'QA_QC_ENGINEER', 'Material inspection and quality control'),
(UUID(), 'PROCUREMENT_OFFICER', 'Procurement and supplier management'),
(UUID(), 'QUANTITY_SURVEYOR', 'Quantity and material cost management'),
(UUID(), 'FINANCE_OFFICER', 'Financial monitoring'),
(UUID(), 'CONSULTANT', 'Consultant access'),
(UUID(), 'SUPERVISOR', 'Site supervision'),
(UUID(), 'MANAGEMENT_VIEWER', 'Management read-only access');

-- Create the permissions table
CREATE TABLE permissions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Create the user_roles table
CREATE TABLE user_roles (
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
);  

-- Create the role_permissions table
CREATE TABLE role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
);

-- Create the projects table
CREATE TABLE projects (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,

    location VARCHAR(255),
    client_name VARCHAR(255),
    contractor_name VARCHAR(255),
    consultant_name VARCHAR(255),

    project_manager_id CHAR(36),

    start_date DATE,
    completion_date DATE,

    contract_value DECIMAL(18,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',

    status ENUM(
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'ACTIVE',

    description TEXT,
    image_url TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_manager
        FOREIGN KEY (project_manager_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- Create the building_types table
CREATE TABLE buildings (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_building_project_code (project_id, code),

    CONSTRAINT fk_buildings_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

-- Create the zones/work locations table
CREATE TABLE zones (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    building_id CHAR(36),

    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_zones_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_zones_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL
);

-- Create the activities table
CREATE TABLE activities (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    building_id CHAR(36),
    zone_id CHAR(36),

    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    status ENUM(
        'NOT_STARTED',
        'IN_PROGRESS',
        'COMPLETED',
        'ON_HOLD',
        'CANCELLED'
    ) NOT NULL DEFAULT 'NOT_STARTED',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activities_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_activities_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_activities_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON DELETE SET NULL
);

-- Create the materials categories table
CREATE TABLE material_categories (
    id CHAR(36) NOT NULL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the units table
CREATE TABLE units (
    id CHAR(36) NOT NULL PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- seed the units table
INSERT INTO units
(id, code, name, symbol)
VALUES
(UUID(), 'BAG', 'Bag', 'bag'),
(UUID(), 'KG', 'Kilogram', 'kg'),
(UUID(), 'TON', 'Metric Ton', 'ton'),
(UUID(), 'M3', 'Cubic Meter', 'm³'),
(UUID(), 'M2', 'Square Meter', 'm²'),
(UUID(), 'M', 'Meter', 'm'),
(UUID(), 'PCS', 'Piece', 'pcs'),
(UUID(), 'L', 'Liter', 'L'),
(UUID(), 'ROLL', 'Roll', 'roll'),
(UUID(), 'BUNDLE', 'Bundle', 'bundle'),
(UUID(), 'SET', 'Set', 'set');

-- Create the materials table
CREATE TABLE materials (
    id CHAR(36) NOT NULL PRIMARY KEY,

    material_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,

    category_id CHAR(36) NOT NULL,
    unit_id CHAR(36) NOT NULL,

    specification TEXT,
    standard VARCHAR(100),
    description TEXT,

    estimated_unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    current_unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,

    minimum_stock DECIMAL(18,3) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(18,3) NOT NULL DEFAULT 0,
    maximum_stock DECIMAL(18,3),

    requires_inspection BOOLEAN NOT NULL DEFAULT TRUE,
    requires_certificate BOOLEAN NOT NULL DEFAULT FALSE,

    storage_requirements TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_materials_category
        FOREIGN KEY (category_id)
        REFERENCES material_categories(id),

    CONSTRAINT fk_materials_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(id)
);

-- Create the suppliers table
CREATE TABLE suppliers (
    id CHAR(36) NOT NULL PRIMARY KEY,

    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,

    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,

    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    license_number VARCHAR(100),

    rating DECIMAL(3,2),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- Create the material_suppliers table (many-to-many relationship between materials and suppliers)
CREATE TABLE material_suppliers (
    material_id CHAR(36) NOT NULL,
    supplier_id CHAR(36) NOT NULL,

    preferred BOOLEAN NOT NULL DEFAULT FALSE,

    supplier_unit_price DECIMAL(18,2),
    lead_time_days INT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (material_id, supplier_id),

    CONSTRAINT fk_material_suppliers_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_suppliers_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON DELETE CASCADE
);

-- create the warehouse table
CREATE TABLE warehouses (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,

    type VARCHAR(50),

    responsible_user_id CHAR(36),

    capacity_description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_warehouse_project_code (project_id, code),

    CONSTRAINT fk_warehouses_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_warehouses_responsible
        FOREIGN KEY (responsible_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create storage locations table
CREATE TABLE storage_locations (
    id CHAR(36) NOT NULL PRIMARY KEY,

    warehouse_id CHAR(36) NOT NULL,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,

    location_type VARCHAR(50),

    capacity DECIMAL(18,3),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_storage_warehouse_code
        (warehouse_id, code),

    CONSTRAINT fk_storage_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE
);

-- create material requests table
CREATE TABLE material_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,

    request_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,

    requested_by CHAR(36) NOT NULL,

    building_id CHAR(36),
    zone_id CHAR(36),
    activity_id CHAR(36),

    request_date DATE NOT NULL,
    required_date DATE,

    priority ENUM(
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT'
    ) NOT NULL DEFAULT 'NORMAL',

    purpose TEXT,

    status ENUM(
        'DRAFT',
        'PENDING_APPROVAL',
        'RETURNED',
        'APPROVED',
        'PARTIALLY_APPROVED',
        'REJECTED',
        'PARTIALLY_SUPPLIED',
        'FULLY_SUPPLIED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_requests_user
        FOREIGN KEY (requested_by)
        REFERENCES users(id),

    CONSTRAINT fk_requests_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_requests_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_requests_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL
);

-- create material request items table
CREATE TABLE material_request_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    request_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    requested_quantity DECIMAL(18,3) NOT NULL,
    approved_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    supplied_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    issued_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    estimated_unit_price DECIMAL(18,2),

    remarks TEXT,

    CONSTRAINT fk_request_items_request
        FOREIGN KEY (request_id)
        REFERENCES material_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
);

-- creat material request approval table
CREATE TABLE material_request_approvals (
    id CHAR(36) NOT NULL PRIMARY KEY,

    request_id CHAR(36) NOT NULL,
    approver_id CHAR(36) NOT NULL,

    action ENUM(
        'APPROVED',
        'PARTIALLY_APPROVED',
        'REJECTED',
        'RETURNED'
    ) NOT NULL,

    approved_quantity DECIMAL(18,3),

    comments TEXT,

    action_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_approvals_request
        FOREIGN KEY (request_id)
        REFERENCES material_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_approvals_user
        FOREIGN KEY (approver_id)
        REFERENCES users(id)
);

-- create the purchase orders table
CREATE TABLE purchase_orders (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    supplier_id CHAR(36) NOT NULL,

    purchase_order_number VARCHAR(50) NOT NULL UNIQUE,

    order_date DATE NOT NULL,
    expected_delivery_date DATE,

    status ENUM(
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'PARTIALLY_RECEIVED',
        'FULLY_RECEIVED',
        'CANCELLED',
        'CLOSED'
    ) NOT NULL DEFAULT 'DRAFT',

    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,

    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',

    remarks TEXT,

    created_by CHAR(36),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_po_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id),

    CONSTRAINT fk_po_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the purchase_order_items table
CREATE TABLE purchase_order_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    purchase_order_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    ordered_quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,

    received_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    total_price DECIMAL(18,2)
        GENERATED ALWAYS AS
        (ordered_quantity * unit_price) STORED,

    CONSTRAINT fk_po_items_po
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_po_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
);

-- create the goods received notes table
CREATE TABLE goods_received_notes (
    id CHAR(36) NOT NULL PRIMARY KEY,

    grn_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,
    supplier_id CHAR(36) NOT NULL,

    purchase_order_id CHAR(36),

    delivery_date DATE NOT NULL,

    delivery_note_number VARCHAR(100),

    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),

    status ENUM(
        'DRAFT',
        'AWAITING_INSPECTION',
        'PARTIALLY_ACCEPTED',
        'ACCEPTED',
        'REJECTED',
        'POSTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    received_by CHAR(36),

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grn_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_grn_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id),

    CONSTRAINT fk_grn_po
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_grn_receiver
        FOREIGN KEY (received_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- create the goods received note items table
CREATE TABLE grn_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    grn_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    ordered_quantity DECIMAL(18,3),

    delivered_quantity DECIMAL(18,3) NOT NULL,

    damaged_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    rejected_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    accepted_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    unit_id CHAR(36) NOT NULL,

    batch_number VARCHAR(100),

    manufacturing_date DATE,
    expiry_date DATE,

    storage_location_id CHAR(36),

    remarks TEXT,

    CONSTRAINT fk_grn_items_grn
        FOREIGN KEY (grn_id)
        REFERENCES goods_received_notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grn_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_grn_items_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(id),

    CONSTRAINT fk_grn_items_location
        FOREIGN KEY (storage_location_id)
        REFERENCES storage_locations(id)
        ON DELETE SET NULL
);

-- create material inspection table
CREATE TABLE material_inspections (
    id CHAR(36) NOT NULL PRIMARY KEY,

    inspection_number VARCHAR(50) NOT NULL UNIQUE,

    grn_id CHAR(36) NOT NULL,

    inspection_date DATE NOT NULL,

    inspector_id CHAR(36) NOT NULL,

    status ENUM(
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING',

    decision ENUM(
        'ACCEPTED',
        'CONDITIONALLY_ACCEPTED',
        'PARTIALLY_ACCEPTED',
        'REJECTED',
        'QUARANTINED'
    ),

    remarks TEXT,
    corrective_action TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inspection_grn
        FOREIGN KEY (grn_id)
        REFERENCES goods_received_notes(id),

    CONSTRAINT fk_inspection_inspector
        FOREIGN KEY (inspector_id)
        REFERENCES users(id)
);

-- create the material_inspection_items table
CREATE TABLE inspection_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    inspection_id CHAR(36) NOT NULL,
    grn_item_id CHAR(36) NOT NULL,

    quantity_inspected DECIMAL(18,3),

    quantity_accepted DECIMAL(18,3) NOT NULL DEFAULT 0,

    quantity_conditionally_accepted DECIMAL(18,3) NOT NULL DEFAULT 0,

    quantity_quarantined DECIMAL(18,3) NOT NULL DEFAULT 0,

    quantity_rejected DECIMAL(18,3) NOT NULL DEFAULT 0,

    specification TEXT,

    required_standard VARCHAR(100),

    certificate_number VARCHAR(100),

    test_required BOOLEAN NOT NULL DEFAULT FALSE,

    test_result TEXT,

    remarks TEXT,

    CONSTRAINT fk_inspection_items_inspection
        FOREIGN KEY (inspection_id)
        REFERENCES material_inspections(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inspection_items_grn_item
        FOREIGN KEY (grn_item_id)
        REFERENCES grn_items(id)
);

-- create inventory balance table
CREATE TABLE inventory_balances (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36) NOT NULL,

    storage_location_id CHAR(36),

    physical_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    reserved_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    average_unit_cost DECIMAL(18,2) NOT NULL DEFAULT 0,

    stock_value DECIMAL(18,2) NOT NULL DEFAULT 0,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_inventory_location (
        project_id,
        material_id,
        warehouse_id,
        storage_location_id
    ),

    CONSTRAINT fk_inventory_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_inventory_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_inventory_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id),

    CONSTRAINT fk_inventory_location
        FOREIGN KEY (storage_location_id)
        REFERENCES storage_locations(id)
        ON DELETE SET NULL
);

-- create the inventory_transactions table
CREATE TABLE inventory_transactions (
    id CHAR(36) NOT NULL PRIMARY KEY,

    transaction_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36) NOT NULL,

    storage_location_id CHAR(36),

    transaction_type ENUM(
        'OPENING_BALANCE',
        'RECEIPT',
        'ISSUE',
        'RETURN',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'DAMAGE',
        'LOSS',
        'DISPOSAL',
        'REVERSAL'
    ) NOT NULL,

    quantity DECIMAL(18,3) NOT NULL,

    unit_cost DECIMAL(18,2),

    total_value DECIMAL(18,2),

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    performed_by CHAR(36),

    reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_tx_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_inventory_tx_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_inventory_tx_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id),

    CONSTRAINT fk_inventory_tx_location
        FOREIGN KEY (storage_location_id)
        REFERENCES storage_locations(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_inventory_tx_user
        FOREIGN KEY (performed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the material issued notes table
CREATE TABLE material_issues (
    id CHAR(36) NOT NULL PRIMARY KEY,

    issue_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36) NOT NULL,

    requested_by CHAR(36),
    approved_by CHAR(36),
    receiver_id CHAR(36),

    activity_id CHAR(36),
    building_id CHAR(36),
    zone_id CHAR(36),

    issue_date DATE NOT NULL,

    status ENUM(
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'PARTIALLY_ISSUED',
        'ISSUED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    purpose TEXT,
    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_issue_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_issue_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id),

    CONSTRAINT fk_issue_requested
        FOREIGN KEY (requested_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issue_approved
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issue_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issue_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issue_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issue_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON DELETE SET NULL
);


-- create the material_issue_items table
CREATE TABLE material_issue_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    issue_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    approved_quantity DECIMAL(18,3) NOT NULL,
    issued_quantity DECIMAL(18,3) NOT NULL,

    unit_cost DECIMAL(18,2),

    storage_location_id CHAR(36),

    CONSTRAINT fk_issue_items_issue
        FOREIGN KEY (issue_id)
        REFERENCES material_issues(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_issue_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_issue_items_location
        FOREIGN KEY (storage_location_id)
        REFERENCES storage_locations(id)
        ON DELETE SET NULL
);

-- create the material return table
CREATE TABLE material_returns (
    id CHAR(36) NOT NULL PRIMARY KEY,

    return_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,

    original_issue_id CHAR(36),

    returned_by CHAR(36),
    received_by CHAR(36),

    return_date DATE NOT NULL,

    reason TEXT,

    status ENUM(
        'PENDING',
        'INSPECTED',
        'ACCEPTED',
        'PARTIALLY_ACCEPTED',
        'REJECTED',
        'POSTED'
    ) NOT NULL DEFAULT 'PENDING',

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_returns_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_returns_issue
        FOREIGN KEY (original_issue_id)
        REFERENCES material_issues(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_returns_returned_by
        FOREIGN KEY (returned_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_returns_received_by
        FOREIGN KEY (received_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the material return items table
CREATE TABLE material_return_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    return_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    issued_quantity DECIMAL(18,3),
    consumed_quantity DECIMAL(18,3),

    returned_quantity DECIMAL(18,3) NOT NULL,

    damaged_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    accepted_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    rejected_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,

    condition_status ENUM(
        'GOOD',
        'DAMAGED',
        'UNUSABLE',
        'UNKNOWN'
    ),

    remarks TEXT,

    CONSTRAINT fk_return_items_return
        FOREIGN KEY (return_id)
        REFERENCES material_returns(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_return_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
);

-- create the stock count table
CREATE TABLE stock_counts (
    id CHAR(36) NOT NULL PRIMARY KEY,

    count_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36),

    count_date DATE NOT NULL,

    counted_by CHAR(36),
    verified_by CHAR(36),

    status ENUM(
        'DRAFT',
        'IN_PROGRESS',
        'COMPLETED',
        'APPROVED'
    ) NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_counts_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_stock_counts_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_stock_counts_counter
        FOREIGN KEY (counted_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_stock_counts_verifier
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- create the stock count items table
CREATE TABLE stock_count_items (
    id CHAR(36) NOT NULL PRIMARY KEY,

    stock_count_id CHAR(36) NOT NULL,

    material_id CHAR(36) NOT NULL,

    storage_location_id CHAR(36),

    system_quantity DECIMAL(18,3) NOT NULL,

    physical_quantity DECIMAL(18,3) NOT NULL,

    reason TEXT,

    CONSTRAINT fk_count_items_count
        FOREIGN KEY (stock_count_id)
        REFERENCES stock_counts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_count_items_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_count_items_location
        FOREIGN KEY (storage_location_id)
        REFERENCES storage_locations(id)
        ON DELETE SET NULL
);

-- create the stock adjustment table
CREATE TABLE stock_adjustments (
    id CHAR(36) NOT NULL PRIMARY KEY,

    adjustment_number VARCHAR(50) NOT NULL UNIQUE,

    project_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36) NOT NULL,

    requested_by CHAR(36),
    approved_by CHAR(36),

    adjustment_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'POSTED'
    ) NOT NULL DEFAULT 'PENDING',

    reason TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjustments_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_adjustments_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id),

    CONSTRAINT fk_adjustments_requested
        FOREIGN KEY (requested_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_adjustments_approved
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the material consumption table
CREATE TABLE material_consumption (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    activity_id CHAR(36),
    building_id CHAR(36),
    zone_id CHAR(36),

    issue_id CHAR(36),

    consumption_date DATE NOT NULL,

    planned_quantity DECIMAL(18,3),
    issued_quantity DECIMAL(18,3),
    returned_quantity DECIMAL(18,3),
    consumed_quantity DECIMAL(18,3),

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consumption_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_consumption_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_consumption_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_consumption_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_consumption_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_consumption_issue
        FOREIGN KEY (issue_id)
        REFERENCES material_issues(id)
        ON DELETE SET NULL
);

-- create the material wastage table
CREATE TABLE material_wastage (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,

    activity_id CHAR(36),
    building_id CHAR(36),

    wastage_date DATE NOT NULL,

    quantity DECIMAL(18,3) NOT NULL,

    reason TEXT NOT NULL,

    reported_by CHAR(36),
    approved_by CHAR(36),

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'POSTED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wastage_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT fk_wastage_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id),

    CONSTRAINT fk_wastage_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_wastage_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_wastage_reporter
        FOREIGN KEY (reported_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_wastage_approver
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the document table
CREATE TABLE documents (
    id CHAR(36) NOT NULL PRIMARY KEY,

    project_id CHAR(36),

    document_type VARCHAR(50) NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,

    mime_type VARCHAR(100),
    file_size BIGINT,

    uploaded_by CHAR(36),

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documents_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_documents_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- create the notification table
CREATE TABLE notifications (
    id CHAR(36) NOT NULL PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    notification_type VARCHAR(50),

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- create the audit logs table
CREATE TABLE audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,

    user_id CHAR(36),

    action VARCHAR(50) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36),

    old_values JSON,
    new_values JSON,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- important indexes
CREATE INDEX idx_materials_category
ON materials(category_id);

CREATE INDEX idx_materials_unit
ON materials(unit_id);

CREATE INDEX idx_material_requests_project
ON material_requests(project_id);

CREATE INDEX idx_material_requests_status
ON material_requests(status);

CREATE INDEX idx_material_requests_date
ON material_requests(request_date);

CREATE INDEX idx_grn_project
ON goods_received_notes(project_id);

CREATE INDEX idx_grn_supplier
ON goods_received_notes(supplier_id);

CREATE INDEX idx_grn_date
ON goods_received_notes(delivery_date);

CREATE INDEX idx_inventory_material
ON inventory_balances(material_id);

CREATE INDEX idx_inventory_project
ON inventory_balances(project_id);

CREATE INDEX idx_inventory_transactions_material
ON inventory_transactions(material_id);

CREATE INDEX idx_inventory_transactions_project
ON inventory_transactions(project_id);

CREATE INDEX idx_inventory_transactions_date
ON inventory_transactions(transaction_date);

CREATE INDEX idx_material_issues_project
ON material_issues(project_id);

CREATE INDEX idx_material_consumption_material
ON material_consumption(material_id);

CREATE INDEX idx_material_wastage_material
ON material_wastage(material_id);

CREATE INDEX idx_notifications_user_read
ON notifications(user_id, is_read);

CREATE INDEX idx_audit_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);
