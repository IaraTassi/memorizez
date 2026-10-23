package com.memorizez.memorizez.collection.repository;

import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, String> {

    List<Collection> findAllByUserOrderByCreatedAtDesc(User user);

    Optional<Collection> findByIdAndUser(String id, User user);
}
