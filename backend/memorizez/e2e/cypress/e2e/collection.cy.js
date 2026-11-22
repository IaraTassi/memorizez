describe('Collection and card', () => {

    describe('Collection', () => {

        let user;
        let token;

        const authHeaders = () => ({
            Authorization: `Bearer ${token}`
        });

        beforeEach(() => {
            user = {
                name: 'Collection E2E User',
                email: `e2e-collection-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {

                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                });

            }).then((loginResponse) => {

                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                token = loginResponse.body.token;

            });
        });

        it('should create a collection successfully', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((response) => {
                expect(response.status).to.equal(201);
            });
        });

        it('should not create a collection with an empty name', () => {
            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: ''
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });
        });

        it('should not create a collection with a name longer than 100 characters', () => {
            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: 'A'.repeat(101)
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });
        });

        it('should allow collections with the same name', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((firstResponse) => {

                expect(firstResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: authHeaders(),
                    body: {
                        name: collectionName
                    }
                });

            }).then((secondResponse) => {

                expect(secondResponse.status).to.equal(201);

            });

        });

        it('should list the collections of the authenticated user', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {

                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });

            }).then((response) => {

                expect(response.status).to.equal(200);
                expect(response.body).to.have.length(1);
                expect(response.body[0].name).to.equal(collectionName);

            });

        });

        it('should return an empty list when user has no collections', () => {
            return cy.request({
                method: 'GET',
                url: '/collections',
                headers: authHeaders()
            }).then((response) => {

                expect(response.status).to.equal(200);
                expect(response.body).to.have.length(0);

            });

        });

        it('should only list collections belonging to the authenticated user', () => {
            const secondUser = {
                name: 'Second User',
                email: `e2e-collection-owner-two-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            const firstCollectionName = `First User Collection ${Date.now()}`;
            const secondCollectionName = `Second User Collection ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: firstCollectionName
                }
            }).then((firstCollectionResponse) => {
                expect(firstCollectionResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                });
            }).then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                });
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                const secondToken = loginResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    body: {
                        name: secondCollectionName
                    }
                }).then((secondCollectionResponse) => {
                    expect(secondCollectionResponse.status).to.equal(201);

                    return cy.request({
                        method: 'GET',
                        url: '/collections',
                        headers: {
                            Authorization: `Bearer ${secondToken}`
                        }
                    });
                });
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body).to.have.length(1);
                expect(response.body[0].name).to.equal(secondCollectionName);

                expect(response.body.some(
                    (collection) => collection.name === firstCollectionName
                )).to.equal(false);
            });
        });

        it('should not list collections when not authenticated', () => {
            return cy.request({
                method: 'GET',
                url: '/collections',
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(401);

            });

        });

        it('should update a collection successfully', () => {
            const originalName = `Java ${Date.now()}`;
            const updatedName = `Java Spring ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: originalName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === originalName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collection.id}`,
                    headers: authHeaders(),
                    body: {
                        name: updatedName
                    }
                });
            }).then((response) => {
                expect(response.status).to.equal(204);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                expect(response.body.some(
                    (collection) => collection.name === updatedName
                )).to.equal(true);
            });
        });

        it('should not update a collection with an empty name', () => {
            const originalName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: originalName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === originalName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collection.id}`,
                    headers: authHeaders(),
                    body: {
                        name: ''
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });
        });

        it('should allow updating a collection to an existing name', () => {
            const javaName = `Java ${Date.now()}`;
            const pythonName = `Python ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: { name: javaName }
            }).then((response) => {
                expect(response.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: authHeaders(),
                    body: { name: pythonName }
                });
            }).then((response) => {
                expect(response.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const pythonCollection = response.body.find(
                    (collection) => collection.name === pythonName
                );

                expect(pythonCollection).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${pythonCollection.id}`,
                    headers: authHeaders(),
                    body: { name: javaName }
                });
            }).then((response) => {
                expect(response.status).to.equal(204);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body).to.have.length(2);

                const javaCollections = response.body.filter(
                    (collection) => collection.name === javaName
                );

                expect(javaCollections).to.have.length(2);
            });
        });

        it('should not update a collection belonging to another user', () => {
            const collectionName = `Private Collection ${Date.now()}`;

            const secondUser = {
                name: 'Second Update User',
                email: `e2e-collection-owner-two-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                }).then((registerResponse) => {
                    expect(registerResponse.status).to.equal(201);

                    return collection.id;
                });
            }).then((collectionId) => {
                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                }).then((loginResponse) => {
                    expect(loginResponse.status).to.equal(200);
                    expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                    return {
                        collectionId,
                        secondToken: loginResponse.body.token
                    };
                });
            }).then(({ collectionId, secondToken }) => {
                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}`,
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    body: {
                        name: 'Changed by Another User'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });

        it('should not update a collection when not authenticated', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collection.id}`,
                    body: {
                        name: 'Changed'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(401);
            });
        });

        it('should delete a collection successfully', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collection.id}`,
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(204);
            });
        });

        it('should not list the collection after deleting it', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collection.id}`,
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(204);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                expect(
                    response.body.some(
                        (collection) => collection.name === collectionName
                    )
                ).to.equal(false);
            });
        });

        it('should not delete a collection when not authenticated', () => {
            const collectionName = `Java ${Date.now()}`;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                   return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collection.id}`,
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(401);
            });
        });

        it('should not delete a collection belonging to another user', () => {
            const collectionName = `Private Collection ${Date.now()}`;

            const secondUser = {
                name: 'Second Delete User',
                email: `e2e-collection-delete-other-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: authHeaders(),
                body: {
                    name: collectionName
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);

                const collection = response.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                }).then((registerResponse) => {
                    expect(registerResponse.status).to.equal(201);

                    return collection.id;
                });
            }).then((collectionId) => {
                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                }).then((loginResponse) => {
                    expect(loginResponse.status).to.equal(200);
                    expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                    return {
                        collectionId,
                        secondToken: loginResponse.body.token
                    };
                });
            }).then(({ collectionId, secondToken }) => {
                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collectionId}`,
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });

    });

    describe('Card', () => {

        let collectionId;
        let user;
        let token;

        const authHeaders = () => ({
            Authorization: `Bearer ${token}`
        });

        beforeEach(() => {

            user = {
                name: 'Card E2E User',
                email: `e2e-card-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            return cy.request({
                method: 'POST',
                url: '/users',
                body: user
            }).then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: user.email,
                        password: user.password
                    }
                });
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                token = loginResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: authHeaders(),
                    body: {
                        name: `Java ${Date.now()}`
                    }
                });
            }).then((collectionResponse) => {
                expect(collectionResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: authHeaders()
                });
            }).then((collectionsResponse) => {
                expect(collectionsResponse.status).to.equal(200);

                const collection = collectionsResponse.body.find(
                    (item) => item.name.startsWith('Java ')
                );

                expect(collection).to.exist;

                collectionId = collection.id;
            });

        });


        it('should create a card successfully', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Created for E2E testing.'
                }
            }).then((response) => {
                expect(response.status).to.equal(201);
            });

        });

        it('should not create a card when front exceeds 200 characters', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'A'.repeat(201),
                    back: 'A programming language.',
                    notes: 'Test'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not create a card when back exceeds 400 characters', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A'.repeat(401),
                    notes: 'Test'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not create a card when notes exceeds 300 characters', () => {

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'A'.repeat(301)
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not create a card when front is empty', () => {

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: '',
                    back: 'A programming language.',
                    notes: 'Test'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not create a card when back is empty', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: '',
                    notes: 'Test'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should create a card without notes', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {
                expect(response.status).to.equal(201);
            });

        });

        it('should not create a card in another user collection', () => {
            const secondUser = {
                name: 'Second Card User',
                email: `e2e-card-second-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            let secondToken;
            let secondCollectionId;

            return cy.request({
                method: 'POST',
                url: '/users',
                body: secondUser
            }).then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                });
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                secondToken = loginResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    body: {
                        name: `Second User Collection ${Date.now()}`
                    }
                });
            }).then((collectionResponse) => {
                expect(collectionResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    }
                });
            }).then((collectionsResponse) => {
                expect(collectionsResponse.status).to.equal(200);
                expect(collectionsResponse.body).to.have.length(1);

                secondCollectionId = collectionsResponse.body[0].id;

                return cy.request({
                    method: 'POST',
                    url: `/collections/${secondCollectionId}/cards`,
                    headers: authHeaders(),
                    body: {
                        front: 'What is Java?',
                        back: 'A programming language.'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(404);
            });

        });

        it('should not create a card when not authenticated', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(401);
            });

        });

        it('should list cards successfully', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Test'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.content).to.have.length(1);
                expect(response.body.content[0].front).to.equal('What is Java?');
                expect(response.body.content[0].back).to.equal('A programming language.');
                expect(response.body.content[0].notes).to.equal('Test');
            });

        });

        it('should return an empty list when collection has no cards', () => {
            return cy.request({
                method: 'GET',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders()
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.content).to.be.empty;
            });

        });

        it('should not list cards when not authenticated', () => {
            return cy.request({
                method: 'GET',
                url: `/collections/${collectionId}/cards`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(401);
            });

        });

        it('should update a card successfully', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Original notes'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((response) => {
                const card = response.body.content.find(
                    (item) => item.front === 'What is Java?'
                );

                expect(card).to.exist;

                const cardId = card.id;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${cardId}`,
                    headers: authHeaders(),
                    body: {
                        front: 'What is Spring Boot?',
                        back: 'A Java framework.',
                        notes: 'Updated notes'
                    }
                }).then((updateResponse) => {
                    expect(updateResponse.status).to.equal(204);

                    return cardId;
                });
            }).then((cardId) => {
                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                }).then((response) => {
                    expect(response.status).to.equal(200);

                    const updatedCard = response.body.content.find(
                        (card) => card.id === cardId
                    );

                    expect(updatedCard).to.exist;
                    expect(updatedCard.front).to.equal('What is Spring Boot?');
                    expect(updatedCard.back).to.equal('A Java framework.');
                    expect(updatedCard.notes).to.equal('Updated notes');
                });
            });

        });

        it('should not update a card when front is empty', () => {
            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((response) => {
                const card = response.body.content.find(
                    (item) => item.front === 'What is Java?'
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders(),
                    body: {
                        front: '',
                        back: 'A programming language.'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not update a card when back is empty', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders(),
                    body: {
                        front,
                        back: ''
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not update a card when front exceeds 200 characters', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders(),
                    body: {
                        front: 'A'.repeat(201),
                        back: 'A programming language.'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not update a card when back exceeds 400 characters', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders(),
                    body: {
                        front,
                        back: 'A'.repeat(401)
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not update a card when notes exceeds 300 characters', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.',
                    notes: 'Original notes'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders(),
                    body: {
                        front,
                        back: 'A programming language.',
                        notes: 'A'.repeat(301)
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(400);
            });

        });

        it('should not update another user card', () => {
            const secondUser = {
                name: 'Second Card User',
                email: `e2e-card-update-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            const secondCollectionName = `Second User Collection ${Date.now()}`;
            const secondCardFront = 'Original front';

            let secondToken;
            let secondCollectionId;
            let secondCardId;

            return cy.request({
                method: 'POST',
                url: '/users',
                body: secondUser
            }).then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                });
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                secondToken = loginResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/collections',
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    body: {
                        name: secondCollectionName
                    }
                });
            }).then((collectionResponse) => {
                expect(collectionResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections',
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    }
                });
            }).then((collectionsResponse) => {
                const collection = collectionsResponse.body.find(
                    (item) => item.name === secondCollectionName
                );

                expect(collection).to.exist;

                secondCollectionId = collection.id;

                return cy.request({
                    method: 'POST',
                    url: `/collections/${secondCollectionId}/cards`,
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    body: {
                        front: secondCardFront,
                        back: 'Original back'
                    }
                });
            }).then((cardResponse) => {
                expect(cardResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${secondCollectionId}/cards`,
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    }
                });
            }).then((cardsResponse) => {
                const card = cardsResponse.body.content.find(
                    (item) => item.front === secondCardFront
                );

                expect(card).to.exist;

                secondCardId = card.id;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${secondCollectionId}/cards/${secondCardId}`,
                    headers: authHeaders(),
                    body: {
                        front: 'Changed front',
                        back: 'Changed back'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(404);
            });

        });

        it('should not update a card when not authenticated', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'PUT',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    body: {
                        front: 'Changed front',
                        back: 'Changed back'
                    },
                    failOnStatusCode: false
                });
            }).then((response) => {
                expect(response.status).to.equal(401);
            });

        });

        it('should delete a card successfully', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders()
                });
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.equal(204);
            });

        });

        it('should not list a card after deletion', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    headers: authHeaders()
                });
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.equal(204);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                expect(listResponse.status).to.equal(200);

                const cardStillExists = listResponse.body.content.some(
                    (card) => card.front === front
                );

                expect(cardStillExists).to.equal(false);
            });

        });

        it('should not delete a card when not authenticated', () => {
            const front = 'What is Java?';

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((listResponse) => {
                const card = listResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collectionId}/cards/${card.id}`,
                    failOnStatusCode: false
                });
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.equal(401);
            });

        });

        it('should not delete a card belonging to another user', () => {
            const front = 'What is Java?';

            const secondUser = {
                name: 'Second User',
                email: `second-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            let originalCardId;
            let secondToken;

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: authHeaders(),
                body: {
                    front,
                    back: 'A programming language.'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((cardsResponse) => {
                expect(cardsResponse.status).to.equal(200);

                const card = cardsResponse.body.content.find(
                    (item) => item.front === front
                );

                expect(card).to.exist;
                originalCardId = card.id;

                return cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                });
            }).then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    body: {
                        email: secondUser.email,
                        password: secondUser.password
                    }
                });
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body.token).to.be.a('string').and.not.be.empty;

                secondToken = loginResponse.body.token;

                return cy.request({
                    method: 'DELETE',
                    url: `/collections/${collectionId}/cards/${originalCardId}`,
                    headers: {
                        Authorization: `Bearer ${secondToken}`
                    },
                    failOnStatusCode: false
                });
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.equal(404);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    headers: authHeaders()
                });
            }).then((verifyResponse) => {
                expect(verifyResponse.status).to.equal(200);

                const cardStillExists = verifyResponse.body.content.some(
                    (card) => card.id === originalCardId
                );

                expect(cardStillExists).to.equal(true);
            });

        });


    });
});

