/**
 * UserRepository Implementation
 * Implementación del repositorio de usuarios usando MongoDB
 */

const User = require('../../domain/entities/User');
const UserModel = require('../../models/User');
const bcrypt = require('bcryptjs');

class UserRepositoryMongo {
  async save(user) {
    try {
      const persistenceData = user.toPersistence();

      // Hash password if it's not already hashed (for new users)
      if (persistenceData.password && !persistenceData.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12);
        persistenceData.password = await bcrypt.hash(persistenceData.password, salt);
      }

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
      const document = await UserModel.findOne({ email: email.toLowerCase() });
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
