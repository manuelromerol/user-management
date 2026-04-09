import { test, expect } from '@playwright/test';

test.describe('User Management API', () => {

    const timestamp = Date.now();

    const userA = { name: 'Sarah Blake', email: `user_a${timestamp}@test.com`, age: 25 };
    // const userB = { name: 'Robert Evans', email: `user_b${timestamp}@test.com`, age: 30 };
    const existingUser = { name: 'Existing User', email: `existing_user@test.com`, age: 60 };
    const updateUser = { name: 'Update User', email: `update_user@test.com`, age: 18 };
    // const deletingUser = { name: 'Deleting User', email: `deleting_user@test.com`, age: 42 };

    /**
     * ENDPOINT: /users
     */

    test.describe('/users endpoints', () => {

        test('POST - Create User (201 Created)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '201 Created' });
            const response = await request.post('users', { data: userA });
            expect(response.status()).toBe(201);
            expect(await response.json()).toMatchObject(userA);
        });

        test('POST - Duplicate Email (409 Conflict)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '409 Conflict' });
            // Attempting to create userA again
            const response = await request.post('users', { data: userA });
            expect(response.status()).toBe(409);
        });

        test('POST - Validation Error: Age > 150 (400 Bad Request)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '400 Bad Request' });
            const response = await request.post('users', {
                data: { ...userA, age: 151 }
            });
            expect(response.status()).toBe(400);
        });

        test('GET - List All Users (200 OK)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '200 OK' });
            const response = await request.get('users');
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body)).toBeTruthy();
        });
    });


    /**
     * ENDPOINT: /users/{email}
     */
    test.describe('/users/{email} endpoints', () => {

        test('GET - Get User by Email (200 OK)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '200 OK' });
            const response = await request.get(`users/${existingUser.email}`);
            // const response = await request.get(`users/blake_1775699606675@test.com`);
            expect(response.status()).toBe(200);
            expect(await response.json()).toMatchObject(existingUser);
        });

        test('GET - User Not Found (404 Not Found)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '404 Not Found' });
            const response = await request.get('users/doesnotexist@test.com');
            expect(response.status()).toBe(404);
        });

        test('PUT - Update User (200 OK)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '200 OK' });
            const updated = { ...updateUser, name: 'Update User', age: 32 };
            const response = await request.put(`users/${updateUser.email}`, { data: updated });
            expect(response.status()).toBe(200);
            // expect(await response.json()).toMatchObject(updated);
        });

        test('PUT - Validation Error: Age < 1 (400 Bad Request)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '400 Bad Request' });
            const response = await request.put(`users/${updateUser.email}`, {
                data: { ...updateUser, age: 0 }
            });
            expect(response.status()).toBe(400);
        });

        test('PUT - User Not Found (404 Not Found)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '404 Not Found' });

            const response = await request.put('users/nonexistent-user@test.com', {
                data: {
                    name: 'Ghost User',
                    email: 'nonexistent-user@test.com',
                    age: 40
                }
            });

            expect(response.status()).toBe(404);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        test('PUT - Update to Existing Email (409 Conflict)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '409 Conflict' });
            const response = await request.put(`users/${existingUser.email}`, {
                data: { ...existingUser, email: "existing_user@test.com" }
            });
            expect(response.status()).toBe(409);
        });

        test('DELETE - Missing Authentication (401 Unauthorized)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '401 Unauthorized' });
            const response = await request.delete(`users/${userA.email}`);
            expect(response.status()).toBe(401);
        });

        test('DELETE - Delete Success (204 No Content)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '204 No Content' });
            const deletingUser = { ...existingUser, name: 'Deleting User', email: "deleting_user@test.com" };
            let response = await request.post('users', { data: deletingUser });
            expect(response.status()).toBe(201);
            response = await request.delete(`users/${deletingUser.email}`, {
                headers: { 'Authentication': 'secret-token' }
            });
            expect(response.status()).toBe(204);
        });

        test('DELETE - Already Deleted/Not Found (404 Not Found)', async ({ request }) => {
            test.info().annotations.push({ type: 'expected', description: '404 Not Found' });
            const response = await request.delete(`users/${userA.email}`, {
                headers: { 'Authentication': 'secret-token' }
            });
            expect(response.status()).toBe(404);
        });
    });
});