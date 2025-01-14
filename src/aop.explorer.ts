import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { AspectsRegistry } from './aspects.registry';

@Injectable()
export class AopExplorer implements OnModuleInit {
  constructor(
    private discoveryService: DiscoveryService,
    private registry: AspectsRegistry,
    private metadataScanner: MetadataScanner,
    private reflector: Reflector
  ) {}

  onModuleInit(): void {
    this.explore();
  }

  explore(): void {
    if (this.registry.getAll().length === 0) {
      return;
    }

    const instanceWrappers: InstanceWrapper[] = this.discoveryService
      .getControllers()
      .concat(this.discoveryService.getProviders());

    instanceWrappers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;

      if (!instance) {
        return;
      }

      // scanFromPrototype will iterate through all providers' methods
      this.metadataScanner
        .getAllMethodNames(Object.getPrototypeOf(instance))
        .forEach((methodName: string) =>
          this.lookupProviderMethod(instance, methodName)
        );
    });
  }

  lookupProviderMethod(
    instance: Record<string, (arg: unknown) => Promise<unknown>>,
    methodName: string
  ) {
    this.registry.getAll().forEach(([key, provider]) => {
      const methodRef = instance[methodName];

      const aspectOptions = this.reflector.get<unknown>(key, methodRef);
      if (aspectOptions === undefined) {
        return;
      }

      const initialMetadata = Reflect.getMetadataKeys(methodRef) || [];

      instance[methodName] = async (...args: unknown[]) => {
        return provider.attach(methodRef.bind(instance), args, aspectOptions);
      };

      initialMetadata.forEach((key) => {
        Reflect.defineMetadata(
          key,
          this.reflector.get(key, methodRef),
          instance[methodName]
        );
      });
    });
  }
}
