import { EntityWithDetails, getAllEntities } from "~/utils/db/entities/entities.db.server";

export default class EntitiesSingleton {
  private static instance: EntitiesSingleton;
  private entities: EntityWithDetails[] | undefined;
  private constructor(entities?: EntityWithDetails[]) {
    this.entities = entities;
  }
  public static getInstance(entities?: EntityWithDetails[]): EntitiesSingleton {
    if (!EntitiesSingleton.instance) {
      EntitiesSingleton.instance = new EntitiesSingleton(entities);
    }
    return EntitiesSingleton.instance;
  }
  public isSet() {
    return this.entities !== undefined;
  }
  public getEntities(): EntityWithDetails[] {
    if (!this.entities) {
      throw new Error("Entities not set: Call await EntitiesSingleton.load() before using RowRepository or EntityRepository");
    }
    return this.entities;
  }
  public setEntities(entities: EntityWithDetails[]): void {
    const instance = EntitiesSingleton.getInstance();
    instance.entities = entities;
  }
  public static async load() {
    const instace = EntitiesSingleton.getInstance();
    if (!instace.isSet()) {
      const entities = await getAllEntities({ tenantId: null });
      instace.setEntities(entities);
    }
    return instace.getEntities();
  }
}
