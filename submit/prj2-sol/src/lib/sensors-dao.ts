import { error } from 'console';
import { SensorType, Sensor, SensorReading,
	 SensorTypeSearch, SensorSearch, SensorReadingSearch,
       } from './validators.js';

import { Errors, } from 'cs544-js-utils';

import * as mongo from 'mongodb';

/** All that this DAO should do is maintain a persistent data for sensors.
 *
 *  Most routines return an errResult with code set to 'DB' if
 *  a database error occurs.
 */

/** return a DAO for sensors at URL mongodbUrl */
export async function
makeSensorsDao(mongodbUrl: string) : Promise<Errors.Result<SensorsDao>> {
  return SensorsDao.make(mongodbUrl);
}

//the types stored within collections
type DbSensorType = SensorType & { _id: string };
type DbSensor = Sensor & { _id: string };

//options for new MongoClient()
const MONGO_OPTIONS = {
  ignoreUndefined: true,  //ignore undefined fields in queries
};

export class SensorsDao {

  
  private constructor(private readonly client: mongo.MongoClient, private readonly sensors: mongo.Collection<DbSensor>, private readonly sensortypes: mongo.Collection<DbSensorType>, private readonly sensorreadings: mongo.Collection<SensorReading>) {
    //TODO
  }

  /** factory method
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  static async make(dbUrl: string) : Promise<Errors.Result<SensorsDao>> {
    try {
      const client = await(new mongo.MongoClient(dbUrl, MONGO_OPTIONS)).connect()
      const db = client.db()
      const sensors = db.collection<DbSensor>('sensors')
      const sensortypes = db.collection<DbSensorType>('sensor_types')
      const sensorreadings = db.collection<SensorReading>('sensor_readings')
      await sensors.createIndex(['id', 'sensorTypeId', 'period', 'expected'])
      await sensortypes.createIndex(['id', 'manufacturer', 'modelNumber', 'quantity', 'unit', 'expected'])
      await sensorreadings.createIndex({sensorId: 1, timestamp: 1}, {unique: true})
      await sensorreadings.createIndex('value')
      return Errors.okResult(new SensorsDao(client, sensors, sensortypes, sensorreadings))
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }

  /** Release all resources held by this dao.
   *  Specifically, close any database connections.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() : Promise<Errors.Result<void>> {
    try {
      await this.client.close()
      return Errors.VOID_RESULT
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }

  /** Clear out all sensor info in this database
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() : Promise<Errors.Result<void>> {
    try {
      await this.sensors.deleteMany({})
      await this.sensortypes.deleteMany({})
      await this.sensorreadings.deleteMany({})
      return Errors.VOID_RESULT
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }


  /** Add sensorType to this database.
   *  Error Codes: 
   *    EXISTS: sensorType with specific id already exists in DB.
   *    DB: a database error was encountered.
   */
  async addSensorType(sensorType: SensorType)
    : Promise<Errors.Result<SensorType>>
  {
    const s_type: SensorType = sensorType
    const db_obj = {...s_type, _id: s_type.id}
    try {
      const collection = this.sensortypes
      await collection.insertOne(db_obj)
    } catch (e) {
      if (e.code === MONGO_DUPLICATE_CODE) return Errors.errResult(e.message, 'EXISTS')
      else return Errors.errResult(e.message, 'DB')
    }
    return Errors.okResult(s_type)
  }

  /** Add sensor to this database.
   *  Error Codes: 
   *    EXISTS: sensor with specific id already exists in DB.
   *    DB: a database error was encountered.
   */
  async addSensor(sensor: Sensor) : Promise<Errors.Result<Sensor>> {
    const s: Sensor = sensor
    const db_obj = {...s, _id: s.id}
    try {
      const collection = this.sensors
      await collection.insertOne(db_obj)
    } catch (e) {
      if (e.code === MONGO_DUPLICATE_CODE) return Errors.errResult(e.message, 'EXISTS')
      else return Errors.errResult(e.message, 'DB')
    }
    return Errors.okResult(s)
  }

  /** Add sensorReading to this database.
   *  Error Codes: 
   *    EXISTS: reading for same sensorId and timestamp already in DB.
   *    DB: a database error was encountered.
   */
  async addSensorReading(sensorReading: SensorReading)
    : Promise<Errors.Result<SensorReading>> 
  {
    const s_read: SensorReading = sensorReading
    const db_obj = {...s_read}
    try {
      const collection = this.sensorreadings
      await collection.insertOne(db_obj)
    } catch (e) {
      if (e.code === MONGO_DUPLICATE_CODE) return Errors.errResult(e.message, 'EXISTS')
      else return Errors.errResult(e.message, 'DB')
    }
    return Errors.okResult(s_read)
  }

  /** Find sensor-types which satify search. Returns [] if none. 
   *  Note that all primitive SensorType fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensorTypes(search: SensorTypeSearch)
    : Promise<Errors.Result<SensorType[]>> 
  {
    try {
      let arr: SensorType[] = []
      const collection = this.sensortypes
      const opt = { projection: {_id: 0}}
      let query = collection.find(search, opt).sort({id: 1})
      for await (const s of query) arr.push(s)
      return Errors.okResult(arr)
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }
  
  /** Find sensors which satify search. Returns [] if none. 
   *  Note that all primitive Sensor fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensors(search: SensorSearch) : Promise<Errors.Result<Sensor[]>> {
    try {
      let arr: Sensor[] = []
      const collection = this.sensors
      const opt = { projection: {_id: 0}}
      const query = collection.find(search, opt).sort({id: 1})
      for await (const s of query) arr.push(s)
      return Errors.okResult(arr)
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }

  /** Find sensor readings which satisfy search. Returns [] if none. 
   *  The returned array must be sorted by timestamp.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensorReadings(search: SensorReadingSearch)
    : Promise<Errors.Result<SensorReading[]>> 
  {
    try {
      let arr: SensorReading[] = []
      const collection = this.sensorreadings
      const opt = { projection: {_id: 0}}
      const query = collection.find({
        sensorId: search.sensorId,
        timestamp: {
          $gte: search.minTimestamp,
          $lte: search.maxTimestamp
        },
        value: {
          $gte: search.minValue,
          $lte: search.maxValue
        }
      }, opt).sort({timestamp: 1})
      for await (const r of query) arr.push(r)
      return Errors.okResult(arr)
    } catch (e) {
      return Errors.errResult(e.message, 'DB')
    }
  }
  
} //SensorsDao

//mongo err.code on inserting duplicate entry
const MONGO_DUPLICATE_CODE = 11000;

