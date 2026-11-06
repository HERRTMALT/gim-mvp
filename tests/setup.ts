process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? 'test-secret-con-mas-de-32-caracteres-para-firmar';
process.env.OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'clave-de-prueba';
process.env.LOG_LEVEL = 'silent';
