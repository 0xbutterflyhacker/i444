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

  
  private constructor(private readonly client: mongo.MongoClient, private readonly sensors: mongo.Collection<DbSensor>, private readonly sensortypes: mongo.Collection<DbSensorType>) {
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
      const sensors = db.collection<DbSensor>('sensor_collection')
      const sensortypes = db.collection<DbSensorType>('sensortype_collection')
      await sensortypes.createIndex('sensor_type_id')
      await sensors.createIndex('sensor_id')
      return Errors.okResult(new SensorsDao(client, sensors, sensortypes))
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
      if (e.code === 11000) return Errors.errResult(e.message, 'EXISTS')
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
      if (e.code === 11000) return Errors.errResult(e.message, 'EXISTS')
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
    return Errors.errResult('todo', 'TODO');
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
    return Errors.errResult('todo', 'TODO');
  }
  
  /** Find sensors which satify search. Returns [] if none. 
   *  Note that all primitive Sensor fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensors(search: SensorSearch) : Promise<Errors.Result<Sensor[]>> {
    return Errors.errResult('todo', 'TODO');
  }

  /** Find sensor readings which satisfy search. Returns [] if none. 
   *  The returned array must be sorted by timestamp.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensorReadings(search: SensorReadingSearch)
    : Promise<Errors.Result<SensorReading[]>> 
  {
    return Errors.errResult('todo', 'TODO');
  }
  
} //SensorsDao

//mongo err.code on inserting duplicate entry
const MONGO_DUPLICATE_CODE = 11000;

