import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://frontend-barbershop.onrender.com',
    ],
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BarberShop API')
    .setDescription('API documentation for BarberShop (NestJS 10)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
      tryItOutEnabled: false
    }
  });

  await app.listen(
    Number(process.env.PORT ?? process.env.APP_PORT ?? 3000),
    '0.0.0.0',
  );
}
void bootstrap();
