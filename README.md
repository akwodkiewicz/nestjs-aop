# @nestjs-architects/aop

[![version](https://img.shields.io/npm/v/@nestjs-architects/aop.svg)](https://www.npmjs.com/package/@nestjs-architects/aop)
[![downloads](https://img.shields.io/npm/dt/@nestjs-architects/aop.svg)](https://www.npmjs.com/package/@nestjs-architects/aop)

If you don't know what AOP is check this out

## Usage

```sh
$ npm i @nestjs-architects/aop
```

Create your own advice (additional piece of code executed along with the original method)

```typescript
import { AdviceProvider } from '@nestjs-architects/aop';

interface LoggingOptions {
  format: 'JSON' | 'TEXT';
}

class LoggingAdvice implements AdviceProvider {
  async attach(
    originalMethod: Function,
    args: unknown[],
    options: LoggingOptions
  ): Promise<unknown> {
    console.log('Before...');
    const result = await originalMethod(...args);
    console.log('After...');
    return result;
  }
}
```

Define a decorator and attach it to your methods

```typescript
import { SetMetadata } from '@nestjs/common';

const LOGGING_KEY = 'LOGGING';
export const Logging = (options: LoggingOptions) =>
  SetMetadata(LOGGING_KEY, options);
```

```typescript
@Injectable()
export class AppService {
  @Logging()
  getHello(): string {
    console.log('Initial method called');
    return 'Hello World!';
  }
}
```

Register both as your own aspect

```typescript
import { AopModule, AspectsRegistry } from '@nestjs-architects/aop';
import { Module } from '@nestjs/common';

@Module({
  imports: [AopModule],
  providers: [LoggingAdvice],
})
export class LoggingModule {
  constructor(
    private readonly registry: AspectsRegistry,
    private readonly loggingAdvice: LoggingAdvice
  ) {
    this.registry.addAspect(LOGGING_KEY, this.loggingAdvice);
  }
}
```

## Profit

Now, every time the decoreted method is called the additional code provided by you is executed too.

![showcase](showcase.png)

## Learn more

[Aspect-oriented programming with NestJS](https://medium.com/@maciejsikorski/aspect-oriented-programming-with-nestjs-a2e420d9980e)
