/* eslint-disable no-underscore-dangle */
import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { AbstractHttpAdapter } from '@nestjs/core';
import type AdminJS from 'adminjs';
import FastifySessionPlugin from '@fastify/session';

import { AdminModuleOptions } from '../interfaces/admin-module-options.interface.js';

import { AbstractLoader } from './abstract.loader.js';

@Injectable()
export class FastifyLoader extends AbstractLoader {
  public async register(
    admin: AdminJS,
    httpAdapter: AbstractHttpAdapter,
    options: AdminModuleOptions,
  ) {
    const app = httpAdapter.getInstance();

    loadPackage('fastify', '@adminjs/nestjs');
    const adminJsFastify = await import('@adminjs/fastify');

    await app.register(async (adminApp) => {
      if (adminApp.hasContentTypeParser('application/x-www-form-urlencoded')) {
        adminApp.removeContentTypeParser('application/x-www-form-urlencoded');
      }

      if (options.auth) {
        const FastifySession = loadPackage('@fastify/session', '@adminjs/nestjs');
        const Connect = loadPackage('connect-pg-simple', '@adminjs/nestjs');

        const ConnectSession = Connect(FastifySession as any);
        const sessionStore = new ConnectSession(options.sessionOptions);

        // Pass 'adminApp' (the child), not 'app' (the global instance)
        await adminJsFastify.default.buildAuthenticatedRouter(
          admin,
          options.auth,
          adminApp,
                  {
                    store: sessionStore,
                    ...options.sessionOptions,
                  } as FastifySessionPlugin.FastifySessionOptions,
        );
      } else {
        await adminJsFastify.default.buildRouter(
          admin,
          adminApp,
        );
      }
    });
  }
}
