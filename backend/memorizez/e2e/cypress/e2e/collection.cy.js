describe('Collection and card', () => {

    describe('Collection', () => {

        let user;

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

        it('should create a collection successfully', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

            });

        });

        it('should not create a collection with an empty name', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: ''
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

        it('should not create a collection with a name longer than 100 characters', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'A'.repeat(101),
                },
                failOnStatusCode: false
            }).then((response) => {

                expect(response.status).to.equal(400);

            });

        });

        it('should allow collections with the same name', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/collections',
                    body: {
                        name: 'Java'
                    }
                }).then((response) => {

                    expect(response.status).to.equal(201);

                });

            });

        });

        it('should list the collections of the authenticated user', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);
                    expect(response.body).to.have.length(1);
                    expect(response.body[0].name).to.equal('Java');

                });

            });

        });

        it('should return an empty list when user has no collections', () => {

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((response) => {

                expect(response.status).to.equal(200);
                expect(response.body).to.have.length(0);

            });

        });

        it('should only list collections belonging to the authenticated user', () => {

            const secondUser = {
                name: 'Second User',
                email: `e2e-collection-owner-two-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'First User Collection'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'POST',
                            url: '/users/login',
                            body: {
                                email: secondUser.email,
                                password: secondUser.password
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(200);

                            cy.request({
                                method: 'POST',
                                url: '/collections',
                                body: {
                                    name: 'Second User Collection'
                                }
                            }).then((response) => {

                                expect(response.status).to.equal(201);

                                cy.request({
                                    method: 'GET',
                                    url: '/collections'
                                }).then((response) => {

                                    expect(response.status).to.equal(200);
                                    expect(response.body).to.have.length(1);
                                    expect(response.body[0].name).to.equal('Second User Collection');

                                    expect(response.body.some(
                                        (collection) => collection.name === 'First User Collection'
                                    )).to.equal(false);

                                });

                            });

                        });

                    });

                });

            });

        });

        it('should not list collections when not authenticated', () => {

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

        it('should update a collection successfully', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}`,
                        body: {
                            name: 'Java Spring'
                        }
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'GET',
                            url: '/collections'
                        }).then((response) => {

                            expect(response.status).to.equal(200);
                            expect(response.body[0].name).to.equal('Java Spring');

                        });

                    });

                });

            });

        });

        it('should not update a collection with an empty name', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}`,
                        body: {
                            name: ''
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(400);

                    });

                });

            });

        });

        it('should allow updating a collection to an existing name', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'POST',
                    url: '/collections',
                    body: {
                        name: 'Python'
                    }
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'GET',
                        url: '/collections'
                    }).then((response) => {

                        const collections = response.body;

                        const pythonCollection = collections.find(
                            collection => collection.name === 'Python'
                        );

                        cy.request({
                            method: 'PUT',
                            url: `/collections/${pythonCollection.id}`,
                            body: {
                                name: 'Java'
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(204);

                            cy.request({
                                method: 'GET',
                                url: '/collections'
                            }).then((response) => {

                                expect(response.status).to.equal(200);
                                expect(response.body).to.have.length(2);

                                const javaCollections = response.body.filter(
                                    collection => collection.name === 'Java'
                                );

                                expect(javaCollections).to.have.length(2);

                            });

                        });

                    });

                });

            });

        });

        it('should not update a collection belonging to another user', () => {

            const secondUser = {
                name: 'Second Update User',
                email: `e2e-collection-owner-two-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Private Collection'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/users',
                        body: secondUser
                    }).then((response) => {

                        expect(response.status).to.equal(201);

                        cy.request({
                            method: 'POST',
                            url: '/logout'
                        }).then((response) => {

                            expect(response.status).to.equal(204);

                            cy.request({
                                method: 'POST',
                                url: '/users/login',
                                body: {
                                    email: secondUser.email,
                                    password: secondUser.password
                                }
                            }).then((response) => {

                                expect(response.status).to.equal(200);

                                cy.request({
                                    method: 'PUT',
                                    url: `/collections/${collectionId}`,
                                    body: {
                                        name: 'Changed by Another User'
                                    },
                                    failOnStatusCode: false
                                }).then((response) => {

                                    expect(response.status).to.equal(404);

                                });

                            });

                        });

                    });

                });

            });

        });

        it('should not update a collection when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'PUT',
                            url: `/collections/${collectionId}`,
                            body: {
                                name: 'Changed'
                            },
                            failOnStatusCode: false
                        }).then((response) => {

                            expect(response.status).to.equal(401);

                        });

                    });

                });

            });

        });

        it('should delete a collection successfully', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'DELETE',
                        url: `/collections/${collectionId}`
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                    });

                });

            });

        });

        it('should not list the collection after deleting it', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'DELETE',
                        url: `/collections/${collectionId}`
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'GET',
                            url: '/collections'
                        }).then((response) => {

                            expect(response.status).to.equal(200);
                            expect(response.body).to.have.length(0);

                        });

                    });

                });

            });

        });

        it('should not delete a collection when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Java'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'DELETE',
                            url: `/collections/${collectionId}`,
                            failOnStatusCode: false
                        }).then((response) => {

                            expect(response.status).to.equal(401);

                        });

                    });

                });

            });

        });

        it('should not delete a collection belonging to another user', () => {

            const secondUser = {
                name: 'Second Delete User',
                email: `e2e-collection-delete-other-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/collections',
                body: {
                    name: 'Private Collection'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: '/collections'
                }).then((response) => {

                    expect(response.status).to.equal(200);

                    const collectionId = response.body[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/users',
                        body: secondUser
                    }).then((response) => {

                        expect(response.status).to.equal(201);

                        cy.request({
                            method: 'POST',
                            url: '/logout'
                        }).then((response) => {

                            expect(response.status).to.equal(204);

                            cy.request({
                                method: 'POST',
                                url: '/users/login',
                                body: {
                                    email: secondUser.email,
                                    password: secondUser.password
                                }
                            }).then((response) => {

                                expect(response.status).to.equal(200);

                                cy.request({
                                    method: 'DELETE',
                                    url: `/collections/${collectionId}`,
                                    failOnStatusCode: false
                                }).then((response) => {

                                    expect(response.status).to.equal(404);

                                });

                            });

                        });

                    });

                });

            });

        });

    });

    describe.only('Card', () => {

        let collectionId;
        let user;

        beforeEach(() => {

            user = {
                name: 'Card E2E User',
                email: `e2e-card-${Date.now()}-${Math.random()}@memorizez.com`,
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
                        url: '/collections',
                        body: {
                            name: 'Java'
                        }
                    }).then((response) => {

                        expect(response.status).to.equal(201);

                        cy.request({
                            method: 'GET',
                            url: '/collections'
                        }).then((response) => {

                            collectionId = response.body[0].id;

                        });

                    });

                });

            });

        });

        it('should create a card successfully', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
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

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

            });

        });

        it('should not create a card in another user collection', () => {

            let secondUser;
            let secondCollectionId;

            secondUser = {
                name: 'Second Card User',
                email: `e2e-card-second-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/logout'
            }).then((response) => {

                expect(response.status).to.equal(204);

                cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        body: {
                            email: secondUser.email,
                            password: secondUser.password
                        }
                    }).then((response) => {

                        expect(response.status).to.equal(200);

                        cy.request({
                            method: 'POST',
                            url: '/collections',
                            body: {
                                name: 'Second User Collection'
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(201);

                            cy.request({
                                method: 'GET',
                                url: '/collections'
                            }).then((response) => {

                                secondCollectionId = response.body[0].id;

                                cy.request({
                                    method: 'POST',
                                    url: '/logout'
                                }).then((response) => {

                                    expect(response.status).to.equal(204);

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
                                            url: `/collections/${secondCollectionId}/cards`,
                                            body: {
                                                front: 'What is Java?',
                                                back: 'A programming language.'
                                            },
                                            failOnStatusCode: false
                                        }).then((response) => {

                                            expect(response.status).to.equal(404);

                                        });

                                    });

                                });

                            });

                        });

                    });

                });

            });

        });

        it('should not create a card when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: '/logout'
            }).then((response) => {

                expect(response.status).to.equal(204);

                cy.request({
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

        });

        it('should list cards successfully', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Test'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    expect(response.status).to.equal(200);
                    expect(response.body.content).to.have.length(1);
                    expect(response.body.content[0].front).to.equal('What is Java?');
                    expect(response.body.content[0].back).to.equal('A programming language.');
                    expect(response.body.content[0].notes).to.equal('Test');

                });

            });

        });

        it('should return an empty list when collection has no cards', () => {

            cy.request({
                method: 'GET',
                url: `/collections/${collectionId}/cards`
            }).then((response) => {

                expect(response.status).to.equal(200);
                expect(response.body.content).to.be.empty;

            });

        });

        it('should not list cards when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: '/logout'
            }).then((response) => {

                expect(response.status).to.equal(204);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`,
                    failOnStatusCode: false
                }).then((response) => {

                    expect(response.status).to.equal(401);

                });

            });

        });

        it('should update a card successfully', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Original notes'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
                        body: {
                            front: 'What is Spring Boot?',
                            back: 'A Java framework.',
                            notes: 'Updated notes'
                        }
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'GET',
                            url: `/collections/${collectionId}/cards`
                        }).then((response) => {

                            expect(response.status).to.equal(200);

                            const updatedCard = response.body.content.find(
                                card => card.id === cardId
                            );

                            expect(updatedCard).to.exist;
                            expect(updatedCard.front).to.equal('What is Spring Boot?');
                            expect(updatedCard.back).to.equal('A Java framework.');
                            expect(updatedCard.notes).to.equal('Updated notes');

                        });

                    });

                });

            });

        });

        it('should not update a card when front is empty', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
                        body: {
                            front: '',
                            back: 'A programming language.'
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(400);

                    });

                });

            });

        });

        it('should not update a card when back is empty', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
                        body: {
                            front: 'What is Java?',
                            back: ''
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(400);

                    });

                });

            });

        });

        it('should not update a card when front exceeds 200 characters', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
                        body: {
                            front: 'A'.repeat(201),
                            back: 'A programming language.'
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(400);

                    });

                });

            });

        });

        it('should not update a card when back exceeds 400 characters', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
                        body: {
                            front: 'What is Java?',
                            back: 'A'.repeat(401)
                        },
                        failOnStatusCode: false
                    }).then((response) => {

                        expect(response.status).to.equal(400);

                    });

                });

            });

        });

        it('should not update a card when notes exceeds 300 characters', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'Original notes'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'PUT',
                        url: `/collections/${collectionId}/cards/${cardId}`,
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

            });

        });

        it('should not update another user card', () => {

            let secondUser;
            let secondCollectionId;
            let secondCardId;

            secondUser = {
                name: 'Second Card User',
                email: `e2e-card-update-${Date.now()}-${Math.random()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: '/logout'
            }).then((response) => {

                expect(response.status).to.equal(204);

                cy.request({
                    method: 'POST',
                    url: '/users',
                    body: secondUser
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'POST',
                        url: '/users/login',
                        body: {
                            email: secondUser.email,
                            password: secondUser.password
                        }
                    }).then((response) => {

                        expect(response.status).to.equal(200);

                        cy.request({
                            method: 'POST',
                            url: '/collections',
                            body: {
                                name: 'Second User Collection'
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(201);

                            cy.request({
                                method: 'GET',
                                url: '/collections'
                            }).then((response) => {

                                secondCollectionId = response.body[0].id;

                                cy.request({
                                    method: 'POST',
                                    url: `/collections/${secondCollectionId}/cards`,
                                    body: {
                                        front: 'Original front',
                                        back: 'Original back'
                                    }
                                }).then((response) => {

                                    expect(response.status).to.equal(201);

                                    cy.request({
                                        method: 'GET',
                                        url: `/collections/${secondCollectionId}/cards`
                                    }).then((response) => {

                                        secondCardId = response.body.content[0].id;

                                        cy.request({
                                            method: 'POST',
                                            url: '/logout'
                                        }).then((response) => {

                                            expect(response.status).to.equal(204);

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
                                                    method: 'PUT',
                                                    url: `/collections/${secondCollectionId}/cards/${secondCardId}`,
                                                    body: {
                                                        front: 'Changed front',
                                                        back: 'Changed back'
                                                    },
                                                    failOnStatusCode: false
                                                }).then((response) => {

                                                    expect(response.status).to.equal(404);

                                                });

                                            });

                                        });

                                    });

                                });

                            });

                        });

                    });

                });

            });

        });

        it('should not update a card when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'PUT',
                            url: `/collections/${collectionId}/cards/${cardId}`,
                            body: {
                                front: 'Changed front',
                                back: 'Changed back'
                            },
                            failOnStatusCode: false
                        }).then((response) => {

                            expect(response.status).to.equal(401);

                        });

                    });

                });

            });

        });

        it('should delete a card successfully', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'DELETE',
                        url: `/collections/${collectionId}/cards/${cardId}`
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                    });

                });

            });

        });

        it('should not list a card after deletion', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'DELETE',
                        url: `/collections/${collectionId}/cards/${cardId}`
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'GET',
                            url: `/collections/${collectionId}/cards`
                        }).then((response) => {

                            expect(response.status).to.equal(200);
                            expect(response.body.content).to.be.empty;

                        });

                    });

                });

            });

        });

        it('should not delete a card when not authenticated', () => {

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            }).then((response) => {

                expect(response.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((response) => {

                    const cardId = response.body.content[0].id;

                    cy.request({
                        method: 'POST',
                        url: '/logout'
                    }).then((response) => {

                        expect(response.status).to.equal(204);

                        cy.request({
                            method: 'DELETE',
                            url: `/collections/${collectionId}/cards/${cardId}`,
                            failOnStatusCode: false
                        }).then((response) => {

                            expect(response.status).to.equal(401);

                        });

                    });

                });

            });

        });

        it('should not delete a card belonging to another user', () => {
            let originalCardId;

            const secondUser = {
                name: 'Second User',
                email: `second-${Date.now()}@memorizez.com`,
                password: 'password123',
                confirmPassword: 'password123'
            };

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.'
                }
            })
                .then((createCardResponse) => {
                    expect(createCardResponse.status).to.equal(201);

                    return cy.request(
                        'GET',
                        `/collections/${collectionId}/cards`
                    );
                })
                .then((cardsResponse) => {
                    expect(cardsResponse.status).to.equal(200);
                    expect(cardsResponse.body.content).not.to.be.empty;

                    originalCardId = cardsResponse.body.content[0].id;

                    return cy.request({
                        method: 'POST',
                        url: '/users',
                        body: secondUser,
                        failOnStatusCode: false
                    });
                })
                .then((registerResponse) => {
                    expect(registerResponse.status).to.equal(201);

                    return cy.request('POST', '/users/login', {
                        email: secondUser.email,
                        password: secondUser.password
                    });
                })
                .then((loginResponse) => {
                    expect(loginResponse.status).to.equal(200);

                    return cy.request({
                        method: 'DELETE',
                        url: `/collections/${collectionId}/cards/${originalCardId}`,
                        failOnStatusCode: false
                    });
                })
                .then((deleteResponse) => {
                    expect(deleteResponse.status).to.equal(404);

                    return cy.request('POST', '/users/login', {
                        email: user.email,
                        password: user.password
                    });
                })
                .then((loginResponse) => {
                    expect(loginResponse.status).to.equal(200);

                    return cy.request(
                        'GET',
                        `/collections/${collectionId}/cards`
                    );
                })
                .then((verifyResponse) => {
                    expect(verifyResponse.status).to.equal(200);

                    const cardStillExists = verifyResponse.body.content
                        .some((card) => card.id === originalCardId);

                    expect(cardStillExists).to.equal(true);
                });
        });

    });
});

