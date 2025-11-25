import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Documents API: http://localhost:${port}/documents/generate`);
  console.log(`Templates list: http://localhost:${port}/documents/templates`);
  console.log(`Health check: http://localhost:${port}/documents/health`);
}

void bootstrap().catch((error) => {
  console.error('Fatal error during application bootstrap', error);
  process.exit(1);
});
