/**
 * UserRepository Implementation
 * Implementación del repositorio de usuarios usando MongoDB
 */

const User = require('../../domain/entities/User');
const UserModel = require('../../models/User');

class UserRepositoryMongo {
  async save(user) {
    try {
      const persistenceData = user.toPersistence();

      // Usar findByIdAndUpdate para upsert, o crear uno nuevo
      let result;
      if (persistenceData._id) {
        result = await UserModel.findByIdAndUpdate(
          persistenceData._id,
          persistenceData,
          { upsert: true, new: true }
        );
      } else {
        // Crear nuevo documento
        result = await UserModel.create(persistenceData);
      }

      console.log(`[UserRepositoryMongo] User saved: ${result._id}`);
      return User.fromPersistence(result);
    } catch (error) {
      console.error(`[UserRepositoryMongo] Save error: ${error.message}`);
      throw error;
    }
  }

  async findById(id) {
    try {
      const document = await UserModel.findById(id);
      if (!document) return null;

      return User.fromPersistence(document);
    } catch (error) {
      console.error(`[UserRepositoryMongo] FindById error: ${error.message}`);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const queryEmail = (email || '').toLowerCase();
      const document = await UserModel.findOne({ email: queryEmail });
      console.log(`[UserRepositoryMongo] findByEmail(${queryEmail}) -> ${document ? 'FOUND' : 'NOT FOUND'}`);
      if (!document) return null;

      return User.fromPersistence(document);
    } catch (error) {
      console.error(`[UserRepositoryMongo] FindByEmail error: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      const documents = await UserModel.find({});
      return documents.map(doc => User.fromPersistence(doc));
    } catch (error) {
      console.error(`[UserRepositoryMongo] FindAll error: ${error.message}`);
      throw error;
    }
  }

  async delete(id) {
    try {
      await UserModel.findByIdAndDelete(id);
      console.log(`[UserRepositoryMongo] User deleted: ${id}`);
    } catch (error) {
      console.error(`[UserRepositoryMongo] Delete error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = UserRepositoryMongo;
