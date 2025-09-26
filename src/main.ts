import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Убираем лишние поля, не указанные в DTO
      forbidNonWhitelisted: true, // Блокируем запросы с лишними полями
      transform: true, // Преобразуем типы (например, строки в числа)
      transformOptions: { enableImplicitConversion: true }, // Включаем неявное преобразование типов
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Neighbours API')
    .setDescription('API для приложения Neighbours')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = configService.get<number>('port', 3000);
  await app.listen(port);
}

bootstrap();
