import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './app.controller';
import { AuthService } from './app.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn().mockReturnValue({ message: 'User registered' }),
            login: jest.fn().mockReturnValue({ token: 'fake-jwt-token' }),
          },
        },
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should return success message on signup', () => {
      const body = { name: 'John Doe', email: 'john@example.com', password: '123456' };
      expect(authController.signup(body)).toEqual({ message: 'User registered' });
    });
  });

  describe('login', () => {
    it('should return JWT token on login', () => {
      const body = { email: 'john@example.com', password: '123456' };
      expect(authController.login(body)).toEqual({ token: 'fake-jwt-token' });
    });
  });
});
