import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Community Unread Messages E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let user1Id: number;
  let user2Id: number;
  let community1Id: number;
  let community2Id: number;
  let user1Token: string;
  let user2Token: string;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('apiPrefix', 'api');
    app.setGlobalPrefix(apiPrefix);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    await app.listen(0); // Random port for testing

    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}`;

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Создать двух пользователей
    const user1 = await prismaService.users.create({
      data: {
        phone: '+79001111111',
        firstName: 'User1',
        lastName: 'Test',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    user1Id = user1.id;

    const user2 = await prismaService.users.create({
      data: {
        phone: '+79002222222',
        firstName: 'User2',
        lastName: 'Test',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    user2Id = user2.id;

    // Создать два сообщества
    const community1 = await prismaService.community.create({
      data: {
        name: 'Test Community 1',
        description: 'Test community 1',
        latitude: 55.7558,
        longitude: 37.6176,
        createdBy: user1Id,
      },
    });
    community1Id = community1.id;

    const community2 = await prismaService.community.create({
      data: {
        name: 'Test Community 2',
        description: 'Test community 2',
        latitude: 55.7558,
        longitude: 37.6176,
        createdBy: user1Id,
      },
    });
    community2Id = community2.id;

    // Добавить обоих пользователей как членов обоих сообществ
    await prismaService.usersOnCommunities.createMany({
      data: [
        { userId: user1Id, communityId: community1Id },
        { userId: user1Id, communityId: community2Id },
        { userId: user2Id, communityId: community1Id },
        { userId: user2Id, communityId: community2Id },
      ],
    });

    // Создать чаты для сообществ
    await prismaService.communityChat.createMany({
      data: [
        { communityId: community1Id, isActive: true },
        { communityId: community2Id, isActive: true },
      ],
    });

    // Генерировать токены
    user1Token = jwtService.sign(
      {
        sub: user1Id,
        phone: user1.phone,
        role: user1.role,
        type: 'access',
      },
      { expiresIn: '1h' },
    );

    user2Token = jwtService.sign(
      {
        sub: user2Id,
        phone: user2.phone,
        role: user2.role,
        type: 'access',
      },
      { expiresIn: '1h' },
    );
  }

  async function cleanupTestData() {
    // Удалить тестовые данные в правильном порядке
    await prismaService.communityMessage.deleteMany({
      where: {
        communityId: { in: [community1Id, community2Id] },
      },
    });
    await prismaService.communityRead.deleteMany({
      where: {
        userId: { in: [user1Id, user2Id] },
      },
    });
    await prismaService.communityChat.deleteMany({
      where: {
        communityId: { in: [community1Id, community2Id] },
      },
    });
    await prismaService.usersOnCommunities.deleteMany({
      where: {
        userId: { in: [user1Id, user2Id] },
      },
    });
    await prismaService.community.deleteMany({
      where: {
        id: { in: [community1Id, community2Id] },
      },
    });
    await prismaService.users.deleteMany({
      where: {
        id: { in: [user1Id, user2Id] },
      },
    });
  }

  describe('REST API: GET /api/communities/unread', () => {
    beforeEach(async () => {
      // Очистить сообщения и прочтения перед каждым тестом
      await prismaService.communityMessage.deleteMany({
        where: { communityId: { in: [community1Id, community2Id] } },
      });
      await prismaService.communityRead.deleteMany({
        where: { userId: { in: [user1Id, user2Id] } },
      });
    });

    it('должен вернуть правильные счётчики непрочитанных для user1', async () => {
      // Вставить 3 сообщения в community1 от user2
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 1',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 2',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 3',
            createdAt: new Date(baseTime.getTime() + 3000),
            isModerated: true,
            isDeleted: false,
          },
        ],
      });

      // Вставить 5 сообщений в community2 от user1
      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 1',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 2',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 3',
            createdAt: new Date(baseTime.getTime() + 3000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 4',
            createdAt: new Date(baseTime.getTime() + 4000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 5',
            createdAt: new Date(baseTime.getTime() + 5000),
            isModerated: true,
            isDeleted: false,
          },
        ],
      });

      // Вставить CommunityRead для user1 в community1 перед всеми сообщениями
      await prismaService.communityRead.create({
        data: {
          userId: user1Id,
          communityId: community1Id,
          readAt: new Date(baseTime.getTime() - 1000),
        },
      });

      // Выполнить запрос для user1
      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );
      const c2Unread = response.body.find(
        (item: any) => item.communityId === community2Id,
      );

      expect(c1Unread).toBeDefined();
      expect(c1Unread.unreadCount).toBe(3);

      expect(c2Unread).toBeDefined();
      expect(c2Unread.unreadCount).toBe(5);
    });

    it('должен вернуть правильные счётчики для user2', async () => {
      // Вставить 3 сообщения в community1 от user2 (сам)
      const baseTime = new Date('2024-01-01T10:00:00Z');
      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 1',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 2',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 3',
            createdAt: new Date(baseTime.getTime() + 3000),
            isModerated: true,
            isDeleted: false,
          },
        ],
      });

      // Вставить 5 сообщений в community2 от user1
      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 1',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 2',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 3',
            createdAt: new Date(baseTime.getTime() + 3000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 4',
            createdAt: new Date(baseTime.getTime() + 4000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community2Id,
            userId: user1Id,
            text: 'Message 5',
            createdAt: new Date(baseTime.getTime() + 5000),
            isModerated: true,
            isDeleted: false,
          },
        ],
      });

      // Выполнить запрос для user2
      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );
      const c2Unread = response.body.find(
        (item: any) => item.communityId === community2Id,
      );

      // community1: сообщения от себя, но считаем все непрочитанные
      expect(c1Unread).toBeDefined();
      expect(c1Unread.unreadCount).toBe(3);

      // community2: 5 сообщений от user1
      expect(c2Unread).toBeDefined();
      expect(c2Unread.unreadCount).toBe(5);
    });

    it('должен вернуть 0 непрочитанных, если все сообщения прочитаны', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      // Вставить сообщения
      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 1',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Message 2',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: false,
          },
        ],
      });

      // Отметить как прочитанные (readAt после всех сообщений)
      await prismaService.communityRead.create({
        data: {
          userId: user1Id,
          communityId: community1Id,
          readAt: new Date(baseTime.getTime() + 10000),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );

      expect(c1Unread).toBeDefined();
      expect(c1Unread.unreadCount).toBe(0);
    });

    it('не должен считать удалённые сообщения', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Active Message',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Deleted Message',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: true,
            isDeleted: true, // Удалено
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );

      expect(c1Unread).toBeDefined();
      expect(c1Unread.unreadCount).toBe(1); // Только активное сообщение
    });

    it('не должен считать немодерированные сообщения', async () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      await prismaService.communityMessage.createMany({
        data: [
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Moderated Message',
            createdAt: new Date(baseTime.getTime() + 1000),
            isModerated: true,
            isDeleted: false,
          },
          {
            communityId: community1Id,
            userId: user2Id,
            text: 'Unmoderated Message',
            createdAt: new Date(baseTime.getTime() + 2000),
            isModerated: false, // Не модерировано
            isDeleted: false,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );

      expect(c1Unread).toBeDefined();
      expect(c1Unread.unreadCount).toBe(1); // Только модерированное
    });

    it('не должен возвращать сообщества, в которых пользователь не является членом', async () => {
      // Удалить user1 из community1
      await prismaService.usersOnCommunities.delete({
        where: {
          userId_communityId: {
            userId: user1Id,
            communityId: community1Id,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/communities/unread')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);

      const c1Unread = response.body.find(
        (item: any) => item.communityId === community1Id,
      );

      expect(c1Unread).toBeUndefined(); // community1 не должно быть в ответе

      // Восстановить членство для последующих тестов
      await prismaService.usersOnCommunities.create({
        data: {
          userId: user1Id,
          communityId: community1Id,
        },
      });
    });

    it('должен вернуть 401 без токена аутентификации', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/communities/unread',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('WebSocket: community:unread', () => {
    let socket1: Socket;

    afterEach((done) => {
      if (socket1 && socket1.connected) {
        socket1.disconnect();
      }
      // Даём время на отключение
      setTimeout(done, 100);
    });

    beforeEach(async () => {
      // Очистить сообщения перед каждым WebSocket тестом
      await prismaService.communityMessage.deleteMany({
        where: { communityId: { in: [community1Id, community2Id] } },
      });
      await prismaService.communityRead.deleteMany({
        where: { userId: { in: [user1Id, user2Id] } },
      });
    });

    it('должен вернуть счётчики непрочитанных через WebSocket', (done) => {
      const baseTime = new Date('2024-01-01T10:00:00Z');

      // Вставить тестовые данные
      prismaService.communityMessage
        .createMany({
          data: [
            {
              communityId: community1Id,
              userId: user2Id,
              text: 'WS Test Message 1',
              createdAt: new Date(baseTime.getTime() + 1000),
              isModerated: true,
              isDeleted: false,
            },
            {
              communityId: community1Id,
              userId: user2Id,
              text: 'WS Test Message 2',
              createdAt: new Date(baseTime.getTime() + 2000),
              isModerated: true,
              isDeleted: false,
            },
          ],
        })
        .then(() => {
          socket1 = io(serverUrl, {
            auth: { token: user1Token },
            transports: ['websocket'],
          });

          socket1.on('connect', () => {
            socket1.emit('community:unread', {}, (response: any) => {
              try {
                expect(response.status).toBe('ok');
                expect(Array.isArray(response.data)).toBe(true);

                const c1Unread = response.data.find(
                  (item: any) => item.communityId === community1Id,
                );

                expect(c1Unread).toBeDefined();
                expect(c1Unread.unreadCount).toBe(2);

                done();
              } catch (error) {
                done(error);
              }
            });
          });

          socket1.on('connect_error', (error) => {
            done(error);
          });
        })
        .catch((error) => {
          done(error);
        });
    }, 10000);

    it('должен автоматически обновлять счётчики при получении нового сообщения', (done) => {
      let socket2: Socket;
      let unreadEventReceived = false;

      socket1 = io(serverUrl, {
        auth: { token: user1Token },
        transports: ['websocket'],
      });

      socket2 = io(serverUrl, {
        auth: { token: user2Token },
        transports: ['websocket'],
      });

      socket1.on('connect', () => {
        // user1 присоединяется к community1
        socket1.emit(
          'community:join',
          { communityId: community1Id },
          (response: any) => {
            expect(response.status).toBe('joined');

            // Слушать обновления непрочитанных
            socket1.on('community:unread', (data: any) => {
              try {
                unreadEventReceived = true;
                expect(data.status).toBe('ok');
                expect(Array.isArray(data.data)).toBe(true);

                const c1Unread = data.data.find(
                  (item: any) => item.communityId === community1Id,
                );

                if (c1Unread && c1Unread.unreadCount > 0) {
                  expect(c1Unread.unreadCount).toBeGreaterThan(0);
                  socket2.disconnect();
                  done();
                }
              } catch (error) {
                socket2.disconnect();
                done(error);
              }
            });

            // user2 присоединяется и отправляет сообщение
            socket2.on('connect', () => {
              socket2.emit(
                'community:join',
                { communityId: community1Id },
                () => {
                  socket2.emit(
                    'community:sendMessage',
                    {
                      communityId: community1Id,
                      text: 'Auto broadcast test message',
                    },
                    (sendResponse: any) => {
                      expect(sendResponse.status).toBe('sent');
                    },
                  );
                },
              );
            });
          },
        );
      });

      socket1.on('connect_error', (error) => {
        if (socket2) socket2.disconnect();
        done(error);
      });

      socket2.on('connect_error', (error) => {
        done(error);
      });

      // Таймаут на случай, если событие не приходит
      setTimeout(() => {
        socket2.disconnect();
        if (!unreadEventReceived) {
          done(new Error('community:unread event not received within timeout'));
        }
      }, 8000);
    }, 10000);

    it('должен обрабатывать пустой payload', (done) => {
      socket1 = io(serverUrl, {
        auth: { token: user1Token },
        transports: ['websocket'],
      });

      socket1.on('connect', () => {
        // Отправить без payload
        socket1.emit('community:unread', undefined, (response: any) => {
          try {
            expect(response.status).toBe('ok');
            expect(Array.isArray(response.data)).toBe(true);
            done();
          } catch (error) {
            done(error);
          }
        });
      });

      socket1.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);
  });
});

