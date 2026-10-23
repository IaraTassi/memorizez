describe('FreeStudy', () => {

    let user;
    let collectionId;
    let cardId;
    let collectionName;

    beforeEach(() => {
        user = {
            name: 'FreeStudy E2E User',
            email: `e2e-free-study-${Date.now()}-${Math.random()}@memorizez.com`,
            password: 'password123',
            confirmPassword: 'password123'
        };

        collectionName = `Java FreeStudy ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/users',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: user
            }))
            .then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);
                return cy.request('GET', '/csrf');
            })
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/users/login',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {
                    email: user.email,
                    password: user.password
                }
            }))
            .then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                return cy.request('GET', '/csrf');
            })
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: collectionName}
            }))
            .then((collectionResponse) => {
                expect(collectionResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections'
                });
            })
            .then((collectionsResponse) => {
                expect(collectionsResponse.status).to.equal(200);

                const collection = collectionsResponse.body.find(
                    (item) => item.name === collectionName
                );

                expect(collection).to.exist;
                collectionId = collection.id;

                return cy.request('GET', '/csrf');
            })
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {
                    front: 'What is Java?',
                    back: 'A programming language.',
                    notes: 'FreeStudy E2E test'
                }
            }))
            .then((firstCardResponse) => {
                expect(firstCardResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                });
            })
            .then((cardsResponse) => {
                expect(cardsResponse.status).to.equal(200);

                const firstCard = cardsResponse.body.content.find(
                    (item) => item.front === 'What is Java?'
                );

                expect(firstCard).to.exist;
                cardId = firstCard.id;

                return cy.request('GET', '/csrf');
            })
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {
                    front: 'What is Spring?',
                    back: 'A Java framework.',
                    notes: 'Second FreeStudy E2E test'
                }
            }))
            .then((secondCardResponse) => {
                expect(secondCardResponse.status).to.equal(201);
            });
    });

    it('should find collections available for free study', () => {

        return cy.request({
            method: 'GET',
            url: '/free-study/collections'
        }).then((response) => {
            expect(response.status).to.equal(200);

            const collection = response.body.find(
                (item) => item.id === collectionId
            );

            expect(collection).to.exist;
            expect(collection.name).to.equal(collectionName);
            expect(collection.cardCount).to.equal(2);
        });

    });

    it('should find the first card for free study', () => {
        return cy.request({
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
        return cy.request({
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
        return cy.request({
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
        return cy.request({
            method: 'GET',
            url: `/free-study/collections/${collectionId}/cards/${cardId}`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.front).to.equal('What is Spring?');

            const nextCardId = response.body.cardId;

            return cy.request({
                method: 'GET',
                url: `/free-study/collections/${collectionId}/cards/${nextCardId}`,
                failOnStatusCode: false
            });
        }).then((nextResponse) => {
            expect(nextResponse.status).to.equal(204);
        });

    });

    it('should return no content when the collection has no cards', () => {
        const emptyCollectionName = `Empty FreeStudy ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: emptyCollectionName}
            }))
            .then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections'
                });
            })
            .then((collectionsResponse) => {
                const collection = collectionsResponse.body.find(
                    (item) => item.name === emptyCollectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${collection.id}`,
                    failOnStatusCode: false
                });
            })
            .then((studyResponse) => {
                expect(studyResponse.status).to.equal(204);
            });
    });

    it('should not allow access to another user collection', () => {
        const anotherUser = {
            name: 'Another FreeStudy User',
            email: `e2e-another-${Date.now()}-${Math.random()}@memorizez.com`,
            password: 'password123',
            confirmPassword: 'password123'
        };

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/users',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: anotherUser
            }))
            .then((registerResponse) => {
                expect(registerResponse.status).to.equal(201);
                return cy.request('GET', '/csrf');
            })
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/users/login',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {
                    email: anotherUser.email,
                    password: anotherUser.password
                }
            }))
            .then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);

                return cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${collectionId}`,
                    failOnStatusCode: false
                });
            })
            .then((studyResponse) => {
                expect(studyResponse.status).to.equal(404);
            });
    });

    it('should not reveal a card that does not belong to the collection', () => {
        const otherCollectionName = `Other FreeStudy Collection ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: otherCollectionName}
            }))
            .then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections'
                });
            })
            .then((collectionsResponse) => {
                const otherCollection = collectionsResponse.body.find(
                    (item) => item.name === otherCollectionName
                );

                expect(otherCollection).to.exist;

                return cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${otherCollection.id}/cards/${cardId}/back`,
                    failOnStatusCode: false
                });
            })
            .then((studyResponse) => {
                expect(studyResponse.status).to.equal(404);
            });
    });

    it('should not advance using a card from another collection', () => {
        const otherCollectionName = `Another FreeStudy Collection ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: otherCollectionName}
            }))
            .then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: '/collections'
                });
            })
            .then((collectionsResponse) => {
                const otherCollection = collectionsResponse.body.find(
                    (item) => item.name === otherCollectionName
                );

                expect(otherCollection).to.exist;

                return cy.request({
                    method: 'GET',
                    url: `/free-study/collections/${otherCollection.id}/cards/${cardId}`,
                    failOnStatusCode: false
                });
            })
            .then((studyResponse) => {
                expect(studyResponse.status).to.equal(404);
            });
    });

    it('should not allow access without authentication', () => {
        cy.clearCookie('JSESSIONID');

        return cy.request({
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

        return cy.wrap(endpoints).each((endpoint) => {
            return cy.request({
                method: 'GET',
                url: endpoint,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(401);
            });
        });
    });

});