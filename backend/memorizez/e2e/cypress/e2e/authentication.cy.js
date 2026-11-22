describe('Authentication', () => {

    const email = `e2e-test-${Date.now()}@memorizez.com`;

    describe('register', () => {

        it('should register a user successfully', () => {
            cy.request({
                method: 'POST',
                url: '/users',
                body: {
                    name: 'Test User',
                    email: email,
                    password: 'password123',
                    confirmPassword: 'password123'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

            });

        });

        it('should not register a user with an empty name', () => {
            cy.request({
                method: 'POST',
                url: '/users',
                body: {
                    name: '',
                    email: email,
                    password: 'password123',
                    confirmPassword: 'password123'
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

        it('should not register a user with an existing email', () => {
            const user = {
                name: 'Test User',
                email: `e2e-duplicate-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users',
                    body: user,
                    failOnStatusCode: false
                }).then((duplicateResponse) => {

                    expect(duplicateResponse.status).to.equal(409);

                });

            });

        });

        it('should not register a user when passwords do not match', () => {
            cy.request({
                method: 'POST',
                url: '/users',
                body: {
                    name: 'Test User',
                    email: 'e2e-password-error@memorizez.com',
                    password: 'password123',
                    confirmPassword: 'different123'
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

        it('should register a user with a name of exactly 100 characters', () => {
            const user = {
                name: 'A'.repeat(100),
                email: `e2e-name-100-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((response) => {

                expect(response.status).to.equal(201);

            });

        });

        it('should not register a user with a name longer than 100 characters', () => {
            const user = {
                name: 'A'.repeat(101),
                email: `e2e-name-101-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user,
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

    });

    describe('login', () => {

        it('should login successfully', () => {
            const user = {
                name: 'Login User',
                email: `e2e-login-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((loginResponse) => {

                    expect(loginResponse.status).to.equal(200);
                    expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;
                    expect(loginResponse.body.tokenType).to.equal('Bearer');
                    expect(loginResponse.body.expiresAt).to.be.a('string');

                });

            });

        });

        it('should not login with an incorrect password', () => {
            const user = {
                name: 'Login User',
                email: `e2e-wrong-password-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: 'wrong-password'
                    },
                    failOnStatusCode: false
                }).then((loginResponse) => {

                    expect(loginResponse.status).to.equal(401);

                });

            });

        });

        it('should not login with a non-existing email', () => {
            cy.request({
                method: 'POST',
                url: '/users/login',
                body: {
                    email: `e2e-non-existing-${Date.now()}@memorizez.com`,
                    password: 'password123'
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(401);

            });

        });

        it('should not login with an invalid email', () => {
            cy.request({
                method: 'POST',
                url: '/users/login',
                body: {
                    email: 'invalid-email',
                    password: 'password123'
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

        it('should access protected endpoints with a valid token', () => {
            const user = {
                name: 'Protected User',
                email: `e2e-protected-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((loginResponse) => {

                    expect(loginResponse.status).to.equal(200);

                    const token = loginResponse.body.token;

                    cy.request({
                        method: 'GET',
                        url: '/users/me',
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }).then((profileResponse) => {

                        expect(profileResponse.status).to.equal(200);
                        expect(profileResponse.body.email).to.equal(user.email);

                    });

                });

            });

        });

        it('should delete the authenticated user', () => {
            const user = {
                name: 'Delete User',
                email: `e2e-delete-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((loginResponse) => {

                    expect(loginResponse.status).to.equal(200);

                    const token = loginResponse.body.token;

                    cy.request({
                        method: 'DELETE',
                        url: '/users',
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }).then((deleteResponse) => {

                        expect(deleteResponse.status).to.equal(204);

                    });

                });

            });

        });

        it('should not delete a user when not authenticated', () => {
            cy.request({
                method: 'DELETE',
                url: '/users',
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(401);

            });

        });

        it('should not login after deleting the user', () => {
            const user = {
                name: 'Deleted User',
                email: `e2e-deleted-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((loginResponse) => {

                    expect(loginResponse.status).to.equal(200);

                    const token = loginResponse.body.token;

                    cy.request({
                        method: 'DELETE',
                        url: '/users',
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }).then((deleteResponse) => {

                        expect(deleteResponse.status).to.equal(204);

                        cy.request({
                            method: 'POST',
                            url: '/users/login',
                            body: {
                                email: user.email,
                                password: user.password
                            },
                            failOnStatusCode: false
                        }).then((response) => {

                            expect(response.status).to.equal(401);

                        });

                    });

                });

            });
        });

    });

});