import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAppointmentsTable1774867984416 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'barber_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'service_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'appointment_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'scheduled'",
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.query(`
      ALTER TABLE appointments 
      ADD CONSTRAINT FK_appointments_customer_id 
      FOREIGN KEY (customer_id) REFERENCES customers(id) 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE appointments 
      ADD CONSTRAINT FK_appointments_barber_id 
      FOREIGN KEY (barber_id) REFERENCES barbers(id) 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE appointments 
      ADD CONSTRAINT FK_appointments_service_id 
      FOREIGN KEY (service_id) REFERENCES services(id) 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS FK_appointments_service_id',
    );
    await queryRunner.query(
      'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS FK_appointments_barber_id',
    );
    await queryRunner.query(
      'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS FK_appointments_customer_id',
    );
    await queryRunner.dropTable('appointments');
  }
}
