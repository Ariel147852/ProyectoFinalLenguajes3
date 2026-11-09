/**
 * Script de inicialización de colecciones e índices para MongoDB
 * Base de Datos: tool_library
 * Ejecución en mongosh:
 *   mongosh mongodb://127.0.0.1:27017/tool_library init_collections.js
 */

db = db.getSiblingDB('tool_library');

// 1. Colección USERS
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nombre', 'email', 'passwordHash', 'rol'],
      properties: {
        nombre: { bsonType: 'string', description: 'Nombre completo obligatorio' },
        email: { bsonType: 'string', pattern: '^\\S+@\\S+\\.\\S+$', description: 'Email válido requerido' },
        passwordHash: { bsonType: 'string', description: 'Hash bcrypt requerido' },
        rol: { enum: ['user', 'admin'], description: 'Rol de usuario' },
        reputacionPromedio: { bsonType: 'number', minimum: 0, maximum: 5 }
      }
    }
  }
});

db.users.createIndex({ email: 1 }, { unique: true });

// 2. Colección TOOLS con índice geoespacial 2dsphere
db.createCollection('tools');

db.tools.createIndex({ ubicacion: '2dsphere' });
db.tools.createIndex({ categoria: 1, activa: 1 });
db.tools.createIndex({ nombre: 'text', descripcion: 'text' });

// 3. Colección LOANS
db.createCollection('loans');

db.loans.createIndex({ herramientaId: 1, estado: 1 });
db.loans.createIndex({ solicitanteId: 1 });
db.loans.createIndex({ propietarioId: 1 });

// 4. Colección REVIEWS
db.createCollection('reviews');

db.reviews.createIndex({ receptorId: 1 });

print("Base de datos 'tool_library' e índices geoespaciales inicializados con éxito.");

