describe('History', () => {

    let collectionId;
    let cardId;

    const requestWithCsrf = (options) => {
        return cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                ...options,
                headers: {
                    ...options.headers,
                    'X-CSRF-TOKEN': csrfToken
                }
            });
        });
    };

    const createAndLoginUser = () => {
        const email =
            `e2e-history-${Date.now()}-${Math.random()}@memorizez.com`;

        return requestWithCsrf({
            method: 'POST',
            url: '/users',
            body: {
                name: 'History E2E User',
                email,
                password: 'password123',
                confirmPassword: 'password123'
            }
        }).then((userResponse) => {
            expect(userResponse.status).to.equal(201);

            return requestWithCsrf({
                method: 'POST',
                url: '/users/login',
                body: {
                    email,
                    password: 'password123'
                }
            });
        }).then((loginResponse) => {
            expect(loginResponse.status).to.equal(200);

            return cy.request('GET', '/collections');
        }).then((collectionsResponse) => {
            expect(collectionsResponse.status).to.equal(200);
        });
    };

    const startAndAnswerReview = (result) => {
        return requestWithCsrf({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            });
        }).then((revealResponse) => {
            expect(revealResponse.status).to.equal(200);

            return requestWithCsrf({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                body: {result}
            });
        });
    };

    beforeEach(() => {
        collectionId = undefined;
        cardId = undefined;

        createAndLoginUser()
            .then(() => {
                return requestWithCsrf({
                    method: 'POST',
                    url: '/collections',
                    body: {name: 'Java'}
                });
            })
            .then((collectionResponse) => {
                expect(collectionResponse.status).to.equal(201);

                return cy.request('GET', '/collections');
            })
            .then((collectionsResponse) => {
                expect(collectionsResponse.status).to.equal(200);
                expect(collectionsResponse.body).to.be.an('array');

                const collection = collectionsResponse.body.find(
                    (item) => item.name === 'Java'
                );

                expect(
                    collection,
                    'A coleção Java deve existir para o usuário autenticado'
                ).to.exist;

                expect(collection.id).to.exist;
                collectionId = collection.id;

                return requestWithCsrf({
                    method: 'POST',
                    url: `/collections/${collectionId}/cards`,
                    body: {
                        front: 'What is Java?',
                        back: 'A programming language.',
                        notes: 'History E2E test'
                    }
                });
            })
            .then((cardResponse) => {
                expect(cardResponse.status).to.equal(201);

                return cy.request(
                    'GET',
                    `/collections/${collectionId}/cards?page=0&size=20`
                );
            })
            .then((cardsResponse) => {
                expect(cardsResponse.status).to.equal(200);
                expect(cardsResponse.body.content).to.be.an('array');

                const card = cardsResponse.body.content.find(
                    (item) => item.front === 'What is Java?'
                );

                expect(card, 'O card criado deve existir').to.exist;
                expect(card.id, 'O card deve possuir um ID').to.exist;

                cardId = card.id;
            });
    });

    it('should list collections that have history', () => {
        startAndAnswerReview('REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request('GET', '/history/collections');
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');

            const collection = response.body.find(
                (item) => item.id === collectionId
            );

            expect(
                collection,
                'Java collection should be returned'
            ).to.exist;

            expect(collection.name).to.equal('Java');
            expect(collection.cardCount).to.be.greaterThan(0);
        });
    });

    it('should not expose another user collections', () => {
        const originalCollectionId = collectionId;

        createAndLoginUser().then(() => {
            cy.request('GET', '/history/collections').then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body).to.be.an('array');

                const collection = response.body.find(
                    (item) => item.id === originalCollectionId
                );

                expect(
                    collection,
                    'Other user collection should not be visible'
                ).to.be.undefined;
            });
        });
    });

    it('should reject the request when the user is unauthenticated', () => {
        cy.clearCookies();

        cy.request({
            method: 'GET',
            url: '/history/collections',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(401);
        });
    });

    it('should list cards with history for a collection', () => {
        startAndAnswerReview('REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards?page=0&size=20`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.content).to.be.an('array');

            const card = response.body.content.find(
                (item) => item.id === cardId
            );

            expect(card).to.exist;
            expect(card.front).to.equal('What is Java?');
            expect(card.rememberedCount).to.equal(1);
            expect(card.notRememberedCount).to.equal(0);
            expect(card.editCount).to.equal(0);
        });
    });

    it('should support pagination', () => {
        const front = `Question ${Date.now()}`;
        const back = 'Answer for pagination test';

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => {
                return cy.request({
                    method: 'POST',
                    url: `/collections/${collectionId}/cards`,
                    headers: {
                        'X-CSRF-TOKEN': csrfResponse.body.token
                    },
                    body: {
                        front: front,
                        back: back,
                        notes: 'Pagination test'
                    }
                });
            })
            .then((cardResponse) => {
                expect(cardResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards?page=0&size=1`
                });
            })
            .then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.content).to.have.length(1);
                expect(response.body.size).to.equal(1);
                expect(response.body.number).to.equal(0);
                expect(response.body.totalElements).to.equal(2);
            });
    });

    it('should return an empty page for a collection without cards', () => {
        const emptyCollectionName = `Empty collection ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: emptyCollectionName}
            }))
            .then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request('GET', '/collections');
            })
            .then((collectionsResponse) => {
                const collection = collectionsResponse.body.find(
                    (item) => item.name === emptyCollectionName
                );

                expect(collection).to.exist;

                return cy.request({
                    method: 'GET',
                    url: `/history/collections/${collection.id}/cards?page=0&size=10`
                });
            })
            .then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.content).to.be.an('array').that.is.empty;
            });
    });

    it('should return not found for a nonexistent collection', () => {
        cy.request({
            method: 'GET',
            url: '/history/collections/999999999/cards?page=0&size=10',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should not list another user cards', () => {
        const originalCollectionId = collectionId;

        createAndLoginUser().then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${originalCollectionId}/cards?page=0&size=10`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });

    });

    it('should return the details of a card with history', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/${cardId}`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.id).to.equal(cardId);
            expect(response.body.front).to.equal('What is Java?');

            expect(response.body.rememberedCount).to.equal(0);
            expect(response.body.notRememberedCount).to.equal(0);
            expect(response.body.editCount).to.equal(0);

            expect(response.body.createdAt).to.exist;
            expect(Number.isNaN(Date.parse(response.body.createdAt))).to.equal(
                false
            );

            expect(response.body.nextReviewDate).to.be.null;
        });
    });

    it('should return not found for a nonexistent card', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/999999999`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should not expose another user card details', () => {
        const originalCollectionId = collectionId;
        const originalCardId = cardId;

        createAndLoginUser().then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${originalCollectionId}/cards/${originalCardId}`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });
    });

    it('should list the creation event of a card', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.content).to.be.an('array');

            const createdEvent = response.body.content.find(
                (item) => item.action === 'CREATED'
            );

            expect(createdEvent).to.exist;
            expect(createdEvent.action).to.equal('CREATED');
            expect(createdEvent.createdAt).to.exist;

            expect(
                Number.isNaN(Date.parse(createdEvent.createdAt))
            ).to.equal(false);
        });
    });

    it('should record a REMEMBERED event after a successful review', () => {
        startAndAnswerReview('REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            }).then((response) => {
                expect(response.status).to.equal(200);

                const rememberedEvent = response.body.content.find(
                    (item) => item.action === 'REMEMBERED'
                );

                expect(rememberedEvent).to.exist;
                expect(rememberedEvent.createdAt).to.exist;
            });
        });
    });

    it('should record a NOT_REMEMBERED event after a review', () => {
        startAndAnswerReview('NOT_REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            }).then((response) => {
                expect(response.status).to.equal(200);

                const notRememberedEvent = response.body.content.find(
                    (item) => item.action === 'NOT_REMEMBERED'
                );

                expect(notRememberedEvent).to.exist;
                expect(notRememberedEvent.createdAt).to.exist;
            });
        });
    });

    it('should return history events in descending date order', () => {
        startAndAnswerReview('REMEMBERED').then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            }).then((response) => {
                expect(response.status).to.equal(200);

                const events = response.body.content;
                expect(events.length).to.be.at.least(2);

                for (let index = 0; index < events.length - 1; index += 1) {
                    const currentDate = Date.parse(events[index].createdAt);
                    const nextDate = Date.parse(events[index + 1].createdAt);

                    expect(currentDate).to.be.at.least(nextDate);
                }
            });
        });
    });

    it('should support pagination of history events', () => {
        startAndAnswerReview('REMEMBERED').then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=1`
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.content).to.have.length(1);
                expect(response.body.size).to.equal(1);
                expect(response.body.number).to.equal(0);
                expect(response.body.totalElements).to.be.at.least(2);
            });
        });
    });

    it('should return not found for a nonexistent card history', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/999999999/history?page=0&size=20`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should return not found for a nonexistent collection history', () => {
        cy.request({
            method: 'GET',
            url: '/history/collections/999999999/cards/999999999/history?page=0&size=20',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should not expose another user card history', () => {
        const originalCollectionId = collectionId;
        const originalCardId = cardId;

        createAndLoginUser().then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${originalCollectionId}/cards/${originalCardId}/history?page=0&size=20`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });
    });

    it('should return the details of a card with history', () => {
        startAndAnswerReview('REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.id).to.equal(cardId);
            expect(response.body.front).to.equal('What is Java?');

            expect(response.body.rememberedCount).to.equal(1);
            expect(response.body.notRememberedCount).to.equal(0);
            expect(response.body.editCount).to.equal(0);

            expect(response.body.createdAt).to.exist;
            expect(Number.isNaN(Date.parse(response.body.createdAt))).to.equal(
                false
            );

            expect(response.body.nextReviewDate).to.exist;
        });
    });

    it('should return not found for a nonexistent card', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/999999999`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should return not found when the card belongs to another collection', () => {
        const otherCollectionName = `Another collection ${Date.now()}`;

        return cy.request('GET', '/csrf')
            .then((csrfResponse) => cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfResponse.body.token},
                body: {name: otherCollectionName}
            }))
            .then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request('GET', '/collections');
            })
            .then((collectionsResponse) => {
                expect(collectionsResponse.status).to.equal(200);
                expect(collectionsResponse.body).to.be.an('array');

                const collection = collectionsResponse.body.find(
                    (item) => item.name === otherCollectionName
                );

                expect(collection, 'A segunda coleção deve existir').to.exist;
                expect(collection.id).to.exist;
                expect(collection.id).to.not.equal(collectionId);

                return cy.request({
                    method: 'GET',
                    url: `/history/collections/${collection.id}/cards/${cardId}`,
                    failOnStatusCode: false
                });
            })
            .then((response) => {
                expect(response.status).to.equal(404);
            });
    });

    it('should not expose another user card details', () => {
        const originalCollectionId = collectionId;
        const originalCardId = cardId;

        createAndLoginUser().then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${originalCollectionId}/cards/${originalCardId}`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });
    });

    it('should list the creation event of a card', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.content).to.be.an('array');

            const createdEvent = response.body.content.find(
                (item) => item.action === 'CREATED'
            );

            expect(createdEvent).to.exist;
            expect(createdEvent.action).to.equal('CREATED');
            expect(createdEvent.createdAt).to.exist;

            expect(
                Number.isNaN(Date.parse(createdEvent.createdAt))
            ).to.equal(false);
        });
    });

    it('should record a REMEMBERED event after a successful review', () => {
        startAndAnswerReview('REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const rememberedEvent = response.body.content.find(
                (item) => item.action === 'REMEMBERED'
            );

            expect(rememberedEvent).to.exist;
            expect(rememberedEvent.createdAt).to.exist;
        });
    });

    it('should record a NOT_REMEMBERED event after a review', () => {
        startAndAnswerReview('NOT_REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const notRememberedEvent = response.body.content.find(
                (item) => item.action === 'NOT_REMEMBERED'
            );

            expect(notRememberedEvent).to.exist;
            expect(notRememberedEvent.createdAt).to.exist;
        });
    });

    it('should return history events in descending date order', () => {
        startAndAnswerReview('NOT_REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=20`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const events = response.body.content;
            expect(events.length).to.be.at.least(1);

            for (let index = 0; index < events.length - 1; index += 1) {
                const currentDate = Date.parse(events[index].createdAt);
                const nextDate = Date.parse(events[index + 1].createdAt);

                expect(currentDate).to.be.at.least(nextDate);
            }
        });
    });

    it('should support pagination of history events', () => {
        startAndAnswerReview('NOT_REMEMBERED').then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/history/collections/${collectionId}/cards/${cardId}/history?page=0&size=1`
            });
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.content).to.have.length(1);
            expect(response.body.size).to.equal(1);
            expect(response.body.number).to.equal(0);
            expect(response.body.totalElements).to.be.at.least(1);
        });
    });

    it('should return not found for a nonexistent card history', () => {
        cy.request({
            method: 'GET',
            url: `/history/collections/${collectionId}/cards/999999999/history?page=0&size=20`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should return not found for a nonexistent collection history', () => {
        cy.request({
            method: 'GET',
            url: '/history/collections/999999999/cards/999999999/history?page=0&size=20',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should not expose another user card history', () => {
        const originalCollectionId = collectionId;
        const originalCardId = cardId;

        createAndLoginUser().then(() => {
            cy.request({
                method: 'GET',
                url: `/history/collections/${originalCollectionId}/cards/${originalCardId}/history?page=0&size=20`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404);
            });
        });
    });

});