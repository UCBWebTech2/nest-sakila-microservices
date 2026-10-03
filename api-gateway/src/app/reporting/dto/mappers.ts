// reporting-service returns raw SQL view column names as-is (its own decisions.md explains why:
// it owns no entities to rename through). These mappers translate that into the clean camelCase
// shape this gateway's own API presents — a public REST consumer shouldn't see `fid`/`sid`/
// `"zip code"`, those are internal Sakila view quirks, not this API's contract.

export const mapActorInfo = (row: any) => ({
    actorId:   row.actor_id,
    firstName: row.first_name,
    lastName:  row.last_name,
    filmInfo:  row.film_info,
});

export const mapCustomerReport = (row: any) => ({
    id:      row.id,
    name:    row.name,
    address: row.address,
    zipCode: row['zip code'],
    phone:   row.phone,
    city:    row.city,
    country: row.country,
    notes:   row.notes,
    storeId: row.sid,
});

export const mapFilmListItem = (row: any) => ({
    id:          row.fid,
    title:       row.title,
    description: row.description,
    category:    row.category,
    price:       row.price,
    length:      row.length,
    rating:      row.rating,
    actors:      row.actors,
});

export const mapSalesByCategory = (row: any) => ({
    category:   row.category,
    totalSales: row.total_sales,
});

export const mapSalesByStore = (row: any) => ({
    store:      row.store,
    manager:    row.manager,
    totalSales: row.total_sales,
});

export const mapStaffReport = (row: any) => ({
    id:      row.id,
    name:    row.name,
    address: row.address,
    zipCode: row['zip code'],
    phone:   row.phone,
    city:    row.city,
    country: row.country,
    storeId: row.sid,
});

export const mapRewardsCustomer = (row: any) => ({
    customerId: row.customer_id,
    storeId:    row.store_id,
    firstName:  row.first_name,
    lastName:   row.last_name,
    addressId:  row.address_id,
    email:      row.email,
    activebool: row.activebool,
    createDate: row.create_date,
});
