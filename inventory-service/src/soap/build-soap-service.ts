import { INestApplication } from '@nestjs/common';
import { FilmsService } from '../modules/films/services/films.service.js';
import { ActorsService } from '../modules/actors/services/actors.service.js';
import { CategoriesService } from '../modules/categories/services/categories.service.js';
import { LanguagesService } from '../modules/languages/services/languages.service.js';
import { InventoriesService } from '../modules/inventories/services/inventories.service.js';
import { resolveFault } from '../shared/soap/resolve-fault.js';
import { serializeActor, serializeCategory, serializeFilm, serializeInventory, serializeLanguage } from './serializers.js';

// Wraps every operation handler so a thrown SoapFault (or anything else, e.g. a raw
// QueryFailedError) always comes out as a proper SOAP fault instead of crashing the server.
function op<A, R>(handler: (args: A) => Promise<R>): (args: A) => Promise<R> {
    return async (args: A) => {
        try {
            return await handler(args);
        } catch (err) {
            throw resolveFault(err).toFaultObject();
        }
    };
}

// Builds the { ServiceName: { PortName: { OperationName: handler } } } object soap.listen()
// expects, pulling the actual domain services out of Nest's DI container — this is the only
// place a GET/CREATE/UPDATE/DELETE SOAP operation meets the NestJS app underneath it.
export function buildSoapService(app: INestApplication) {
    const films       = app.get(FilmsService);
    const actors       = app.get(ActorsService);
    const categories   = app.get(CategoriesService);
    const languages    = app.get(LanguagesService);
    const inventories  = app.get(InventoriesService);

    return {
        InventoryService: {
            InventoryPort: {
                ListFilms: op(async (args: { page?: number; limit?: number }) => {
                    const { data, meta } = await films.findAll(args);
                    return { data: data.map(serializeFilm), meta };
                }),
                GetFilm: op(async (args: { id: number }) => serializeFilm(await films.findOneById(args.id))),
                CreateFilm: op(async (args: any) => serializeFilm(await films.create(args))),
                UpdateFilm: op(async (args: any) => serializeFilm(await films.update(args.id, args))),
                DeleteFilm: op(async (args: { id: number }) => {
                    await films.remove(args.id);
                    return { success: true };
                }),

                ListActors: op(async (args: { page?: number; limit?: number }) => {
                    const { data, meta } = await actors.findAll(args);
                    return { data: data.map(serializeActor), meta };
                }),
                GetActor: op(async (args: { id: number }) => serializeActor(await actors.findOneById(args.id))),
                CreateActor: op(async (args: any) => serializeActor(await actors.create(args))),
                UpdateActor: op(async (args: any) => serializeActor(await actors.update(args.id, args))),
                DeleteActor: op(async (args: { id: number }) => {
                    await actors.remove(args.id);
                    return { success: true };
                }),

                ListCategories: op(async (args: { page?: number; limit?: number }) => {
                    const { data, meta } = await categories.findAll(args);
                    return { data: data.map(serializeCategory), meta };
                }),
                GetCategory: op(async (args: { id: number }) => serializeCategory(await categories.findOneById(args.id))),
                CreateCategory: op(async (args: any) => serializeCategory(await categories.create(args))),
                UpdateCategory: op(async (args: any) => serializeCategory(await categories.update(args.id, args))),
                DeleteCategory: op(async (args: { id: number }) => {
                    await categories.remove(args.id);
                    return { success: true };
                }),

                ListLanguages: op(async (args: { page?: number; limit?: number }) => {
                    const { data, meta } = await languages.findAll(args);
                    return { data: data.map(serializeLanguage), meta };
                }),
                GetLanguage: op(async (args: { id: number }) => serializeLanguage(await languages.findOneById(args.id))),
                CreateLanguage: op(async (args: any) => serializeLanguage(await languages.create(args))),
                UpdateLanguage: op(async (args: any) => serializeLanguage(await languages.update(args.id, args))),
                DeleteLanguage: op(async (args: { id: number }) => {
                    await languages.remove(args.id);
                    return { success: true };
                }),

                ListInventories: op(async (args: { page?: number; limit?: number }) => {
                    const { data, meta } = await inventories.findAll(args);
                    return { data: data.map(serializeInventory), meta };
                }),
                GetInventory: op(async (args: { id: number }) => serializeInventory(await inventories.findOneById(args.id))),
                CreateInventory: op(async (args: any) => serializeInventory(await inventories.create(args))),
                UpdateInventory: op(async (args: any) => serializeInventory(await inventories.update(args.id, args))),
                DeleteInventory: op(async (args: { id: number }) => {
                    await inventories.remove(args.id);
                    return { success: true };
                }),
            },
        },
    };
}
