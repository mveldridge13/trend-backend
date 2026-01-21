import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );


  app.enableCors();
  app.setGlobalPrefix("api/v1");

  // ✅ Listen on all interfaces and correct port
  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
