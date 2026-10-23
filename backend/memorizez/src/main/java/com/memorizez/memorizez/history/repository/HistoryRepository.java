package com.memorizez.memorizez.history.repository;

import com.memorizez.memorizez.history.History;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoryRepository extends JpaRepository<History, String> {

    Page<History> findByCardIdOrderByCreatedAtDesc(
            String cardId,
            Pageable pageable
    );
}
