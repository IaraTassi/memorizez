describe('Review', () => {

    let user;
    let collectionId;
    let cardId;

    beforeEach(() => {

        user = {
            name: 'Review E2E User',
            email: `e2e-review-${Date.now()}-${Math.random()}@memorizez.com`,
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

                        expect(response.status).to.equal(200);

                        collectionId = response.body[0].id;

                        cy.request({
                            method: 'POST',
                            url: `/collections/${collectionId}/cards`,
                            body: {
                                front: 'What is Java?',
                                back: 'A programming language.',
                                notes: 'Review E2E test'
                            }
                        }).then((response) => {

                            expect(response.status).to.equal(201);

                            cy.request({
                                method: 'GET',
                                url: `/collections/${collectionId}/cards`
                            }).then((response) => {

                                expect(response.status).to.equal(200);

                                cardId = response.body.content[0].id;

                            });

                        });

                    });

                });

            });

        });

    });

    it('should find collections available for review', () => {

        cy.request({
            method: 'GET',
            url: '/reviews/collections'
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.have.length(1);

            expect(response.body[0].id).to.equal(collectionId);
            expect(response.body[0].name).to.equal('Java');
            expect(response.body[0].availableCardCount).to.equal(1);
        });
    });

    it('should list available cards for review', () => {
        cy.request({
            method: 'GET',
            url: '/reviews'
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
            expect(response.body).to.have.length(1);
            expect(response.body[0].cardId).to.equal(cardId);
            expect(response.body[0].front).to.equal('What is Java?');
        });
    });

    it('should reveal a card successfully', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.cardId).to.equal(cardId);
                expect(response.body.front).to.equal('What is Java?');
                expect(response.body.back).to.equal('A programming language.');
                expect(response.body.notes).to.equal('Review E2E test');
                expect(response.body.stage).to.be.null;
                expect(response.body.nextReviewDate).to.be.null;
                expect(response.body.progress).to.be.null;
            });
        });
    });

    it('should not reveal a card without an active review session', () => {
        cy.request({
            method: 'GET',
            url: `/reviews/collections/${collectionId}/cards/${cardId}/review`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(400);
        })
    });

    it('should not reveal a card that is not the current card in the review session', () => {
        cy.request({
            method: 'POST',
            url: `/collections/${collectionId}/cards`,
            body: {
                front: 'What is Spring?',
                back: 'A Java framework.',
                notes: 'Second card for review E2E test'
            }
        }).then((createResponse) => {
            expect(createResponse.status).to.equal(201);

            cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`
            }).then((startResponse) => {
                expect(startResponse.status).to.equal(200);

                const currentCardId = startResponse.body.cardId;

                expect(currentCardId).to.exist;

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards?page=0&size=20`
                }).then((cardsResponse) => {
                    expect(cardsResponse.status).to.equal(200);

                    const nonCurrentCard = cardsResponse.body.content.find(
                        (card) => card.id !== currentCardId
                    );

                    expect(nonCurrentCard).to.exist;

                    cy.request({
                        method: 'GET',
                        url: `/reviews/collections/${collectionId}/cards/${nonCurrentCard.id}/review`,
                        failOnStatusCode: false
                    }).then((reviewResponse) => {
                        expect(reviewResponse.status).to.equal(400);
                    });
                });
            });
        });
    });

    it('should complete the review when the user remembers the card', () => {
        cy.request({
            method: 'POST', url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            }).then((response) => {
                expect(response.status).to.equal(200);

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    body: {
                        result: 'REMEMBERED'
                    }
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    expect(response.body.completed).to.be.true;
                    expect(response.body.nextCard).to.be.null;
                    expect(response.body.progress.completedCards).to.equal(1);
                    expect(response.body.progress.totalCards).to.equal(1);
                    expect(response.body.progress.percentage).to.equal(100);
                });
            });
        });
    });

    it('should reset the review stage when the user does not remember the card', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            }).then((response) => {
                expect(response.status).to.equal(200);

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    body: {
                        result: 'NOT_REMEMBERED'
                    }
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    expect(response.body.completed).to.be.true;
                    expect(response.body.nextCard).to.be.null;

                    expect(response.body.progress.completedCards).to.equal(1);
                    expect(response.body.progress.totalCards).to.equal(1);
                    expect(response.body.progress.percentage).to.equal(100);
                });
            });
        });
    });

    it('should not reveal a card from a different collection than the active review session', () => {

        cy.request({
            method: 'POST',
            url: '/collections',
            body: {
                name: 'Other Collection'
            }
        }).then((createResponse) => {

            expect(createResponse.status).to.equal(201);

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((response) => {

                expect(response.status).to.equal(200);

                const otherCollection = response.body.find(
                    (collection) => collection.name === 'Other Collection'
                );

                expect(otherCollection).to.exist;

                // Cria um card na outra coleção
                cy.request({
                    method: 'POST',
                    url: `/collections/${otherCollection.id}/cards`,
                    body: {
                        front: 'What is Python?',
                        back: 'A programming language.',
                        notes: 'Card from another collection'
                    }
                }).then((cardResponse) => {

                    expect(cardResponse.status).to.equal(201);

                    cy.request({
                        method: 'GET',
                        url: `/collections/${otherCollection.id}/cards`
                    }).then((cardsResponse) => {

                        expect(cardsResponse.status).to.equal(200);

                        const otherCard = cardsResponse.body.content.find(
                            (card) => card.front === 'What is Python?'
                        );

                        expect(otherCard).to.exist;

                        cy.request({
                            method: 'POST',
                            url: `/reviews/collections/${collectionId}/start`
                        }).then((startResponse) => {

                            expect(startResponse.status).to.equal(200);

                            cy.request({
                                method: 'GET',
                                url: `/reviews/collections/${otherCollection.id}/cards/${otherCard.id}/review`,
                                failOnStatusCode: false
                            }).then((reviewResponse) => {

                                expect(
                                    reviewResponse.status,
                                    `Resposta da API: ${JSON.stringify(reviewResponse.body)}`
                                ).to.equal(400);

                            });

                        });

                    });

                });

            });

        });

    });

    it('should not submit a result before revealing the card', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);

            cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                body: {
                    result: "REMEMBERED"
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400);
            })
        })
    });

    it('should not submit a result when the result field is missing', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);

            cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            }).then((response) => {
                expect(response.status).to.equal(200);

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    body: {},
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.equal(400);
                });
            });
        });
    });

    it('should not submit a result for a card that is not in the active review session', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            const currentCardId = startResponse.body.cardId;

            cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                body: {
                    front: 'What is Spring?',
                    back: 'A Java framework.',
                    notes: 'Card created after review session started'
                }
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                }).then((cardsResponse) => {
                    expect(cardsResponse.status).to.equal(200);

                    const newCard = cardsResponse.body.content.find(
                        (card) => card.front === 'What is Spring?'
                    );

                    expect(newCard).to.exist;
                    expect(newCard.id).not.to.equal(currentCardId);

                    cy.request({
                        method: 'POST',
                        url: `/reviews/collections/${collectionId}/cards/${newCard.id}/result`,
                        body: {
                            result: 'REMEMBERED'
                        },
                        failOnStatusCode: false
                    }).then((resultResponse) => {
                        expect(resultResponse.status).to.equal(400);
                    });
                });
            });
        });

    });

    it('should not submit a result after the review session has been completed', () => {
        cy.request(
            'POST',
            `/reviews/collections/${collectionId}/start`
        ).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            const currentCardId = startResponse.body.cardId;

            cy.request(
                'GET',
                `/reviews/collections/${collectionId}/cards/${currentCardId}/review`
            ).then((revealResponse) => {
                expect(revealResponse.status).to.equal(200);

                cy.request(
                    'POST',
                    `/reviews/collections/${collectionId}/cards/${currentCardId}/result`,
                    { result: 'REMEMBERED' }
                ).then((resultResponse) => {
                    expect(resultResponse.status).to.equal(200);
                    expect(resultResponse.body.completed).to.equal(true);

                    cy.request({
                        method: 'POST',
                        url: `/reviews/collections/${collectionId}/cards/${currentCardId}/result`,
                        body: { result: 'REMEMBERED' },
                        failOnStatusCode: false
                    }).then((secondResultResponse) => {
                        expect(secondResultResponse.status).to.equal(400);
                    });
                });
            });
        });
    });

    it('should not submit a result for another user collection', () => {
        const anotherUser = {
            name: 'Another User',
            email: `another-${Date.now()}@example.com`,
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };

        cy.request('POST', '/users', anotherUser).then((createUserResponse) => {
            expect(createUserResponse.status).to.equal(201);

            cy.request('POST', '/users/login', {
                email: anotherUser.email,
                password: anotherUser.password
            }).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    body: { result: 'REMEMBERED' },
                    failOnStatusCode: false
                }).then((resultResponse) => {
                    expect(resultResponse.status).to.equal(404);
                });
            });
        });
    });

    it('should start a review and return the first available card', () => {
        cy.request({
            method: 'POST',
            url: `/reviews/collections/${collectionId}/start`
        }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.cardId).to.equal(cardId);
            expect(response.body.front).to.equal('What is Java?');
            expect(response.body.back).to.be.null;
            expect(response.body.notes).to.be.null;
            expect(response.body.progress.completedCards).to.equal(0);
            expect(response.body.progress.totalCards).to.equal(1);
            expect(response.body.progress.percentage).to.equal(0);
        });
    });

    it('should not start a review when the collection has no cards', () => {
        cy.request({
            method: 'POST',
            url: '/collections',
            body: {
                name: 'Empty Collection'
            }
        }).then((response) => {
            expect(response.status).to.equal(201);

            cy.request({
                method: 'GET',
                url: '/collections'
            }).then((response) => {
                expect(response.status).to.equal(200);

                const emptyCollection = response.body.find(
                    (collection) => collection.name === 'Empty Collection'
                );
                expect(emptyCollection).to.exist;

                const emptyCollectionId = emptyCollection.id;

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${emptyCollectionId}/start`,
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.equal(400);
                });
            });
        });

    });

    it('should not start a review for another user collection', () => {
        const anotherUser = {
            name: 'Another Review E2E User',
            email: `e2e-review-other-${Date.now()}-${Math.random()}@memorizez.com`,
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
            }).then((response) => {
                expect(response.status).to.equal(200);

                cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/start`,
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.equal(404);
                });
            });
        });
    });

});