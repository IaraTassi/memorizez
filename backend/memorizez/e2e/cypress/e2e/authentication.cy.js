describe('Authentication', () => {

    describe('register', () => {

        it('should register a user successfully', () => {

            cy.request({
                method: 'POST',
                url: '/users',
                body: {
                    name: 'Test User',
                    email: 'e2e-test@memorizez.com',
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
                    email: 'e2e-empty-name@memorizez.com',
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
                email: 'e2e-duplicate@memorizez.com',
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
                }).then((response) => {

                    expect(response.status).to.equal(409);

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

    });

    describe('login', () => {

        it('should login successfully', () => {

            const user = {
                name: 'Login User',
                email: 'e2e-login@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {

                    expect(response.status).to.equal(200);

                });

            });

        });

        it('should not login with an incorrect password', () => {

            const user = {
                name: 'Login User',
                email: 'e2e-wrong-password@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: 'wrong-password'
                    },
                    failOnStatusCode: false
                }).then((response) => {

                    expect(response.status).to.equal(401);

                });

            });

        });

        it('should not login with a non-existing email', () => {

            cy.request({
                method: 'POST',
                url: '/users/login',
                body: {
                    email: 'e2e-non-existing@memorizez.com',
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

        it('should delete the authenticated user', () => {

            const user = {
                name: 'Delete User',
                email: 'e2e-delete@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    cy.request({
                        method: 'DELETE',
                        url: '/users',
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(204);

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
                email: 'e2e-deleted@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    cy.request({
                        method: 'DELETE',
                        url: '/users'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

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

        it('should logout the authenticated user', () => {

            const user = {
                name: 'Logout User',
                email: 'e2e-logout@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                    });

                });

            });

        });

        it('should not access protected endpoints after logout', () => {

            const user = {
                name: 'Logout User',
                email: 'e2e-logout-protected@memorizez.com',
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
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'GET',
                            url: '/collections',
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