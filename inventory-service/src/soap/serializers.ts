import { Film } from '../modules/films/entities/film.entity.js';
import { Actor } from '../modules/actors/entities/actor.entity.js';
import { Category } from '../modules/categories/entities/category.entity.js';
import { Language } from '../modules/languages/entities/language.entity.js';
import { Inventory } from '../modules/inventories/entities/inventory.entity.js';

// xsd:dateTime needs a real ISO8601 string, not a JS Date object, to serialize predictably.
const iso = (date: Date): string => date.toISOString();

// soap.listen() serializes `null` as <el xsi:nil="true"/> but never declares the xsi namespace
// on the envelope, which is invalid XML (unbound prefix). The WSDL already marks these fields
// minOccurs="0", so dropping the key entirely is both valid and simpler — same effect.
const omitNull = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null)) as Partial<T>;

export const serializeFilm = (film: Film) => omitNull({
    id:                 film.id,
    title:              film.title,
    description:        film.description,
    releaseYear:        film.releaseYear,
    languageId:         film.languageId,
    originalLanguageId: film.originalLanguageId,
    rentalDuration:     film.rentalDuration,
    rentalRate:         film.rentalRate,
    length:             film.length,
    replacementCost:    film.replacementCost,
    rating:             film.rating,
    lastUpdate:         iso(film.lastUpdate),
});

export const serializeActor = (actor: Actor) => ({
    id:         actor.id,
    firstName:  actor.firstName,
    lastName:   actor.lastName,
    lastUpdate: iso(actor.lastUpdate),
});

export const serializeCategory = (category: Category) => ({
    id:         category.id,
    name:       category.name,
    lastUpdate: iso(category.lastUpdate),
});

export const serializeLanguage = (language: Language) => ({
    id:         language.id,
    name:       language.name.trim(), // real column is char(20), Postgres space-pads it
    lastUpdate: iso(language.lastUpdate),
});

export const serializeInventory = (inventory: Inventory) => ({
    id:         inventory.id,
    filmId:     inventory.filmId,
    storeId:    inventory.storeId,
    lastUpdate: iso(inventory.lastUpdate),
});
