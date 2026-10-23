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

                    cy.request('GET', '/csrf').then((newCsrfResponse) => {
                        const newCsrfToken = newCsrfResponse.body.token;

                        cy.request({
                            method: 'POST',
                            url: '/collections',
                            headers: {
                                'X-CSRF-TOKEN': newCsrfToken
                            },
                            body: {
                                name: 'Java'
                            }
                        }).then((collectionResponse) => {

                            expect(collectionResponse.status).to.equal(201);

                            cy.request({
                                method: 'GET',
                                url: '/collections'
                            }).then((collectionsResponse) => {
                                expect(collectionsResponse.status).to.equal(200);

                                collectionId = collectionsResponse.body[0].id;

                                cy.request({
                                    method: 'POST',
                                    url: `/collections/${collectionId}/cards`,
                                    headers: {
                                        'X-CSRF-TOKEN': newCsrfToken
                                    },
                                    body: {
                                        front: 'What is Java?',
                                        back: 'A programming language.',
                                        notes: 'Review E2E test'
                                    }
                                }).then((cardResponse) => {

                                    expect(cardResponse.status).to.equal(201);

                                    cy.request({
                                        method: 'GET',
                                        url: `/collections/${collectionId}/cards`
                                    }).then((cardsResponse) => {

                                        expect(cardsResponse.status).to.equal(200);

                                        cardId = cardsResponse.body.content[0].id;
                                    });

                                });

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
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });
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
        });
    });

    it('should not reveal a card that is not the current card in the review session', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/collections/${collectionId}/cards`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                body: {
                    front: 'What is Spring?',
                    back: 'A Java framework.',
                    notes: 'Second card for review E2E test'
                }
            });
        }).then((createResponse) => {
            expect(createResponse.status).to.equal(201);

            return cy.request('GET', '/csrf');
        }).then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            const currentCardId = startResponse.body.cardId;

            expect(currentCardId).to.exist;

            return cy.request({
                method: 'GET',
                url: `/collections/${collectionId}/cards?page=0&size=20`
            }).then((cardsResponse) => {
                expect(cardsResponse.status).to.equal(200);

                const nonCurrentCard = cardsResponse.body.content.find(
                    (card) => card.id !== currentCardId
                );

                expect(nonCurrentCard).to.exist;

                return cy.request({
                    method: 'GET',
                    url: `/reviews/collections/${collectionId}/cards/${nonCurrentCard.id}/review`,
                    failOnStatusCode: false
                });
            });
        }).then((reviewResponse) => {
            expect(reviewResponse.status).to.equal(400);
        });
    });

    it('should complete the review when the user remembers the card', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            });
        }).then((reviewResponse) => {
            expect(reviewResponse.status).to.equal(200);

            return cy.request('GET', '/csrf');
        }).then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                body: {
                    result: 'REMEMBERED'
                }
            });
        }).then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);
            expect(resultResponse.body.completed).to.be.true;
            expect(resultResponse.body.nextCard).to.be.null;
            expect(resultResponse.body.progress.completedCards).to.equal(1);
            expect(resultResponse.body.progress.totalCards).to.equal(1);
            expect(resultResponse.body.progress.percentage).to.equal(100);
        });
    });

    it('should reset the review stage when the user does not remember the card', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            });
        }).then((reviewResponse) => {
            expect(reviewResponse.status).to.equal(200);

            return cy.request('GET', '/csrf');
        }).then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                body: {
                    result: 'NOT_REMEMBERED'
                }
            });
        }).then((resultResponse) => {
            expect(resultResponse.status).to.equal(200);
            expect(resultResponse.body.completed).to.be.true;
            expect(resultResponse.body.nextCard).to.be.null;

            expect(resultResponse.body.progress.completedCards).to.equal(1);
            expect(resultResponse.body.progress.totalCards).to.equal(1);
            expect(resultResponse.body.progress.percentage).to.equal(100);
        });
    });

    it('should not reveal a card from a different collection than the active review session', () => {

        const otherCollectionName = `Other Collection ${Date.now()}`;

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: {
                    name: otherCollectionName
                }
            });
        }).then((createResponse) => {
            expect(createResponse.status).to.equal(201);

            return cy.request({
                method: 'GET',
                url: '/collections'
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const otherCollection = response.body.find(
                (collection) => collection.name === otherCollectionName
            );

            expect(otherCollection).to.exist;

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/collections/${otherCollection.id}/cards`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        front: 'What is Python?',
                        back: 'A programming language.',
                        notes: 'Card from another collection'
                    }
                }).then((cardResponse) => {
                    expect(cardResponse.status).to.equal(201);

                    return cy.request({
                        method: 'GET',
                        url: `/collections/${otherCollection.id}/cards`
                    });
                }).then((cardsResponse) => {
                    expect(cardsResponse.status).to.equal(200);

                    const otherCard = cardsResponse.body.content.find(
                        (card) => card.front === 'What is Python?'
                    );

                    expect(otherCard).to.exist;

                    return cy.request('GET', '/csrf').then((csrfResponse) => {
                        const csrfToken = csrfResponse.body.token;

                        return cy.request({
                            method: 'POST',
                            url: `/reviews/collections/${collectionId}/start`,
                            headers: {'X-CSRF-TOKEN': csrfToken}
                        });
                    }).then((startResponse) => {
                        expect(startResponse.status).to.equal(200);

                        return cy.request({
                            method: 'GET',
                            url: `/reviews/collections/${otherCollection.id}/cards/${otherCard.id}/review`,
                            failOnStatusCode: false
                        });
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

    it('should not submit a result before revealing the card', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {'X-CSRF-TOKEN': csrfToken}
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        result: 'REMEMBERED'
                    },
                    failOnStatusCode: false
                });
            });
        }).then((resultResponse) => {
            expect(resultResponse.status).to.equal(400);
        });
    });

    it('should not submit a result when the result field is missing', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {'X-CSRF-TOKEN': csrfToken}
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            return cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${cardId}/review`
            });
        }).then((reviewResponse) => {
            expect(reviewResponse.status).to.equal(200);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {},
                    failOnStatusCode: false
                });
            });
        }).then((resultResponse) => {
            expect(resultResponse.status).to.equal(400);
        });
    });

    it('should not submit a result for a card that is not in the active review session', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {'X-CSRF-TOKEN': csrfToken}
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            const currentCardId = startResponse.body.cardId;

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/collections/${collectionId}/cards`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        front: 'What is Spring?',
                        back: 'A Java framework.',
                        notes: 'Card created after review session started'
                    }
                });
            }).then((createResponse) => {
                expect(createResponse.status).to.equal(201);

                return cy.request({
                    method: 'GET',
                    url: `/collections/${collectionId}/cards`
                });
            }).then((cardsResponse) => {
                expect(cardsResponse.status).to.equal(200);

                const newCard = cardsResponse.body.content.find(
                    (card) => card.front === 'What is Spring?'
                );

                expect(newCard).to.exist;
                expect(newCard.id).not.to.equal(currentCardId);

                return cy.request('GET', '/csrf').then((csrfResponse) => {
                    const csrfToken = csrfResponse.body.token;

                    return cy.request({
                        method: 'POST',
                        url: `/reviews/collections/${collectionId}/cards/${newCard.id}/result`,
                        headers: {'X-CSRF-TOKEN': csrfToken},
                        body: {
                            result: 'REMEMBERED'
                        },
                        failOnStatusCode: false
                    });
                });
            }).then((resultResponse) => {
                expect(resultResponse.status).to.equal(400);
            });
        });
    });

    it('should not submit a result after the review session has been completed', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {'X-CSRF-TOKEN': csrfToken}
            });
        }).then((startResponse) => {
            expect(startResponse.status).to.equal(200);

            const currentCardId = startResponse.body.cardId;

            return cy.request({
                method: 'GET',
                url: `/reviews/collections/${collectionId}/cards/${currentCardId}/review`
            }).then((revealResponse) => {
                expect(revealResponse.status).to.equal(200);

                return cy.wrap(currentCardId);
            });
        }).then((currentCardId) => {
            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${currentCardId}/result`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {result: 'REMEMBERED'}
                }).then((resultResponse) => {
                    expect(resultResponse.status).to.equal(200);
                    expect(resultResponse.body.completed).to.equal(true);

                    return cy.wrap(currentCardId);
                });
            });
        }).then((currentCardId) => {
            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${currentCardId}/result`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {result: 'REMEMBERED'},
                    failOnStatusCode: false
                });
            });
        }).then((secondResultResponse) => {
            expect(secondResultResponse.status).to.equal(400);
        });
    });

    it('should not submit a result for another user collection', () => {
        const anotherUser = {
            name: 'Another User',
            email: `another-${Date.now()}@example.com`,
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/users',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: anotherUser
            });
        }).then((createUserResponse) => {
            expect(createUserResponse.status).to.equal(201);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        email: anotherUser.email,
                        password: anotherUser.password
                    }
                });
            });
        }).then((loginResponse) => {
            expect(loginResponse.status).to.equal(200);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/cards/${cardId}/result`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {result: 'REMEMBERED'},
                    failOnStatusCode: false
                });
            });
        }).then((resultResponse) => {
            expect(resultResponse.status).to.equal(404);
        });
    });

    it('should start a review and return the first available card', () => {
        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: `/reviews/collections/${collectionId}/start`,
                headers: {'X-CSRF-TOKEN': csrfToken}
            });
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
        const emptyCollectionName = `Empty Collection ${Date.now()}`;

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: {
                    name: emptyCollectionName
                }
            });
        }).then((response) => {
            expect(response.status).to.equal(201);

            return cy.request({
                method: 'GET',
                url: '/collections'
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const emptyCollection = response.body.find(
                (collection) => collection.name === emptyCollectionName
            );

            expect(emptyCollection).to.exist;

            const emptyCollectionId = emptyCollection.id;

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${emptyCollectionId}/start`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    failOnStatusCode: false
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(400);
        });
    });

    it('should not start a review for another user collection', () => {
        const anotherUser = {
            name: 'Another Review E2E User',
            email: `e2e-review-other-${Date.now()}-${Math.random()}@memorizez.com`,
            password: 'password123',
            confirmPassword: 'password123'
        };

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/users',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: anotherUser
            });
        }).then((response) => {
            expect(response.status).to.equal(201);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        email: anotherUser.email,
                        password: anotherUser.password
                    }
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/start`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    failOnStatusCode: false
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('should not start a review when the collection has no cards', () => {
        const emptyCollectionName = `Empty Collection ${Date.now()}`;

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/collections',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: {
                    name: emptyCollectionName
                }
            });
        }).then((response) => {
            expect(response.status).to.equal(201);

            return cy.request({
                method: 'GET',
                url: '/collections'
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            const emptyCollection = response.body.find(
                (collection) => collection.name === emptyCollectionName
            );

            expect(emptyCollection).to.exist;

            const emptyCollectionId = emptyCollection.id;

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${emptyCollectionId}/start`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    failOnStatusCode: false
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(400);
        });
    });

    it('should not start a review for another user collection', () => {
        const anotherUser = {
            name: 'Another Review E2E User',
            email: `e2e-review-other-${Date.now()}-${Math.random()}@memorizez.com`,
            password: 'password123',
            confirmPassword: 'password123'
        };

        cy.request('GET', '/csrf').then((csrfResponse) => {
            const csrfToken = csrfResponse.body.token;

            return cy.request({
                method: 'POST',
                url: '/users',
                headers: {'X-CSRF-TOKEN': csrfToken},
                body: anotherUser
            });
        }).then((response) => {
            expect(response.status).to.equal(201);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: '/users/login',
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    body: {
                        email: anotherUser.email,
                        password: anotherUser.password
                    }
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(200);

            return cy.request('GET', '/csrf').then((csrfResponse) => {
                const csrfToken = csrfResponse.body.token;

                return cy.request({
                    method: 'POST',
                    url: `/reviews/collections/${collectionId}/start`,
                    headers: {'X-CSRF-TOKEN': csrfToken},
                    failOnStatusCode: false
                });
            });
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

});