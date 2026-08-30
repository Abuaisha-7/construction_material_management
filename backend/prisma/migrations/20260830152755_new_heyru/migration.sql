-- CreateTable
CREATE TABLE `material_quarantines` (
    `id` CHAR(36) NOT NULL,
    `quarantine_number` VARCHAR(50) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `inspection_id` CHAR(36) NOT NULL,
    `inspection_item_id` CHAR(36) NOT NULL,
    `grn_id` CHAR(36) NOT NULL,
    `grn_item_id` CHAR(36) NOT NULL,
    `material_id` CHAR(36) NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `unit_id` CHAR(36) NOT NULL,
    `reason` TEXT NULL,
    `corrective_action` TEXT NULL,
    `status` ENUM('QUARANTINED', 'RELEASED', 'RETURNED', 'SCRAPPED', 'CANCELLED') NOT NULL DEFAULT 'QUARANTINED',
    `quarantined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `released_at` DATETIME(3) NULL,
    `returned_at` DATETIME(3) NULL,
    `scrapped_at` DATETIME(3) NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quarantine_number`(`quarantine_number`),
    INDEX `material_quarantines_project_id_idx`(`project_id`),
    INDEX `material_quarantines_inspection_id_idx`(`inspection_id`),
    INDEX `material_quarantines_inspection_item_id_idx`(`inspection_item_id`),
    INDEX `material_quarantines_grn_id_idx`(`grn_id`),
    INDEX `material_quarantines_grn_item_id_idx`(`grn_item_id`),
    INDEX `material_quarantines_material_id_idx`(`material_id`),
    INDEX `material_quarantines_status_idx`(`status`),
    INDEX `material_quarantines_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_dispositions` (
    `id` CHAR(36) NOT NULL,
    `disposition_number` VARCHAR(50) NOT NULL,
    `quarantine_id` CHAR(36) NOT NULL,
    `action` ENUM('RELEASE', 'RETURN', 'SCRAP') NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `reason` TEXT NULL,
    `remarks` TEXT NULL,
    `action_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `performed_by` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `disposition_number`(`disposition_number`),
    INDEX `material_dispositions_quarantine_id_idx`(`quarantine_id`),
    INDEX `material_dispositions_action_idx`(`action`),
    INDEX `material_dispositions_performed_by_idx`(`performed_by`),
    INDEX `material_dispositions_action_date_idx`(`action_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_responsible_user_id_fkey` FOREIGN KEY (`responsible_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_inspection_id_fkey` FOREIGN KEY (`inspection_id`) REFERENCES `material_inspections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_inspection_item_id_fkey` FOREIGN KEY (`inspection_item_id`) REFERENCES `inspection_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_grn_id_fkey` FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_grn_item_id_fkey` FOREIGN KEY (`grn_item_id`) REFERENCES `grn_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_quarantines` ADD CONSTRAINT `material_quarantines_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_dispositions` ADD CONSTRAINT `material_dispositions_quarantine_id_fkey` FOREIGN KEY (`quarantine_id`) REFERENCES `material_quarantines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_dispositions` ADD CONSTRAINT `material_dispositions_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
