package com.memorizez.memorizez.collection.exeption;

public class CollectionNotFoundException extends RuntimeException {

    public CollectionNotFoundException(String message) {
        super(message);
    }
}