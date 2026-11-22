package com.base62.url;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UrlRepository extends JpaRepository<UrlEntity, Long> {

    Optional<UrlEntity> findByShortCode(String shortCode);

    Optional<UrlEntity> findByCustomAlias(String customAlias);

    @Query("SELECT u FROM UrlEntity u WHERE u.shortCode = :identifier OR u.customAlias = :identifier")
    Optional<UrlEntity> findByIdentifier(@Param("identifier") String identifier);

    Page<UrlEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    boolean existsByShortCode(String shortCode);

    boolean existsByCustomAlias(String customAlias);

    @Modifying
    @Query("UPDATE UrlEntity u SET u.clickCount = u.clickCount + 1, u.updatedAt = :now WHERE u.id = :id")
    void incrementClickCount(@Param("id") Long id, @Param("now") java.time.Instant now);
}
