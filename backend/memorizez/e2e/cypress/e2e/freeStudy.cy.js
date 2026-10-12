describe('FreeStudy', () => {

    let user;
    let collectionId;
    let cardId;

    beforeEach(() => {

        user = {
            name: 'FreeStudy E2E User',
            email: `e2e-free-study-${Date.now()}-${Math.random()}@memorizez.com`,
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
                        name: 'Java FreeStudy'
                    }
                }).then((response) => {

                    expect(response.status).to.equal(201);

                    cy.request({
                        method: 'GET',
                        url: '/collections'
                    }).then((collectionsResponse) => {

                        expect(collectionsResponse.status).to.equal(200);

                        const collection = collectionsResponse.body.find(
                            (item) => item.name === 'Java FreeStudy'
                        );

                        expect(collection).to.exist;

                        collectionId = collection.id;

                        cy.request({
                            method: 'POST',
                            url: `/collections/${collectionId}/cards`,
                            body: {
                                front: 'What is Java?',
                                back: 'A programming language.',
                                notes: 'FreeStudy E2E test'
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(201);

                            cy.request({
                                method: 'GET',
                                url: `/collections/${collectionId}/cards`
                            }).then((cardsResponse) => {

                                expect(cardsResponse.status).to.equal(200);

                                const card = cardsResponse.body.content.find(
                                    (item) => item.front === 'What is Java?'
                                );

                                expect(card).to.exist;

                                cardId = card.id;

                                cy.request({
                                    method: 'POST',
                                    url: `/collections/${collectionId}/cards`,
                                    body: {
                                        front: 'What is Spring?',
                                        back: 'A Java framework.',
                                        notes: 'Second FreeStudy E2E test'
                                    }
                                }).then((response) => {
                                    expect(response.status).to.equal(201);
                                });

                            });

                        });


                    });

                });

            });

        });

    });

    it('should find collections available for free study', () => {

        cy.request({
            method: 'GET',
            url: '/free-study/collections'
        }).then((response) => {

            expect(response.status).to.equal(200);
            expect(response.body).to.have.length(1);

            expect(response.body[0].id).to.equal(collectionId);
            expect(response.body[0].name).to.equal('Java FreeStudy');
            expect(response.body[0].cardCount).to.equal(2);

        });

    });

    it('should find the first card for free study', () => {
        cy.request({
            method: 'GET',
            url: `/free-study/collections/${collectionId}`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.cardId).to.equal(cardId);
            expect(response.body.collectionId).to.equal(collectionId);
            expect(response.body.front).to.equal('What is Java?');
            expect(response.body.back).to.be.null;
            expect(response.body.notes).to.be.null;
        });
    });

    it('should reveal the back of a card for free study', () => {
        cy.request({
            method: 'GET',
            url: `/free-study/collections/${collectionId}/cards/${cardId}/back`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.cardId).to.equal(cardId);
            expect(response.body.collectionId).to.equal(collectionId);
            expect(response.body.front).to.equal('What is Java?');
            expect(response.body.back).to.equal('A programming language.');
            expect(response.body.notes).to.equal('FreeStudy E2E test');
        });
    });

    it('should move to the next card for free study', () => {
        cy.request({
            method: 'GET',
            url: `/free-study/collections/${collectionId}/cards/${cardId}`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.front).to.equal('What is Spring?');
            expect(response.body.back).to.be.null;
            expect(response.body.notes).to.be.null;
        });
    });

    it('should return no content when there is no next card', () => {
        cy.request({
            method: 'GET',
            url: `/free-study/collections/${collectionId}/cards/${cardId}`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.front).to.equal('What is Spring?');

            const nextCardId = response.body.cardId;

            cy.request({
                method: 'GET',
                url: `/free-study/collections/${collectionId}/cards/${nextCardId}`,
                failOnStatusCode: false
            }).then((nextResponse) => {
                expect(nextResponse.status).to.equal(204);
            });
        });

    });

    it('should return no content when the collection has no cards', () => {
        cy.request({
            method: 'POST',
            url: '/collections',
            body: { name: 'Empty FreeStudy' }
        }).then((response) => {
            expect(response.status).to.equal(201);

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((collectionsResponse) => {
                const collection = collectionsResponse.body.find(
                    (item) => item.name === 'Empty FreeStudy'
                );

                expect(collection).to.exist;

                cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${collection.id}`,
                    failOnStatusCode: false
                }).then((studyResponse) => {
                    expect(studyResponse.status).to.equal(204);
                });
            });
        });
    });

    it('should not allow access to another user collection', () => {
        const anotherUser = {
            name: 'Another FreeStudy User',
            email: `e2e-another-${Date.now()}-${Math.random()}@memorizez.com`,
            password: 'password123',
            confirmPassword: 'password123'
        };

        cy.request({
            method: 'POST',
            url: '/users',
            body: anotherUser
        }).then((response) => {
            expect(response.status).to.equal(201);

            cy.request({
                method: 'POST',
                url: '/users/login',
                body: {
                    email: anotherUser.email,
                    password: anotherUser.password
                }
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);

                cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${collectionId}`,
                    failOnStatusCode: false
                }).then((studyResponse) => {
                    expect(studyResponse.status).to.equal(404);
                });
            });
        });
    });

    it('should not reveal a card that does not belong to the collection', () => {
        cy.request({
            method: 'POST',
            url: '/collections',
            body: { name: 'Other FreeStudy Collection' }
        }).then((response) => {
            expect(response.status).to.equal(201);

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((collectionsResponse) => {
                const otherCollection = collectionsResponse.body.find(
                    (item) => item.name === 'Other FreeStudy Collection'
                );

                expect(otherCollection).to.exist;

                cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${otherCollection.id}/cards/${cardId}/back`,
                    failOnStatusCode: false
                }).then((studyResponse) => {
                    expect(studyResponse.status).to.equal(404);
                });
            });
        });
    });

    it('should not advance using a card from another collection', () => {
        cy.request({
            method: 'POST',
            url: '/collections',
            body: { name: 'Another FreeStudy Collection' }
        }).then((response) => {
            expect(response.status).to.equal(201);

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((collectionsResponse) => {
                const otherCollection = collectionsResponse.body.find(
                    (item) => item.name === 'Another FreeStudy Collection'
                );

                expect(otherCollection).to.exist;

                cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${otherCollection.id}/cards/${cardId}`,
                    failOnStatusCode: false
                }).then((studyResponse) => {
                    expect(studyResponse.status).to.equal(404);
                });
            });
        });
    });

    it('should not allow access without authentication', () => {
        cy.clearCookie('JSESSIONID');

        cy.request({
            method: 'GET',
            url: '/free-study/collections',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(401);
        });
    });

    it('should not allow access to study endpoints without authentication', () => {
        cy.clearCookie('JSESSIONID');

        const endpoints = [
            `/free-study/collections/${collectionId}`,
            `/free-study/collections/${collectionId}/cards/${cardId}/back`,
            `/free-study/collections/${collectionId}/cards/${cardId}`
        ];

        endpoints.forEach((endpoint) => {
            cy.request({
                method: 'GET',
                url: endpoint,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(401);
            });
        });
    });

});