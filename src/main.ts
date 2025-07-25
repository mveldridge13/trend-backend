import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix("api/v1");

  // ✅ Listen on all interfaces and correct port
  await app.listen(3001, "0.0.0.0");
}

bootstrap();
