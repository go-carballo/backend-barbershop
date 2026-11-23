import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class AddTargetColumnsToNotifications1795297878596 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customerId and barberId columns
    await queryRunner.addColumns('notifications', [
      new TableColumn({
        name: 'customer_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'barber_id',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    // Make user_id nullable (not all notifications are for users)
    await queryRunner.changeColumn('notifications', 'user_id', new TableColumn({
      name: 'user_id',
      type: 'uuid',
      isNullable: true,
    }));

    // Add foreign keys
    await queryRunner.createForeignKeys('notifications', [
      new TableForeignKey({
        name: 'FK_notifications_customer',
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_notifications_barber',
        columnNames: ['barber_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'barbers',
        onDelete: 'CASCADE',
      }),
    ]);

    // Add index for customer notifications
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_customer',
        columnNames: ['customer_id'],
      }),
    );

    // Add index for barber notifications
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_barber',
        columnNames: ['barber_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('notifications', 'FK_notifications_customer');
    await queryRunner.dropForeignKey('notifications', 'FK_notifications_barber');
    await queryRunner.dropIndex('notifications', 'IDX_notifications_customer');
    await queryRunner.dropIndex('notifications', 'IDX_notifications_barber');
    await queryRunner.dropColumns('notifications', ['customer_id', 'barber_id']);
  }
}