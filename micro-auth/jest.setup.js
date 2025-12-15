// Mocks globales para tests

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  model: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    findById: jest.fn(),
  }),
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
  })),
}));

// Mock SessionService
jest.mock('./src/services/sessionService', () => ({
  setTokenVersion: jest.fn().mockResolvedValue(),
  getTokenVersion: jest.fn().mockResolvedValue(0),
  verifyTokenVersion: jest.fn().mockResolvedValue(true),
  incrementTokenVersion: jest.fn().mockResolvedValue(1),
}));