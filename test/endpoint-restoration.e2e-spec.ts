import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Endpoint Restoration E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let testUserId: number;
  let testCommunityId: number;
  let testCategoryId: number;

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

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test user
    const testUser = await prismaService.users.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        address: '123 Test Street',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test community
    const testCommunity = await prismaService.community.create({
      data: {
        name: 'Test Community',
        description: 'Test community for e2e tests',
        latitude: 55.7558,
        longitude: 37.6176,
        createdBy: testUserId,
      },
    });
    testCommunityId = testCommunity.id;

    // Create test event category
    const testCategory = await prismaService.eventCategory.create({
      data: {
        name: 'Test Category',
        icon: 'test-icon',
      },
    });
    testCategoryId = testCategory.id;

    // Generate auth token (simplified for testing)
    authToken = 'test-auth-token';
  }

  async function cleanupTestData() {
    await prismaService.event.deleteMany({
      where: { createdBy: testUserId },
    });
    await prismaService.property.deleteMany({
      where: { userId: testUserId },
    });
    await prismaService.eventCategory.deleteMany({
      where: { id: testCategoryId },
    });
    await prismaService.community.deleteMany({
      where: { id: testCommunityId },
    });
    await prismaService.users.deleteMany({
      where: { id: testUserId },
    });
  }

  describe('PATCH /api/users/me', () => {
    it('should accept phone and address fields (200 OK)', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        phone: '+9876543210',
        address: '456 Updated Street',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('User');
      expect(response.body.phone).toBe('+9876543210');
      expect(response.body.address).toBe('456 Updated Street');
    });

    it('should reject invalid phone format (400 Bad Request)', async () => {
      const updateData = {
        phone: 'invalid-phone',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });

    it('should reject invalid address type (400 Bad Request)', async () => {
      const updateData = {
        address: 12345, // Should be string
      };

      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/properties/my', () => {
    it('should accept userLatitude and userLongitude fields (201 Created)', async () => {
      const propertyData = {
        name: 'Test Property',
        category: 'PRIVATE_HOUSE',
        latitude: 55.7558,
        longitude: 37.6176,
        userLatitude: 55.7560,
        userLongitude: 37.6180,
      };

      const response = await request(app.getHttpServer())
        .post('/api/properties/my')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Property');
      expect(response.body.latitude).toBe(55.7558);
      expect(response.body.longitude).toBe(37.6176);
    });

    it('should work without userLatitude and userLongitude (201 Created)', async () => {
      const propertyData = {
        name: 'Test Property 2',
        category: 'TOWNHOUSE',
        latitude: 55.7559,
        longitude: 37.6177,
      };

      const response = await request(app.getHttpServer())
        .post('/api/properties/my')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Property 2');
    });

    it('should reject invalid userLatitude format (400 Bad Request)', async () => {
      const propertyData = {
        name: 'Test Property',
        category: 'PRIVATE_HOUSE',
        latitude: 55.7558,
        longitude: 37.6176,
        userLatitude: 'invalid-latitude',
      };

      const response = await request(app.getHttpServer())
        .post('/api/properties/my')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(400);
    });

    it('should reject invalid userLongitude format (400 Bad Request)', async () => {
      const propertyData = {
        name: 'Test Property',
        category: 'PRIVATE_HOUSE',
        latitude: 55.7558,
        longitude: 37.6176,
        userLongitude: 'invalid-longitude',
      };

      const response = await request(app.getHttpServer())
        .post('/api/properties/my')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/events', () => {
    it('should accept maxParticipants and isPublic fields (201 Created)', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test event description',
        latitude: 55.7558,
        longitude: 37.6176,
        categoryId: testCategoryId,
        type: 'EVENT',
        communityId: testCommunityId,
        maxParticipants: 50,
        isPublic: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Event');
      expect(response.body.maxParticipants).toBe(50);
      expect(response.body.isPublic).toBe(true);
    });

    it('should work without maxParticipants and isPublic (201 Created)', async () => {
      const eventData = {
        title: 'Test Event 2',
        description: 'Test event description 2',
        latitude: 55.7559,
        longitude: 37.6177,
        categoryId: testCategoryId,
        type: 'NOTIFICATION',
        communityId: testCommunityId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Event 2');
    });

    it('should reject invalid maxParticipants format (400 Bad Request)', async () => {
      const eventData = {
        title: 'Test Event',
        latitude: 55.7558,
        longitude: 37.6176,
        categoryId: testCategoryId,
        type: 'EVENT',
        communityId: testCommunityId,
        maxParticipants: 'invalid-number',
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(400);
    });

    it('should reject invalid isPublic format (400 Bad Request)', async () => {
      const eventData = {
        title: 'Test Event',
        latitude: 55.7558,
        longitude: 37.6176,
        categoryId: testCategoryId,
        type: 'EVENT',
        communityId: testCommunityId,
        isPublic: 'invalid-boolean',
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(400);
    });

    it('should handle location object (frontend compatibility)', async () => {
      const eventData = {
        title: 'Test Event with Location',
        latitude: 55.7558,
        longitude: 37.6176,
        categoryId: testCategoryId,
        type: 'EVENT',
        communityId: testCommunityId,
        location: { lat: 55.7558, lng: 37.6176 }, // Frontend sends this
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      // Should succeed because forbidNonWhitelisted is false
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Event with Location');
    });
  });

  describe('ValidationPipe Configuration', () => {
    it('should allow extra fields when forbidNonWhitelisted is false', async () => {
      const eventData = {
        title: 'Test Event',
        latitude: 55.7558,
        longitude: 37.6176,
        categoryId: testCategoryId,
        type: 'EVENT',
        communityId: testCommunityId,
        extraField1: 'should be ignored',
        extraField2: 12345,
        extraField3: { nested: 'object' },
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Event');
      // Extra fields should be ignored but not cause errors
    });
  });
});
