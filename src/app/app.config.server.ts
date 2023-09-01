import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideISR } from 'ngx-isr';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), provideISR()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
