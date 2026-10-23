describe('Authentication', () => {

    const email = `e2e-test-${Date.now()}@memorizez.com`;

    describe('register', () => {

        it('should register a user successfully', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
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

        });

        it('should not register a user with an empty name', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
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

        });

        it('should not register a user with an existing email', () => {

            const user = {
                name: 'Test User',
                email: `e2e-duplicate-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: user
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users',
                        body: user,
                        headers: {
                            'X-CSRF-TOKEN': csrfToken
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(409);

                    });

                });

            });

        });

        it('should not register a user when passwords do not match', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
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

    });

    describe('login', () => {

        it('should login successfully', () => {

            const user = {
                name: 'Login User',
                email: `e2e-login-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {
                            'X-CSRF-TOKEN': csrfToken
                        },
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((loginResponse) => {

                        expect(loginResponse.status).to.equal(200);

                    });

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

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {
                            'X-CSRF-TOKEN': csrfToken
                        },
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

        });

        it('should not login with a non-existing email', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: {
                        email: `e2e-non-existing-${Date.now()}@memorizez.com`,
                        password: 'password123'
                    },
                    failOnStatusCode: false
                }).then((response) => {

                    expect(response.status).to.equal(401);

                });

            });

        });

        it('should not login with an invalid email', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users/login',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: {
                        email: 'invalid-email',
                        password: 'password123'
                    },
                    failOnStatusCode: false
                }).then((response) => {

                    expect(response.status).to.equal(400);

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

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {'X-CSRF-TOKEN': csrfToken},
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((loginResponse) => {

                        expect(loginResponse.status).to.equal(200);

                        cy.request('GET', '/csrf').then((newCsrfResponse) => {
                            const newCsrfToken = newCsrfResponse.body.token;

                            cy.request({
                                method: 'DELETE',
                                url: '/users',
                                headers: {
                                    'X-CSRF-TOKEN': newCsrfToken
                                },
                                failOnStatusCode: false
                            }).then((deleteResponse) => {

                                expect(deleteResponse.status).to.equal(204);

                            });

                        });

                    });

                });

            });

        });

        it('should not delete a user when not authenticated', () => {

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'DELETE',
                    url: '/users',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken
                    },
                    failOnStatusCode: false
                }).then((response) => {

                    expect(response.status).to.equal(401);
                });

            });

        });

        it('should not login after deleting the user', () => {

            const user = {
                name: 'Deleted User',
                email: `e2e-deleted-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {'X-CSRF-TOKEN': csrfToken},
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((loginResponse) => {

                        expect(loginResponse.status).to.equal(200);

                        cy.request('GET', '/csrf').then((newCsrfResponse) => {
                            const newCsrfToken = newCsrfResponse.body.token;

                            cy.request({
                                method: 'DELETE',
                                url: '/users',
                                headers: {'X-CSRF-TOKEN': newCsrfToken}
                            }).then((deleteResponse) => {

                                expect(deleteResponse.status).to.equal(204);

                                cy.request('GET', '/csrf').then((finalCsrfResponse) => {
                                    cy.request({
                                        method: 'POST',
                                        url: '/users/login',
                                        headers: {
                                            'X-CSRF-TOKEN': finalCsrfResponse.body.token
                                        },
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

        });

        it('should logout the authenticated user', () => {

            const user = {
                name: 'Logout User',
                email: `e2e-logout-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {'X-CSRF-TOKEN': csrfToken},
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((loginResponse) => {

                        expect(loginResponse.status).to.equal(200);

                        cy.request('GET', '/csrf').then((newCsrfResponse) => {
                            cy.request({
                                method: 'POST',
                                url: '/logout',
                                headers: {
                                    'X-CSRF-TOKEN': newCsrfResponse.body.token
                                }
                            }).then((logoutResponse) => {

                                expect(logoutResponse.status).to.equal(204);

                            });

                        });

                    });

                });

            });

        });

        it('should not access protected endpoints after logout', () => {

            const user = {
                name: 'Logout User',
                email: `e2e-logout-protected-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                cy.request({
                    method: 'POST',
                    url: '/users',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: user
                }).then((registerResponse) => {

                    expect(registerResponse.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        headers: {'X-CSRF-TOKEN': csrfToken},
                        body: {
                            email: user.email,
                            password: user.password
                        }
                    }).then((loginResponse) => {

                        expect(loginResponse.status).to.equal(200);

                        cy.request('GET', '/csrf').then((newCsrfResponse) => {
                            cy.request({
                                method: 'POST',
                                url: '/logout',
                                headers: {
                                    'X-CSRF-TOKEN': newCsrfResponse.body.token
                                }
                            }).then((logoutResponse) => {

                                expect(logoutResponse.status).to.equal(204);

                                cy.request({
                                    method: 'GET',
                                    url: '/collections',
                                    failOnStatusCode: false
                                }).then((collectionsResponse) => {

                                    expect(collectionsResponse.status).to.equal(401);

                                });

                            });

                        });

                    });

                });

            });

        });

    });

});